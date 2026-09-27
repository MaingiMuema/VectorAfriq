/**
 * Agent 2: On-Page Optimization Agent (v2 — web-powered)
 *
 * Audits REAL rendered page HTML + generates optimized content:
 * 1. Fetches live HTML from each page to see what Google actually sees
 * 2. Checks title, meta description, headings, canonicals, structured data
 * 3. Detects the double-suffix bug, thin content, missing elements
 * 4. LLM rewrites titles/descriptions with competitor context
 * 5. Creates actionable optimization tasks for admin approval
 */

import { v4 as uuid } from "uuid";
import { query } from "@/lib/db";
import { callLLMForJSON, getMODELS } from "../openrouter";
import { startAgentRun, completeAgentRun, logAgentWarning } from "../agent-runner";
import { classifyUrl, buildListingUrl, type PageType } from "../routes";
import type { IssueType, Severity } from "../types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

interface PageToAudit {
  path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  pageType: string;
}

interface LivePageData {
  path: string;
  status: number;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  h1Tags: string[];
  h2Tags: string[];
  wordCount: number;
  hasStructuredData: boolean;
  imageAltMissing: number;
  imageTotal: number;
  loadTimeMs: number;
}

interface LLMOptimizationResult {
  optimizedTitle: string;
  optimizedDescription: string;
  optimizedKeywords: string;
  reasoning: string;
  issues: Array<{
    type: IssueType;
    severity: Severity;
    description: string;
  }>;
}

const TITLE_OPTIMAL_MIN = 30;
const TITLE_OPTIMAL_MAX = 60;
const DESC_OPTIMAL_MIN = 120;
const DESC_OPTIMAL_MAX = 160;

const DOUBLE_SUFFIX_PATTERNS = [
  /\| VectorAfriq \| VectorAfriq/i,
  /\| VectorAfriq Kenya \| VectorAfriq Kenya/i,
  /VectorAfriq.*VectorAfriq/i,
];

export async function runOnPageOptimizationAgent(triggerManually = false): Promise<string> {
  const ctx = await startAgentRun("on_page_optimization", { triggerManually });
  let totalCost = 0;
  let tasksCreated = 0;
  let pagesAudited = 0;

  try {
    // Step 1: Get pages from DB + critical URLs to crawl live
    console.log("[On-Page Optimization] Building audit list...");
    const dbPages = await query<PageToAudit>(
      `SELECT path, title, description, keywords, 'static' as pageType
       FROM page_meta WHERE isActive = true`
    );

    // Critical pages to always audit via live fetch
    const criticalPaths = [
      "/", "/properties", "/properties-for-sale", "/properties-for-rent",
      "/apartments-for-sale", "/apartments-for-rent", "/houses-for-sale",
      "/houses-for-rent", "/land-for-sale", "/blogs", "/about-us", "/contact-us",
    ];

    // Merge: DB paths + critical paths
    const allPaths = new Set<string>([
      ...dbPages.map(p => p.path),
      ...criticalPaths,
    ]);

    console.log(`[On-Page Optimization] Auditing ${allPaths.size} pages (${dbPages.length} from DB + ${criticalPaths.length} critical)`);

    // Step 2: Fetch live HTML for each page and audit
    for (const path of allPaths) {
      try {
        const liveData = await fetchLivePage(path);
        if (!liveData) continue;

        pagesAudited++;

        // fixes D18 — pageType is derived from the actual URL shape, not hardcoded
        const pageType = classifyUrl(path).pageType;

        // Programmatic checks on REAL rendered HTML
        const programmaticIssues = await auditLivePage(liveData, pageType);
        tasksCreated += programmaticIssues;

        // LLM optimization using real page data
        const dbPage = dbPages.find(p => p.path === path);
        const result = await optimizePageWithLLM(liveData, dbPage || null);
        totalCost += result.costUsd;

        // fixes D9 — never trust unvalidated LLM shape; a model omitting `issues`
        // used to throw here and get silently swallowed by the catch below.
        const issues = Array.isArray(result.data?.issues) ? result.data.issues : [];
        if (issues.length > 0 || result.data?.optimizedTitle !== liveData.title) {
          const taskSaved = await createOptimizationTasks(path, pageType, { ...result.data, issues }, ctx.runId);
          tasksCreated += taskSaved;
        }
      } catch (error) {
        await logAgentWarning(ctx.runId, `Failed to audit ${path}: ${error instanceof Error ? error.message : "unknown"}`);
      }

      // Rate limit live fetches
      await new Promise(r => setTimeout(r, 500));
    }

    // Step 3: Audit sample property listings from DB
    const propertySamples = await query<{ id: string; title: string; description: string; location: string; price: number; bedrooms: number; bathrooms: number; category: string; type: string }>(
      `SELECT id, title, description, location, price, bedrooms, bathrooms, category, type
       FROM property WHERE status = 'ACTIVE' ORDER BY updatedAt DESC LIMIT 20`
    );

    for (const prop of propertySamples) {
      try {
        const pageUrl = buildListingUrl(prop);
        const result = await optimizePropertyWithLLM(prop, pageUrl);
        totalCost += result.costUsd;

        const issues = Array.isArray(result.data?.issues) ? result.data.issues : [];
        if (issues.length > 0) {
          const taskSaved = await createOptimizationTasks(pageUrl, "property_listing", { ...result.data, issues }, ctx.runId);
          tasksCreated += taskSaved;
        }
      } catch (error) {
        await logAgentWarning(ctx.runId, `Failed to optimize property ${prop.id}: ${error instanceof Error ? error.message : "unknown"}`);
      }
    }

    ctx.metrics = {
      pagesAudited,
      tasksCreated,
      totalCost,
      modelsUsed: [getMODELS().fast],
    };

    const summary = `Audited ${pagesAudited} live pages + ${propertySamples.length} property listings. Created ${tasksCreated} optimization tasks.`;
    await completeAgentRun(ctx.runId, "completed", summary, ctx.metrics);
    return ctx.runId;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[On-Page Optimization] Failed:", errorMsg);
    await completeAgentRun(ctx.runId, "failed", `Failed: ${errorMsg}`, { pagesAudited, tasksCreated, totalCost }, errorMsg);
    throw error;
  }
}

/**
 * Fetch a live page and extract SEO-relevant data from the REAL rendered HTML.
 */
async function fetchLivePage(path: string): Promise<LivePageData | null> {
  const url = path.startsWith("http") ? path : `${SITE_URL}${path}`;
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "VectorAfriq-SEO-Bot/1.0" },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });

    const loadTimeMs = Date.now() - startTime;

    if (response.status >= 400) {
      return {
        path, status: response.status, title: null, metaDescription: null,
        canonical: null, h1Tags: [], h2Tags: [], wordCount: 0,
        hasStructuredData: false, imageAltMissing: 0, imageTotal: 0, loadTimeMs,
      };
    }

    const html = await response.text();

    // Count images with/without alt
    const imgRegex = /<img([^>]*)>/gi;
    let imgTotal = 0;
    let imgAltMissing = 0;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      imgTotal++;
      if (!/\balt=["'][^"']+["']/i.test(imgMatch[1])) {
        imgAltMissing++;
      }
    }

    // Word count (strip scripts/styles/tags)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 2).length;

    return {
      path,
      status: response.status,
      title: extractTag(html, "title"),
      metaDescription: extractMetaContent(html, "description"),
      canonical: extractLinkRel(html, "canonical"),
      h1Tags: extractHeadings(html, "h1"),
      h2Tags: extractHeadings(html, "h2"),
      wordCount,
      hasStructuredData: html.includes("application/ld+json"),
      imageAltMissing: imgAltMissing,
      imageTotal: imgTotal,
      loadTimeMs,
    };
  } catch {
    return null;
  }
}

/**
 * Programmatic audit of live page data — detects issues without LLM.
 */
async function auditLivePage(page: LivePageData, pageType: PageType): Promise<number> {
  let issues = 0;

  // 404 or server error
  if (page.status >= 400) {
    await createIssueTask(page.path, pageType, "content_quality", "critical",
      `${page.status}`, null,
      `Page returns HTTP ${page.status} — search engines cannot index this page.`,
    );
    return 1;
  }

  // Double-suffix title bug
  if (page.title) {
    if (DOUBLE_SUFFIX_PATTERNS.some(p => p.test(page.title!))) {
      await createIssueTask(page.path, pageType, "title_duplicate", "high",
        page.title,
        page.title.replace(/\| VectorAfriq Kenya.*$/i, "").trim() + " | VectorAfriq",
        "Double-suffix: 'VectorAfriq' appears twice in title. Fix to save characters.");
      issues++;
    }

    const titleLen = page.title.length;
    if (titleLen > 65) {
      await createIssueTask(page.path, pageType, "title_length", "medium",
        page.title, null,
        `Title is ${titleLen} chars (optimal: ${TITLE_OPTIMAL_MIN}-${TITLE_OPTIMAL_MAX}). Google truncates at ~60.`);
      issues++;
    } else if (titleLen < 15) {
      await createIssueTask(page.path, pageType, "title_length", "high",
        page.title, null,
        `Title is only ${titleLen} chars — too short. Add keywords.`);
      issues++;
    }
  } else {
    await createIssueTask(page.path, pageType, "title_length", "critical",
      null, null, "Page has no <title> tag. This is a critical SEO failure.");
    issues++;
  }

  // Meta description
  if (!page.metaDescription || page.metaDescription.length < 50) {
    await createIssueTask(page.path, pageType, "meta_description", "high",
      page.metaDescription || "(empty)", null,
      "Meta description missing or too short. Hurts CTR from search results.");
    issues++;
  } else if (page.metaDescription.length > DESC_OPTIMAL_MAX) {
    await createIssueTask(page.path, pageType, "meta_description", "medium",
      page.metaDescription, null,
      `Meta description is ${page.metaDescription.length} chars (optimal: ${DESC_OPTIMAL_MIN}-${DESC_OPTIMAL_MAX}).`);
    issues++;
  }

  // Missing canonical
  if (!page.canonical) {
    await createIssueTask(page.path, pageType, "canonical", "medium",
      null, null, "Page has no canonical link tag — risks duplicate content issues.");
    issues++;
  }

  // Missing structured data — only pages where schema is actually expected (fixes D10's noise complaint)
  if (!page.hasStructuredData && ["property_listing", "blog_post", "location_page"].includes(pageType)) {
    await createIssueTask(page.path, pageType, "structured_data", "low",
      null, null, "No JSON-LD structured data found. Rich results won't appear in Google.");
    issues++;
  }

  // Thin content
  if (page.wordCount > 0 && page.wordCount < 100) {
    await createIssueTask(page.path, pageType, "thin_content", "medium",
      `${page.wordCount} words`, null,
      `Page has only ${page.wordCount} words of content. Expand to 300+ words for better rankings.`);
    issues++;
  }

  // Missing H1
  if (page.h1Tags.length === 0) {
    await createIssueTask(page.path, pageType, "heading_structure", "high",
      null, null, "Page has no H1 tag. Every page needs exactly one H1 with the primary keyword.");
    issues++;
  } else if (page.h1Tags.length > 1) {
    await createIssueTask(page.path, pageType, "heading_structure", "medium",
      page.h1Tags.join(" | "), null,
      `Page has ${page.h1Tags.length} H1 tags. Use only one H1 per page.`);
    issues++;
  }

  // Missing alt text
  if (page.imageAltMissing > 0 && page.imageTotal > 0) {
    const pct = Math.round((page.imageAltMissing / page.imageTotal) * 100);
    if (pct > 30) {
      await createIssueTask(page.path, pageType, "missing_alt", "medium",
        `${page.imageAltMissing}/${page.imageTotal} images`, null,
        `${page.imageAltMissing} of ${page.imageTotal} images (${pct}%) are missing alt text. Add descriptive alt tags for image SEO.`);
      issues++;
    }
  }

  // Slow page
  if (page.loadTimeMs > 3000) {
    await createIssueTask(page.path, pageType, "content_quality", "medium",
      `${page.loadTimeMs}ms`, null,
      `Page load time: ${(page.loadTimeMs / 1000).toFixed(1)}s. Target < 3s for Core Web Vitals.`);
    issues++;
  }

  return issues;
}

// ─── HTML Helpers ────────────────────────────────────────────────────────────

function extractTag(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "is");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractMetaContent(html: string, name: string): string | null {
  const regex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "is");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractLinkRel(html: string, rel: string): string | null {
  const regex = new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*)["']`, "is");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractHeadings(html: string, level: string): string[] {
  const headings: string[] = [];
  const regex = new RegExp(`<${level}[^>]*>(.*?)</${level}>`, "gis");
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, "").trim();
    if (text.length > 2) headings.push(text);
  }
  return headings;
}

// ─── LLM Optimization ────────────────────────────────────────────────────────

/**
 * LLM optimization using REAL live page data (not just DB values).
 */
async function optimizePageWithLLM(
  live: LivePageData,
  dbPage: PageToAudit | null
): Promise<{ data: LLMOptimizationResult; costUsd: number }> {
  const systemPrompt = `You are an expert SEO copywriter for vectorafriqproperties.co.ke, a Kenyan real estate website.
Analyze the page data below (from REAL rendered HTML) and provide optimized title + meta description.

Rules:
- Title: 50-60 chars, primary keyword near start, "| VectorAfriq" at end (once only)
- Meta description: 120-160 chars, compelling, includes call-to-action
- NEVER duplicate brand name in the title
- Use Kenya-specific real estate language
- Only suggest changes if there's a real improvement`;

  const userPrompt = `Analyze this page:

Path: ${live.path}
LIVE Title: ${live.title || "(missing)"}
LIVE Meta Description: ${live.metaDescription || "(missing)"}
Canonical: ${live.canonical || "(missing)"}
H1 tags: ${live.h1Tags.join(", ") || "(none)"}
H2 tags: ${live.h2Tags.join(", ") || "(none)"}
Word count: ${live.wordCount}
Structured data: ${live.hasStructuredData ? "Present" : "Missing"}
Images without alt: ${live.imageAltMissing}/${live.imageTotal}
${dbPage ? `DB Keywords: ${dbPage.keywords || "(none)"}` : ""}

Provide:
1. optimizedTitle: Better title (50-60 chars)
2. optimizedDescription: Better meta description (120-160 chars)
3. optimizedKeywords: Better keywords
4. reasoning: Why your version is better
5. issues: Array of { type, severity, description }

Only suggest changes if there's a real improvement. Return empty issues if already good.`;

  return callLLMForJSON<LLMOptimizationResult>(systemPrompt, userPrompt, {
    model: getMODELS().fast,
    maxTokens: 1024,
  });
}

async function optimizePropertyWithLLM(
  property: { id: string; title: string; description: string; location: string; price: number; bedrooms: number; bathrooms: number; category: string; type: string },
  pageUrl: string
): Promise<{ data: LLMOptimizationResult; costUsd: number }> {
  const plainDesc = property.description
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .trim()
    .substring(0, 300);

  const systemPrompt = `You are an expert SEO copywriter for a Kenyan real estate website.
Optimize this property listing's title and meta description.

Rules:
- Title: "[Property Type] for [Sale/Rent] in [Location] - [Key Feature] | VectorAfriq" (under 65 chars)
- Meta description: 120-160 chars with bedrooms, bathrooms, price, location`;

  const userPrompt = `Optimize this property:

Title: ${property.title}
Description: ${plainDesc}
Location: ${property.location}
Price: KSh ${property.price?.toLocaleString()}
Bedrooms: ${property.bedrooms} | Bathrooms: ${property.bathrooms}
Category: ${property.category} | Type: ${property.type}
URL: ${pageUrl}

Provide optimizedTitle, optimizedDescription, reasoning, and issues array.`;

  return callLLMForJSON<LLMOptimizationResult>(systemPrompt, userPrompt, {
    model: getMODELS().fast,
    maxTokens: 768,
  });
}

// ─── Task Creation ───────────────────────────────────────────────────────────

async function createOptimizationTasks(
  pageUrl: string,
  pageType: string,
  result: LLMOptimizationResult,
  runId: string
): Promise<number> {
  let count = 0;

  for (const issue of result.issues) {
    await createIssueTask(pageUrl, pageType, issue.type, issue.severity, null, null, issue.description, runId);
    count++;
  }

  if (result.optimizedTitle || result.optimizedDescription) {
    const id = `task_${uuid().substring(0, 16)}`;
    await query(
      `INSERT INTO seo_optimization_task (id, pageUrl, pageType, issueType, severity, currentValue, proposedValue, llmReasoning, status, agentRunId)
       VALUES (?, ?, ?, 'content_quality', 'medium', ?, ?, ?, 'pending', ?)
       ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP(3)`,
      [
        id, pageUrl, pageType,
        JSON.stringify({ title: result.optimizedTitle, description: result.optimizedDescription }),
        JSON.stringify({ optimizedTitle: result.optimizedTitle, optimizedDescription: result.optimizedDescription }),
        result.reasoning, runId,
      ]
    );
    count++;
  }

  return count;
}

async function createIssueTask(
  pageUrl: string,
  pageType: string,
  issueType: IssueType,
  severity: Severity,
  currentValue: string | null,
  proposedValue: string | null,
  description: string,
  runId?: string
): Promise<void> {
  const id = `task_${uuid().substring(0, 16)}`;
  await query(
    `INSERT IGNORE INTO seo_optimization_task (id, pageUrl, pageType, issueType, severity, currentValue, proposedValue, llmReasoning, status, agentRunId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [id, pageUrl, pageType, issueType, severity, currentValue, proposedValue, description, runId || null]
  );
}
