/**
 * Agent 1: Keyword Discovery Agent (v2 — web-powered)
 *
 * Discovers target keywords using REAL web data:
 * 1. Extracts location + category + type combinations from live property data
 * 2. Fetches Google + Bing autocomplete suggestions for each seed
 * 3. Scrapes SERPs to find related searches + competitor keywords
 * 4. Analyzes competitor pages for keyword density data
 * 5. Uses LLM to cluster, score, and prioritize everything
 */

import { v4 as uuid } from "uuid";
import { query } from "@/lib/db";
import { callLLMForJSON, getMODELS } from "../openrouter";
import { startAgentRun, completeAgentRun, logAgentWarning, type AgentRunContext } from "../agent-runner";
import {
  getExpandedAutocomplete,
  getSerpInsights,
  getRelatedSearches,
  analyzeCompetitors,
  type AutocompleteSuggestion,
} from "../web-tools";

interface PropertySeed {
  category: string;
  type: string;
  locationPart: string;
  count: number;
}

interface RawKeyword {
  keyword: string;
  source: "google_autocomplete" | "bing_autocomplete" | "related_search" | "competitor_page" | "llm_expansion";
  volumeSignal: number; // How often it appeared across sources
}

interface LLMScoredKeyword {
  keyword: string;
  cluster: string;
  intent: "commercial" | "transactional" | "informational" | "navigational";
  difficulty: number;
  priority: number;
  targetUrl: string | null;
}

// Competitor domains to analyze for keyword mining
const COMPETITOR_DOMAINS = [
  "buyrentkenya.com",
  "property24.co.ke",
  "kenyapropertycentre.com",
  "jumiahouse.co.ke",
  "pamgolding.co.ke",
];

export async function runKeywordDiscoveryAgent(triggerManually = false): Promise<string> {
  const ctx = await startAgentRun("keyword_discovery", { triggerManually });
  let totalCost = 0;

  try {
    // Step 1: Extract seed data from property database
    console.log("[Keyword Discovery] Extracting seed data from properties...");
    const seeds = await extractPropertySeeds();
    console.log(`[Keyword Discovery] Found ${seeds.length} seed combinations`);

    // Step 2: Generate seed queries (even with 0 DB properties, use defaults)
    const seedQueries = generateSeedQueries(seeds);
    console.log(`[Keyword Discovery] Generated ${seedQueries.length} seed queries`);

    // Step 3: Fetch real autocomplete + related search data for each seed
    console.log("[Keyword Discovery] Fetching autocomplete + related searches from web...");
    const rawKeywords = await collectRealKeywords(seedQueries);
    console.log(`[Keyword Discovery] Collected ${rawKeywords.length} raw keywords from web sources`);

    // Step 4: Fetch SERP insights for top seed queries to find competitors
    console.log("[Keyword Discovery] Analyzing SERPs for competitor keywords...");
    const competitorKeywords = await mineCompetitorKeywords(seedQueries.slice(0, 5));
    rawKeywords.push(...competitorKeywords);
    console.log(`[Keyword Discovery] +${competitorKeywords.length} keywords from competitor analysis`);

    // Step 5: Use LLM to cluster, score, and deduplicate all keywords
    console.log("[Keyword Discovery] LLM clustering + scoring...");
    const scoringResult = await scoreAndClusterKeywords(rawKeywords, seeds);
    totalCost += scoringResult.costUsd;

    const scoredKeywords = scoringResult.data.keywords || [];
    console.log(`[Keyword Discovery] ${scoredKeywords.length} final scored keywords`);

    // Step 6: Persist to database
    const savedCount = await persistKeywords(scoredKeywords);

    ctx.metrics = {
      keywordsDiscovered: savedCount,
      totalCost,
      modelsUsed: [getMODELS().fast],
    };

    const summary = `Discovered ${savedCount} keywords. Sources: ${rawKeywords.length} raw (${rawKeywords.filter(k => k.source === "google_autocomplete").length} autocomplete, ${rawKeywords.filter(k => k.source === "related_search").length} related, ${rawKeywords.filter(k => k.source === "competitor_page").length} competitor). LLM scored ${scoredKeywords.length}.`;

    await completeAgentRun(ctx.runId, "completed", summary, ctx.metrics);
    return ctx.runId;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Keyword Discovery] Failed:", errorMsg);
    await completeAgentRun(ctx.runId, "failed", `Failed: ${errorMsg}`, { ...ctx.metrics, totalCost }, errorMsg);
    throw error;
  }
}

/**
 * Extract unique category + type + location combinations from the property table.
 */
async function extractPropertySeeds(): Promise<PropertySeed[]> {
  const rows = await query<{ category: string; type: string; locationPart: string; count: number }>(
    `SELECT p.category, p.type,
       TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(p.location, ',', 1), ',', -1)) as locationPart,
       COUNT(*) as count
     FROM property p
     WHERE p.status = 'ACTIVE' AND p.location IS NOT NULL AND p.location != ''
     GROUP BY p.category, p.type, locationPart
     HAVING count >= 2
     ORDER BY count DESC LIMIT 200`
  );

  const cityRows = await query<{ category: string; type: string; locationPart: string; count: number }>(
    `SELECT p.category, p.type,
       TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(p.location, ',', 2), ',', -1)) as locationPart,
       COUNT(*) as count
     FROM property p
     WHERE p.status = 'ACTIVE' AND p.location IS NOT NULL AND p.location != ''
       AND p.location LIKE '%,%'
     GROUP BY p.category, p.type, locationPart
     HAVING count >= 3
     ORDER BY count DESC LIMIT 100`
  );

  return [...rows, ...cityRows].filter(r => r.locationPart && r.locationPart.length > 1);
}

/**
 * Generate seed queries from property data, plus fallback defaults for Kenya real estate.
 */
function generateSeedQueries(seeds: PropertySeed[]): string[] {
  const queries = new Set<string>();

  // From DB seeds
  for (const s of seeds.slice(0, 50)) {
    const type = s.type === "SALE" ? "for sale" : s.type === "RENT" ? "for rent" : s.type.toLowerCase();
    const cat = s.category.toLowerCase();
    queries.add(`${cat} ${type} ${s.locationPart}`);
  }

  // Fallback defaults for Kenya (used when DB is empty or sparse)
  const defaultLocations = [
    "nairobi", "westlands", "kilimani", "lavington", "karen", "ruaka",
    "kitengela", "ongata rongai", "mombasa", "nyali", "kisumu", "nakuru",
  ];
  const defaultTypes = [
    "apartments for sale", "apartments for rent", "houses for sale", "houses for rent",
    "land for sale", "commercial property for sale", "plots for sale",
  ];

  for (const loc of defaultLocations) {
    for (const type of defaultTypes) {
      queries.add(`${type} ${loc}`);
    }
  }

  return Array.from(queries).slice(0, 60);
}

/**
 * Collect real keywords from Google Autocomplete, Bing, and related searches.
 */
async function collectRealKeywords(seedQueries: string[]): Promise<RawKeyword[]> {
  const allKeywords = new Map<string, RawKeyword>();
  let processed = 0;

  // Process seeds in batches to avoid rate limits
  for (const seed of seedQueries) {
    // Get autocomplete suggestions (Google + Bing with modifiers)
    const autocomplete = await getExpandedAutocomplete(seed);

    for (const suggestion of autocomplete) {
      const existing = allKeywords.get(suggestion.keyword.toLowerCase());
      if (existing) {
        existing.volumeSignal++;
      } else {
        allKeywords.set(suggestion.keyword.toLowerCase(), {
          keyword: suggestion.keyword,
          source: suggestion.source === "bing" ? "bing_autocomplete" : "google_autocomplete",
          volumeSignal: 1,
        });
      }
    }

    // Get related searches
    const related = await getRelatedSearches(seed);
    for (const r of related) {
      const existing = allKeywords.get(r.toLowerCase());
      if (existing) {
        existing.volumeSignal++;
      } else {
        allKeywords.set(r.toLowerCase(), {
          keyword: r,
          source: "related_search",
          volumeSignal: 1,
        });
      }
    }

    processed++;
    if (processed % 10 === 0) {
      console.log(`[Keyword Discovery] Processed ${processed}/${seedQueries.length} seeds, ${allKeywords.size} unique keywords`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  return Array.from(allKeywords.values());
}

/**
 * Mine competitor keywords: fetch SERP for top seed queries, then analyze top-ranking
 * competitor pages to extract their targeted keywords.
 */
async function mineCompetitorKeywords(seedQueries: string[]): Promise<RawKeyword[]> {
  const keywords: RawKeyword[] = [];
  const seen = new Set<string>();

  for (const query of seedQueries) {
    const insights = await getSerpInsights(query, "vectorafriqproperties.co.ke");

    // Collect competitor URLs from SERP
    const competitorUrls = insights.competitors
      .filter(c => COMPETITOR_DOMAINS.some(d => c.domain.includes(d)))
      .map(c => c.url)
      .slice(0, 3);

    if (competitorUrls.length === 0) continue;

    // Analyze competitor pages for keyword data
    const competitorData = await analyzeCompetitors(competitorUrls, 2);

    for (const page of competitorData) {
      // Extract keywords from competitor page titles + headings + top keywords
      const pageKeywords = [
        ...page.h1Tags,
        ...page.h2Tags,
        ...page.topKeywords.map(k => k.word),
      ];

      for (const kw of pageKeywords) {
        const normalized = kw.toLowerCase().trim();
        if (normalized.length > 5 && !seen.has(normalized)) {
          seen.add(normalized);
          keywords.push({
            keyword: kw,
            source: "competitor_page",
            volumeSignal: 1,
          });
        }
      }
    }

    // Rate limit between SERP queries
    await new Promise(r => setTimeout(r, 1500));
  }

  return keywords;
}

/**
 * Use LLM to cluster, score, deduplicate, and assign metadata to all collected keywords.
 */
async function scoreAndClusterKeywords(
  rawKeywords: RawKeyword[],
  seeds: PropertySeed[]
): Promise<{ data: { keywords: LLMScoredKeyword[] }; costUsd: number }> {
  // Sort by volume signal (how many sources mentioned them)
  const sorted = [...rawKeywords].sort((a, b) => b.volumeSignal - a.volumeSignal).slice(0, 200);

  const seedContext = seeds.slice(0, 30).map(s => ({
    category: s.category,
    type: s.type === "SALE" ? "for sale" : s.type === "RENT" ? "for rent" : s.type.toLowerCase(),
    location: s.locationPart,
  }));

  const systemPrompt = `You are an expert SEO keyword analyst for vectorafriqproperties.co.ke, a Kenyan real estate website.
You will receive a list of raw keywords collected from Google Autocomplete, Bing, related searches, and competitor page analysis.
Your job is to:
1. Deduplicate and normalize keywords (remove duplicates, fix spelling)
2. Group them into clusters (e.g., "Westlands Apartments", "Kitengela Land")
3. Assign search intent (commercial, transactional, informational, navigational)
4. Score difficulty 1-10 (based on how competitive the keyword is in Kenya)
5. Score priority 1-10 (based on relevance to vectorafriqproperties.co.ke + opportunity)
6. Assign the best target URL on vectorafriqproperties.co.ke for each keyword

Target URL patterns on vectorafriqproperties.co.ke:
- /apartments-for-sale/{county}/{neighborhood}
- /apartments-for-rent/{county}/{neighborhood}
- /houses-for-sale/{county}/{neighborhood}
- /houses-for-rent/{county}/{neighborhood}
- /land-for-sale/{county}/{neighborhood}
- /listings/{slug}/{id} (for individual properties)
- /blogs/{slug} (for informational content)
- / (homepage for broad terms)`;

  const userPrompt = `Score and cluster these ${sorted.length} raw keywords collected from web sources:

${JSON.stringify(sorted.map(k => ({ keyword: k.keyword, source: k.source, frequency: k.volumeSignal })), null, 2)}

Property data context (locations + categories with active listings):
${seedContext.length > 0 ? JSON.stringify(seedContext, null, 2) : "No DB property data — use Kenya-wide defaults"}

Return ALL keywords (deduplicated, normalized) as a JSON object:
{ "keywords": [{ "keyword": "...", "cluster": "...", "intent": "...", "difficulty": 1-10, "priority": 1-10, "targetUrl": "..." }] }`;

  return callLLMForJSON(systemPrompt, userPrompt, { model: getMODELS().fast, maxTokens: 8192 });
}

/**
 * Persist discovered keywords to the database.
 */
async function persistKeywords(keywords: LLMScoredKeyword[]): Promise<number> {
  let savedCount = 0;

  for (const kw of keywords) {
    if (!kw.keyword || kw.keyword.length < 5) continue;

    const id = `kw_${uuid().substring(0, 16)}`;

    // Extract location from target URL if possible
    let location: string | null = null;
    if (kw.targetUrl) {
      const parts = kw.targetUrl.split("/").filter(Boolean);
      if (parts.length >= 3) location = parts[parts.length - 1].replace(/-/g, " ");
    }

    try {
      await query(
        `INSERT INTO seo_keyword (id, keyword, cluster, intent, searchVolumeEst, difficulty, targetUrl, status, priority, location)
         VALUES (?, ?, ?, ?, 0, ?, ?, 'new', ?, ?)
         ON DUPLICATE KEY UPDATE
           difficulty = VALUES(difficulty),
           priority = GREATEST(priority, VALUES(priority)),
           cluster = VALUES(cluster),
           intent = VALUES(intent),
           targetUrl = COALESCE(VALUES(targetUrl), targetUrl),
           updatedAt = CURRENT_TIMESTAMP(3)`,
        [
          id,
          kw.keyword,
          kw.cluster || null,
          kw.intent || "commercial",
          kw.difficulty || 0,
          kw.targetUrl || null,
          kw.priority || 5,
          location,
        ]
      );
      savedCount++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (!msg.includes("Duplicate")) {
        await logAgentWarning("keyword_persist", `Failed to save "${kw.keyword}": ${msg}`);
      }
    }
  }

  return savedCount;
}
