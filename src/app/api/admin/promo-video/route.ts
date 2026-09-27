import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createJob, listJobs } from "@/lib/promo-video/jobs";
import { resolvePromoModel } from "@/lib/promo-video/config";
import type { PromoVideoFormat } from "@/lib/promo-video/types";

const VALID_FORMATS: PromoVideoFormat[] = ["landscape", "vertical", "both"];

/**
 * GET /api/admin/promo-video?page=1&limit=20
 * Lists promo video jobs (newest first).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "20", 10) || 20));
    const jobs = await listJobs(limit, (page - 1) * limit);
    return NextResponse.json({ success: true, jobs, page, limit });
  } catch (error) {
    console.error("[PromoVideo API] List failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/promo-video
 * Body: { prompt, model?, format?, assets?: string[] }
 * Enqueues a job and returns 202 — the worker renders it out-of-band.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt || prompt.length < 10) {
      return NextResponse.json(
        { error: "Prompt must be at least 10 characters" },
        { status: 400 }
      );
    }
    if (prompt.length > 4000) {
      return NextResponse.json({ error: "Prompt is too long (max 4000 chars)" }, { status: 400 });
    }

    const model = resolvePromoModel(typeof body.model === "string" ? body.model : null);
    const format: PromoVideoFormat = VALID_FORMATS.includes(body.format)
      ? body.format
      : "landscape";

    const assets = Array.isArray(body.assets)
      ? (body.assets as unknown[])
          .filter((a): a is string => typeof a === "string" && a.trim().length > 0)
          .map((a) => a.trim())
          .slice(0, 20)
      : [];

    const job = await createJob({
      prompt,
      model,
      format,
      uploadedAssets: assets.length > 0 ? assets : undefined,
      userId: session.user.id,
      createdBy: session.user.email || "admin",
    });

    return NextResponse.json({ success: true, job }, { status: 202 });
  } catch (error) {
    console.error("[PromoVideo API] Create failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
