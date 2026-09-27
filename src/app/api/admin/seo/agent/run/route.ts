import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { timingSafeEqual } from "crypto";
import { authOptions } from "@/lib/auth";
import { enqueueJob } from "@/lib/seo/jobs";
import type { AgentType } from "@/lib/seo/types";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Accepts the hardened `Authorization: Bearer <secret>` header, or (deprecated,
 *  logs a warning) the legacy `?key=` query param — fixes D12. */
function checkCronAuth(request: NextRequest): boolean {
  const validSecret = process.env.SEO_AGENT_CRON_SECRET;
  if (!validSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return safeCompare(authHeader.substring(7), validSecret);
  }

  const legacyKey = request.nextUrl.searchParams.get("key");
  if (legacyKey) {
    console.warn(
      "[SEO Agent API] Cron auth via ?key= query param is deprecated — use 'Authorization: Bearer <secret>' instead."
    );
    return safeCompare(legacyKey, validSecret);
  }

  return false;
}

/**
 * POST /api/admin/seo/agent/run
 * Enqueues an agent run and returns immediately (202) — the worker (src/lib/seo/worker.ts)
 * claims and executes it out-of-band. Fixes D2 (runs used to execute synchronously
 * inside the request, timing out on slow platforms/proxies).
 *
 * Body: { agent: AgentType }
 * Auth: admin session, or `Authorization: Bearer <SEO_AGENT_CRON_SECRET>` for cron
 * (legacy `?key=` query param still accepted with a deprecation warning).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "ADMIN";
    const isCronAccess = checkCronAuth(request);

    if (!isAdmin && !isCronAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { agent?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body might be empty for cron calls
    }

    const agentParam = body.agent || request.nextUrl.searchParams.get("agent") || "all";
    const validAgents: AgentType[] = [
      "keyword_discovery",
      "on_page_optimization",
      "content_strategy",
      "technical_monitor",
      "ranking_tracker",
      "all",
    ];

    if (!validAgents.includes(agentParam as AgentType)) {
      return NextResponse.json(
        { error: `Invalid agent type. Valid options: ${validAgents.join(", ")}` },
        { status: 400 }
      );
    }

    const agentType = agentParam as AgentType;
    const result = await enqueueJob(agentType, isAdmin ? session!.user!.email || "admin" : "cron");

    if ("conflict" in result) {
      return NextResponse.json(
        {
          error: `A ${agentType} job is already ${result.conflict.status}`,
          job: result.conflict,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, job: result.job }, { status: 202 });
  } catch (error) {
    console.error("[SEO Agent API] Enqueue failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/seo/agent/run
 * Returns recent agent runs.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    const { getRecentRuns } = await import("@/lib/seo/agent-runner");
    const runs = await getRecentRuns(limit);

    return NextResponse.json({
      success: true,
      runs,
    });
  } catch (error) {
    console.error("[SEO Agent API] Fetch runs failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
