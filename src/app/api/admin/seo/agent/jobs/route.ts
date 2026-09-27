import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { listActiveJobs } from "@/lib/seo/jobs";

/**
 * GET /api/admin/seo/agent/jobs?active=1
 * Returns queued/claimed/running jobs with their latest step, for the dashboard's
 * polling progress UI (Phase 1.2).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeOnly = request.nextUrl.searchParams.get("active") === "1";
    const jobs = activeOnly
      ? await listActiveJobs()
      : await query("SELECT * FROM seo_agent_job ORDER BY createdAt DESC LIMIT 20");

    const jobsWithSteps = await Promise.all(
      jobs.map(async (job) => {
        const steps = await query<Record<string, unknown>>(
          "SELECT * FROM seo_agent_run_step WHERE runId = ? ORDER BY startedAt ASC",
          [(job as { id: string }).id]
        );
        return { ...job, steps };
      })
    );

    return NextResponse.json({ success: true, jobs: jobsWithSteps });
  } catch (error) {
    console.error("[SEO Agent API] Jobs fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
