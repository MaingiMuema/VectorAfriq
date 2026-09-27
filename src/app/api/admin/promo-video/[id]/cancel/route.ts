import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cancelJob } from "@/lib/promo-video/jobs";

/**
 * POST /api/admin/promo-video/:id/cancel
 * Cancels a queued/claimed/running job. A running job stops between pipeline
 * stages (the render child process is not force-killed mid-frame).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = request.nextUrl.pathname.split("/").filter(Boolean).slice(-2)[0];
    const cancelled = await cancelJob(id);
    if (!cancelled) {
      return NextResponse.json(
        { error: "Job not found or already finished" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PromoVideo API] Cancel failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
