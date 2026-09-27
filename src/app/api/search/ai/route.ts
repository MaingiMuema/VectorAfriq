import { NextResponse } from "next/server";
import { runAiPropertySearch } from "@/lib/ai-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory rate limiter (per process). Swap for Redis if multi-node.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 15;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "anonymous";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

export async function POST(request: Request) {
  try {
    if (isRateLimited(rateLimitKey(request))) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many AI search requests. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    let body: {
      prompt?: unknown;
      listingType?: unknown;
      previousPrompt?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const rawPrompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!rawPrompt) {
      return NextResponse.json(
        { success: false, error: "Please describe what you're looking for." },
        { status: 400 }
      );
    }

    if (rawPrompt.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "Your search is too long. Please keep it under 1000 characters.",
        },
        { status: 400 }
      );
    }

    const listingTypeHint =
      typeof body.listingType === "string" ? body.listingType.trim() : undefined;
    const previousPrompt =
      typeof body.previousPrompt === "string"
        ? body.previousPrompt.trim().slice(0, 1000)
        : undefined;

    const result = await runAiPropertySearch(rawPrompt, {
      listingTypeHint,
      previousPrompt: previousPrompt || undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[AI SEARCH API]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "AI search is temporarily unavailable. Please try the classic filters.",
      },
      { status: 500 }
    );
  }
}
