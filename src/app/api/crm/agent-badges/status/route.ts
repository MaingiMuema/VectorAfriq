import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAgentBadgeInfo,
  autoAssignVerifiedBadge,
  type BadgeTier,
} from "@/lib/agentBadges";

/**
 * GET /api/crm/agent-badges/status
 *
 * Returns the current badge tier and eligibility details for the authenticated agent.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Auto-assign Verified badge if eligible
    const currentTier = await autoAssignVerifiedBadge(userId);

    // Get full badge info
    const info = await getAgentBadgeInfo(userId);

    return NextResponse.json({
      badgeTier: currentTier,
      badgeUpdatedAt: info.badgeUpdatedAt,
      eligibleForVerified: info.eligibleForVerified,
      listingCount: info.listingCount,
      profileComplete: info.profileComplete,
      trustedPrice: info.trustedPrice,
      elitePrice: info.elitePrice,
      minListings: info.minListings,
    });
  } catch (error) {
    console.error("[Badge Status Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch badge status" },
      { status: 500 }
    );
  }
}
