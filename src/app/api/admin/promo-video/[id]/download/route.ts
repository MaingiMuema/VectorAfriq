import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createReadStream, existsSync, statSync } from "fs";
import { join } from "path";
import { authOptions } from "@/lib/auth";
import { getJob, jobDir } from "@/lib/promo-video/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/promo-video/:id/download?format=landscape|vertical&inline=1
 * Streams the rendered mp4. `inline=1` renders in a <video> preview instead of
 * forcing a download.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const id = segments[segments.length - 2];

  const format = request.nextUrl.searchParams.get("format") === "vertical" ? "vertical" : "landscape";
  const inline = request.nextUrl.searchParams.get("inline") === "1";

  try {
    const job = await getJob(id);
    if (!job || job.status !== "completed") {
      return NextResponse.json({ error: "Video not ready" }, { status: 404 });
    }

    const file = format === "vertical" ? job.videoFileVertical : job.videoFile;
    if (!file) {
      return NextResponse.json(
        { error: `No ${format} video for this job` },
        { status: 404 }
      );
    }

    const fullPath = join(jobDir(id), file);
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "Video file missing on disk" }, { status: 404 });
    }

    const stats = statSync(fullPath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: "Video file is not a regular file" }, { status: 404 });
    }
    const filename = `promo-${id}-${format}.mp4`;

    const headers: Record<string, string> = {
      "Content-Type": "video/mp4",
      "Content-Length": String(stats.size),
      "Cache-Control": "private, max-age=3600",
    };
    if (inline) {
      headers["Content-Disposition"] = `inline; filename="${filename}"`;
    } else {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    const stream = createReadStream(fullPath);
    return new Response(stream as unknown as BodyInit, { headers });
  } catch (error) {
    console.error("[PromoVideo API] Download failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
