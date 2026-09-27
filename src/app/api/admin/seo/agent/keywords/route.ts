import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * GET /api/admin/seo/agent/keywords
 * List keywords with pagination, filtering, and sorting.
 * 
 * Query params: cluster, status, intent, sortBy, limit, offset, search
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cluster = searchParams.get("cluster");
    const status = searchParams.get("status");
    const intent = searchParams.get("intent");
    const sortBy = searchParams.get("sortBy") || "priority";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");

    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (cluster) {
      conditions.push("cluster = ?");
      params.push(cluster);
    }
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }
    if (intent) {
      conditions.push("intent = ?");
      params.push(intent);
    }
    if (search) {
      conditions.push("keyword LIKE ?");
      params.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Validate sort column
    const validSorts: Record<string, string> = {
      priority: "priority DESC",
      keyword: "keyword ASC",
      volume: "searchVolumeEst DESC",
      difficulty: "difficulty ASC",
      rank: "currentRank ASC",
      updated: "updatedAt DESC",
    };
    const orderBy = validSorts[sortBy] || validSorts.priority;

    const keywords = await query(
      `SELECT * FROM seo_keyword ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [{ count }] = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM seo_keyword ${whereClause}`,
      params
    );

    // Get unique clusters for filter dropdown
    const clusters = await query<{ cluster: string; count: number }>(
      `SELECT cluster, COUNT(*) as count FROM seo_keyword WHERE cluster IS NOT NULL GROUP BY cluster ORDER BY count DESC`
    );

    return NextResponse.json({
      success: true,
      keywords,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count,
      },
      clusters,
    });
  } catch (error) {
    console.error("[SEO Agent] Keywords fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
