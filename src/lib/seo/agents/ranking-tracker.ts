/**
 * Agent 5: Ranking Tracker Agent (v2 — web-powered)
 *
 * Tracks SERP positions using real web data:
 * 1. Fetches all tracked keywords
 * 2. Queries SERPs via DuckDuckGo for each keyword
 * 3. Records our position + competitor positions
 * 4. Tracks competitor movements over time
 * 5. Detects new ranking opportunities (competitors ranking for our target keywords)
 */

import { v4 as uuid } from "uuid";
import { query } from "@/lib/db";
import { startAgentRun, completeAgentRun, logAgentWarning } from "../agent-runner";
import { getSerpInsights } from "../web-tools";

const SITE_DOMAIN = "vectorafriqproperties.co.ke";

// Competitor domains to track alongside ourselves
const TRACKED_COMPETITORS = [
  "buyrentkenya.com",
  "property24.co.ke",
  "kenyapropertycentre.com",
  "pamgolding.co.ke",
];

interface KeywordRow {
  id: string;
  keyword: string;
  currentRank: number | null;
}

export async function runRankingTrackerAgent(triggerManually = false): Promise<string> {
  const ctx = await startAgentRun("ranking_tracker", { triggerManually });

  try {
    const keywords = await query<KeywordRow>(
      `SELECT id, keyword, currentRank
       FROM seo_keyword
       WHERE status IN ('new', 'tracking', 'optimized', 'ranking')
       ORDER BY priority DESC
       LIMIT 50`
    );

    if (keywords.length === 0) {
      await completeAgentRun(ctx.runId, "completed", "No keywords to track. Run keyword_discovery first.", { rankingsTracked: 0 });
      return ctx.runId;
    }

    console.log(`[Ranking Tracker] Tracking ${keywords.length} keywords via live SERP...`);

    let tracked = 0;
    let found = 0;
    let improved = 0;
    let declined = 0;

    for (const kw of keywords) {
      try {
        const insights = await getSerpInsights(kw.keyword, SITE_DOMAIN);

        const newPosition = insights.ourPosition;
        const previousPosition = kw.currentRank;
        const changeAmount = previousPosition && newPosition
          ? previousPosition - newPosition
          : 0;

        // Record our ranking
        await query(
          `INSERT INTO seo_ranking (id, keywordId, position, previousPosition, changeAmount, url, checkedAt, searchEngine)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), 'google')`,
          [
            `rank_${uuid().substring(0, 16)}`,
            kw.id,
            newPosition,
            previousPosition,
            changeAmount,
            insights.ourUrl,
          ]
        );

        // Update keyword record
        const bestRank = newPosition
          ? previousPosition ? Math.min(previousPosition, newPosition) : newPosition
          : previousPosition;

        await query(
          `UPDATE seo_keyword
           SET currentRank = ?, bestRank = ?, lastChecked = CURRENT_TIMESTAMP(3),
               status = CASE WHEN ? IS NOT NULL THEN 'ranking' ELSE status END
           WHERE id = ?`,
          [newPosition, bestRank, newPosition, kw.id]
        );

        // Record competitor positions in the same ranking table (for gap analysis)
        // Store top 3 competitors as a JSON metric
        for (const comp of insights.competitors.slice(0, 3)) {
          await query(
            `INSERT INTO seo_ranking (id, keywordId, position, previousPosition, changeAmount, url, checkedAt, searchEngine)
             VALUES (?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP(3), ?)`,
            [
              `comp_${uuid().substring(0, 16)}`,
              kw.id,
              comp.position,
              null,
              comp.url,
              `competitor:${comp.domain}`,
            ]
          );
        }

        // If competitors rank but we don't, flag this keyword as a gap opportunity
        if (!newPosition && insights.competitors.length > 0) {
          await query(
            `INSERT IGNORE INTO seo_content_gap (id, gapType, title, targetKeyword, suggestedUrl, contentBrief, priorityScore, status, propertyCount)
             VALUES (?, 'missing_landing', ?, ?, ?, ?, 8, 'new', 0)`,
            [
              `gap_${uuid().substring(0, 16)}`,
              `Competitors rank for "${kw.keyword}" but we don't`,
              kw.keyword,
              insights.competitors[0]?.url || null,
              `Competitors (${insights.competitors.slice(0, 3).map(c => c.domain).join(", ")}) are ranking for this keyword. We are not in top 50. Create or optimize a landing page targeting this keyword.`,
            ]
          );
        }

        tracked++;
        if (newPosition) found++;
        if (changeAmount > 0) improved++;
        if (changeAmount < 0) declined++;
      } catch (error) {
        await logAgentWarning(ctx.runId, `Failed to track "${kw.keyword}": ${error instanceof Error ? error.message : "unknown"}`);
      }

      // Rate limit — respect search engines
      await new Promise(r => setTimeout(r, 1500));
    }

    ctx.metrics = { rankingsTracked: tracked, keywordsDiscovered: found };

    const summary = `Tracked ${tracked} keywords via live SERP. We rank for ${found}. Improved: ${improved}. Declined: ${declined}. Competitor gaps identified for keywords where we're absent.`;
    await completeAgentRun(ctx.runId, "completed", summary, ctx.metrics);
    return ctx.runId;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Ranking Tracker] Failed:", errorMsg);
    await completeAgentRun(ctx.runId, "failed", `Failed: ${errorMsg}`, { rankingsTracked: 0 }, errorMsg);
    throw error;
  }
}
