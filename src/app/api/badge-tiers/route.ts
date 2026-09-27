import { NextResponse } from "next/server";
import { getActiveBadgeTiers } from "@/lib/agentBadges";

/**
 * GET /api/badge-tiers
 *
 * Public endpoint that returns active badge tier configurations.
 * Used by AgentBadge component and other client-facing components.
 */
export async function GET() {
  try {
    const tiers = await getActiveBadgeTiers();
    return NextResponse.json(tiers);
  } catch (error) {
    console.error("[Badge Tiers API]", error);
    return NextResponse.json(
      { error: "Failed to fetch badge tiers" },
      { status: 500 }
    );
  }
}
