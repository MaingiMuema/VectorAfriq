/**
 * Agent 3: Content Strategy Agent (v2 — web-powered)
 *
 * Identifies content gaps and opportunities using real competitor data:
 * 1. Location pages that exist but have no dedicated landing page
 * 2. Thin content pages that need expansion
 * 3. Competitor content analysis — what they rank with that we don't have
 * 4. Blog topics based on real keyword gaps (not LLM guesses)
 * 5. Internal linking opportunities
 */

import { v4 as uuid } from "uuid";
import { query } from "@/lib/db";
import { callLLMForJSON, getMODELS } from "../openrouter";
import { startAgentRun, completeAgentRun, logAgentWarning } from "../agent-runner";
import { getSerpInsights, analyzeCompetitors, type CompetitorPageData } from "../web-tools";

// Competitor domains to analyze
const COMPETITORS = [
  "buyrentkenya.com",
  "property24.co.ke",
  "kenyapropertycentre.com",
  "pamgolding.co.ke",
];

export async function runContentStrategyAgent(triggerManually = false): Promise<string> {
  const ctx = await startAgentRun("content_strategy", { triggerManually });
  let totalCost = 0;
  let gapsFound = 0;

  try {
    // Step 1: Find locations with properties but no dedicated page
    console.log("[Content Strategy] Finding location coverage gaps...");
    const locationGaps = await findLocationGaps();
    for (const gap of locationGaps) {
      await persistContentGap({
        gapType: "missing_location_page",
        title: `${gap.category} for ${gap.typeDisplay} in ${gap.location}`,
        targetKeyword: `${gap.category.toLowerCase()} for ${gap.typeDisplay.toLowerCase()} in ${gap.location.toLowerCase()}`,
        suggestedUrl: gap.suggestedUrl,
        contentBrief: `Create a dedicated landing page for ${gap.category.toLowerCase()} for ${gap.typeDisplay.toLowerCase()} in ${gap.location}. ${gap.propertyCount} active listings exist but have no dedicated page. Include: property grid, location description, average prices, neighborhood guide.`,
        priorityScore: Math.min(10, gap.propertyCount / 2),
        competitorUrls: null,
        propertyCount: gap.propertyCount,
      });
      gapsFound++;
    }

    // Step 2: Find thin content pages
    console.log("[Content Strategy] Finding thin content pages...");
    const thinPages = await query<{ path: string; title: string; description: string }>(
      `SELECT path, title, description FROM page_meta
       WHERE isActive = true AND (LENGTH(description) < 80 OR description IS NULL)`
    );

    for (const page of thinPages) {
      await persistContentGap({
        gapType: "thin_content",
        title: `Expand content: ${page.title || page.path}`,
        targetKeyword: page.title || page.path,
        suggestedUrl: page.path,
        contentBrief: `Page "${page.path}" has thin content (${page.description?.length || 0} chars). Expand to 300+ words with local market insights, property highlights, and buying/renting tips.`,
        priorityScore: 5,
        competitorUrls: null,
        propertyCount: 0,
      });
      gapsFound++;
    }

    // Step 3: Competitor content analysis — find what keywords competitors rank for
    // that we don't have content for
    console.log("[Content Strategy] Analyzing competitor content...");
    const competitorGaps = await findCompetitorContentGaps();
    for (const gap of competitorGaps) {
      await persistContentGap(gap);
      gapsFound++;
    }

    // Step 4: Generate blog topics based on REAL keyword gaps
    console.log("[Content Strategy] Generating blog topics from keyword data...");
    try {
      const blogResult = await generateBlogTopicsFromRealData();
      totalCost += blogResult.costUsd;

      for (const topic of blogResult.data.topics) {
        await persistContentGap({
          gapType: "blog_topic",
          title: topic.title,
          targetKeyword: topic.targetKeyword,
          suggestedUrl: topic.suggestedUrl,
          contentBrief: topic.contentBrief,
          priorityScore: topic.priorityScore,
          competitorUrls: topic.competitorUrls || null,
          propertyCount: 0,
        });
        gapsFound++;
      }
    } catch (error) {
      await logAgentWarning(ctx.runId, `Blog topics failed: ${error instanceof Error ? error.message : "unknown"}`);
    }

    ctx.metrics = {
      contentGapsFound: gapsFound,
      totalCost,
      modelsUsed: [getMODELS().fast],
    };

    const summary = `Found ${gapsFound} content gaps: ${locationGaps.length} missing pages, ${thinPages.length} thin content, ${competitorGaps.length} competitor gaps, plus blog topics from real keyword data.`;
    await completeAgentRun(ctx.runId, "completed", summary, ctx.metrics);
    return ctx.runId;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Content Strategy] Failed:", errorMsg);
    await completeAgentRun(ctx.runId, "failed", `Failed: ${errorMsg}`, { contentGapsFound: gapsFound, totalCost }, errorMsg);
    throw error;
  }
}

/**
 * Find locations with active properties but no sitemap URL.
 */
async function findLocationGaps(): Promise<
  Array<{
    location: string;
    category: string;
    typeDisplay: string;
    propertyCount: number;
    suggestedUrl: string;
  }>
> {
  const locations = await query<{ locationPart: string; category: string; type: string; count: number }>(
    `SELECT
       TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(p.location, ',', 1), ',', -1)) as locationPart,
       p.category, p.type, COUNT(*) as count
     FROM property p
     WHERE p.status = 'ACTIVE' AND p.location IS NOT NULL AND p.location != ''
     GROUP BY locationPart, p.category, p.type
     HAVING count >= 3 ORDER BY count DESC LIMIT 50`
  );

  const existingUrls = await query<{ url: string }>(
    "SELECT url FROM sitemap_url WHERE isActive = true"
  );
  const existingUrlSet = new Set(existingUrls.map(u => u.url.toLowerCase()));

  const gaps: Array<{
    location: string;
    category: string;
    typeDisplay: string;
    propertyCount: number;
    suggestedUrl: string;
  }> = [];

  for (const loc of locations) {
    const typeDisplay = loc.type === "SALE" ? "Sale" : loc.type === "RENT" ? "Rent" : "Airbnb";
    const categorySlug = loc.category.toLowerCase().replace(/\s+/g, "-");
    const typeSlug = loc.type === "SALE" ? "for-sale" : loc.type === "RENT" ? "for-rent" : "airbnb";
    const locationSlug = loc.locationPart.toLowerCase().replace(/\s+/g, "-");
    const suggestedUrl = `/${categorySlug}-${typeSlug}/${locationSlug}`;

    const hasExisting = Array.from(existingUrlSet).some(url =>
      url.includes(locationSlug) && url.includes(typeSlug)
    );

    if (!hasExisting && loc.locationPart.length > 2) {
      gaps.push({ location: loc.locationPart, category: loc.category, typeDisplay, propertyCount: loc.count, suggestedUrl });
    }
  }

  return gaps.slice(0, 30);
}

/**
 * Analyze what competitors rank for that we don't cover.
 * Fetches SERPs for our top keywords, scrapes competitor pages, identifies content we're missing.
 */
async function findCompetitorContentGaps(): Promise<
  Array<{
    gapType: string;
    title: string;
    targetKeyword: string;
    suggestedUrl: string;
    contentBrief: string;
    priorityScore: number;
    competitorUrls: string[] | null;
    propertyCount: number;
  }>
> {
  // Get our top tracked keywords where we don't rank but competitors do
  const keywords = await query<{ id: string; keyword: string }>(
    `SELECT id, keyword FROM seo_keyword
     WHERE (currentRank IS NULL OR currentRank > 20)
     ORDER BY priority DESC LIMIT 10`
  );

  const gaps: Array<{
    gapType: string;
    title: string;
    targetKeyword: string;
    suggestedUrl: string;
    contentBrief: string;
    priorityScore: number;
    competitorUrls: string[] | null;
    propertyCount: number;
  }> = [];

  for (const kw of keywords) {
    const insights = await getSerpInsights(kw.keyword, "vectorafriqproperties.co.ke");

    // Find competitor URLs to analyze
    const competitorUrls = insights.competitors
      .filter(c => COMPETITORS.some(d => c.domain.includes(d)))
      .map(c => c.url)
      .slice(0, 2);

    if (competitorUrls.length === 0) continue;

    // Analyze the competitor pages
    const competitorPages = await analyzeCompetitors(competitorUrls, 2);

    if (competitorPages.length === 0) continue;

    // Build a gap analysis from the competitor page data
    const competitorContent = competitorPages.map(p => ({
      url: p.url,
      title: p.title,
      wordCount: p.wordCount,
      h1: p.h1Tags,
      h2: p.h2Tags,
      topKeywords: p.topKeywords.slice(0, 10).map(k => k.word),
      hasStructuredData: p.hasStructuredData,
    }));

    gaps.push({
      gapType: "missing_landing",
      title: `Create content targeting "${kw.keyword}" (competitors rank, we don't)`,
      targetKeyword: kw.keyword,
      suggestedUrl: insights.competitors[0]?.url
        ? `Based on: ${insights.competitors[0].url}`
        : "",
      contentBrief: `Competitors are ranking for "${kw.keyword}" in top ${insights.competitors[0]?.position || "10"}. Their content averages ${Math.round(
        competitorContent.reduce((sum, c) => sum + c.wordCount, 0) / competitorContent.length
      )} words. Cover these topics: ${competitorContent.flatMap(c => c.h2).slice(0, 5).join(", ")}. Include keywords: ${competitorContent.flatMap(c => c.topKeywords).slice(0, 10).join(", ")}.`,
      priorityScore: 8,
      competitorUrls: competitorUrls,
      propertyCount: 0,
    });

    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  return gaps;
}

interface LLMBlogTopics {
  topics: Array<{
    title: string;
    targetKeyword: string;
    suggestedUrl: string;
    contentBrief: string;
    priorityScore: number;
    competitorUrls?: string[];
  }>;
}

/**
 * Generate blog topics using REAL keyword data from the database (not LLM guesses).
 */
async function generateBlogTopicsFromRealData(): Promise<{ data: LLMBlogTopics; costUsd: number }> {
  const existingBlogs = await query<{ title: string }>(
    "SELECT title FROM post WHERE published = true ORDER BY createdAt DESC LIMIT 30"
  );

  // Get keywords with informational intent that have high priority but no target URL
  const targetKeywords = await query<{ keyword: string; cluster: string; priority: number }>(
    `SELECT keyword, cluster, priority FROM seo_keyword
     WHERE intent = 'informational' AND priority >= 6
     ORDER BY priority DESC LIMIT 20`
  );

  // Get keywords where we don't rank (content gap signals)
  const gapKeywords = await query<{ keyword: string; cluster: string }>(
    `SELECT keyword, cluster FROM seo_keyword
     WHERE currentRank IS NULL AND priority >= 5
     ORDER BY priority DESC LIMIT 15`
  );

  const systemPrompt = `You are a content strategist for vectorafriqproperties.co.ke.
Generate blog post topics based on REAL keyword data collected from Google Autocomplete and SERP analysis.

Each topic should:
- Target a specific keyword from the provided list
- Have a compelling, click-worthy title (under 60 chars)
- Include a content brief referencing the keyword cluster
- Get a priority score based on keyword opportunity

Avoid duplicating existing blog titles.`;

  const userPrompt = `Generate 8-10 blog post topics based on this REAL keyword data:

Target keywords (informational, high priority):
${targetKeywords.map(k => `- ${k.keyword} (priority: ${k.priority}, cluster: ${k.cluster})`).join("\n")}

Gap keywords (we don't rank for these yet):
${gapKeywords.map(k => `- ${k.keyword} (${k.cluster})`).join("\n")}

Existing blog titles (avoid these):
${existingBlogs.map(b => `- ${b.title}`).join("\n")}

Return: { "topics": [{ "title": "...", "targetKeyword": "...", "suggestedUrl": "/blogs/...", "contentBrief": "...", "priorityScore": 1-10 }] }`;

  return callLLMForJSON<LLMBlogTopics>(systemPrompt, userPrompt, {
    model: getMODELS().fast,
    maxTokens: 4096,
  });
}

/**
 * Persist a content gap to the database.
 */
async function persistContentGap(gap: {
  gapType: string;
  title: string;
  targetKeyword: string;
  suggestedUrl: string;
  contentBrief: string;
  priorityScore: number;
  competitorUrls: string[] | null;
  propertyCount: number;
}): Promise<void> {
  const id = `gap_${uuid().substring(0, 16)}`;
  await query(
    `INSERT IGNORE INTO seo_content_gap (id, gapType, title, targetKeyword, suggestedUrl, contentBrief, priorityScore, competitorExamples, status, propertyCount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
    [
      id,
      gap.gapType,
      gap.title,
      gap.targetKeyword,
      gap.suggestedUrl,
      gap.contentBrief,
      gap.priorityScore,
      gap.competitorUrls ? JSON.stringify(gap.competitorUrls) : null,
      gap.propertyCount,
    ]
  );
}
