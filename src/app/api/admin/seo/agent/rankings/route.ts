import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * GET /api/admin/seo/agent/rankings
 * Ranking history and trends.
 * 
 * Query params: keywordId (for specific keyword history), limit, days (history window)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get("keywordId");
    const days = parseInt(searchParams.get("days") || "30");

    if (keywordId) {
      // Get ranking history for a specific keyword
      const history = await query(
        `SELECT r.*, k.keyword 
         FROM seo_ranking r 
         JOIN seo_keyword k ON r.keywordId = k.id 
         WHERE r.keywordId = ? 
           AND r.checkedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
         ORDER BY r.checkedAt ASC`,
        [keywordId, days]
      );

      const [keyword] = await query(
        "SELECT * FROM seo_keyword WHERE id = ?",
        [keywordId]
      );

      return NextResponse.json({ success: true, keyword, history });
    }

    // Get overview: all tracked keywords with latest position
    const rankings = await query(
      `SELECT 
         k.id, k.keyword, k.cluster, k.currentRank, k.bestRank, k.lastChecked,
         k.searchVolumeEst, k.difficulty, k.priority, k.status,
         (SELECT r.changeAmount FROM seo_ranking r 
          WHERE r.keywordId = k.id 
          ORDER BY r.checkedAt DESC LIMIT 1) as lastChange,
         (SELECT r.url FROM seo_ranking r 
          WHERE r.keywordId = k.id 
          ORDER BY r.checkedAt DESC LIMIT 1) as rankingUrl
       FROM seo_keyword k
       WHERE k.currentRank IS NOT NULL
       ORDER BY k.currentRank ASC
       LIMIT 100`
    );

    // Summary stats
    const [stats] = await query<{
      totalTracked: number;
      inTop10: number;
      inTop100: number;
      avgPosition: number;
    }>(
      `SELECT 
         COUNT(*) as totalTracked,
         SUM(CASE WHEN currentRank <= 10 THEN 1 ELSE 0 END) as inTop10,
         SUM(CASE WHEN currentRank <= 100 THEN 1 ELSE 0 END) as inTop100,
         ROUND(AVG(currentRank), 1) as avgPosition
       FROM seo_keyword 
       WHERE currentRank IS NOT NULL`
    );

    return NextResponse.json({
      success: true,
      rankings,
      stats: stats || { totalTracked: 0, inTop10: 0, inTop100: 0, avgPosition: 0 },
    });
  } catch (error) {
    console.error("[SEO Agent] Rankings fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
