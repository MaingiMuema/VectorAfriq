import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requestCancelJob } from "@/lib/seo/jobs";

/**
 * POST /api/admin/seo/agent/jobs/:id/cancel
 * Flags a queued/claimed/running job for cancellation. The worker checks this flag
 * between pipeline steps (src/lib/seo/worker.ts) — cancellation is cooperative, not
 * instant, since an in-flight agent call can't be interrupted mid-await.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cancelled = await requestCancelJob(id);
    if (!cancelled) {
      return NextResponse.json({ error: "Job not found or already finished" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Cancellation requested" });
  } catch (error) {
    console.error("[SEO Agent API] Job cancel failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
