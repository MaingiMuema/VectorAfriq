import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getAgentDashboardStats } from "@/lib/seo/agent-runner";

/**
 * GET /api/admin/seo/agent/status
 * Dashboard overview: counts, last run per agent type, recent runs.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getAgentDashboardStats();

    // Recent runs for timeline
    const recentRuns = await query(
      `SELECT id, agentType, status, startedAt, completedAt, itemsProcessed, summary, costUsd
       FROM seo_agent_run
       ORDER BY startedAt DESC
       LIMIT 10`
    );

    return NextResponse.json({
      success: true,
      stats,
      recentRuns,
    });
  } catch (error) {
    console.error("[SEO Agent] Status fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
