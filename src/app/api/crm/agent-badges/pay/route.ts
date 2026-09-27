import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { initiateSTKPush } from "@/lib/mpesa";
import {
  getAgentBadgeInfo,
  createBadgePayment,
  getBadgePrices,
} from "@/lib/agentBadges";
import { query } from "@/lib/db";

/**
 * POST /api/crm/agent-badges/pay
 *
 * Initiate an M-Pesa STK push for badge upgrade (Trusted or Elite).
 * Body: { badgeTier: "TRUSTED" | "ELITE", phoneNumber: string }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { badgeTier, phoneNumber } = body;

    // Validate badge tier
    if (!badgeTier || !["TRUSTED", "ELITE"].includes(badgeTier)) {
      return NextResponse.json(
        { error: "Invalid badge tier. Must be TRUSTED or ELITE." },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Get current badge info
    const info = await getAgentBadgeInfo(userId);

    // Ensure agent has at least Verified badge before upgrading
    if (info.badgeTier === "NONE" && !info.eligibleForVerified) {
      return NextResponse.json(
        {
          error:
            "You must complete your profile and have at least " +
            info.minListings +
            " active listings to get a Verified badge before upgrading.",
        },
        { status: 400 }
      );
    }

    // Prevent downgrading or purchasing same tier
    const tierOrder: Record<string, number> = {
      NONE: 0,
      VERIFIED: 1,
      TRUSTED: 2,
      ELITE: 3,
    };

    if (tierOrder[badgeTier] <= tierOrder[info.badgeTier]) {
      return NextResponse.json(
        {
          error: `You already have a ${info.badgeTier} badge. Cannot downgrade or purchase the same tier.`,
        },
        { status: 400 }
      );
    }

    // Get price from admin settings
    const prices = await getBadgePrices();
    const amount = badgeTier === "TRUSTED" ? prices.trustedPrice : prices.elitePrice;

    // Check for existing pending payment for this tier
    const [existingPending] = await query<{ id: string }>(
      `SELECT id FROM agent_badge_payment WHERE userId = ? AND badgeTier = ? AND status = 'PENDING'`,
      [userId, badgeTier]
    );
    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending payment for this badge tier." },
        { status: 400 }
      );
    }

    // Initiate M-Pesa STK push with badge-specific callback URL
    const badgeCallbackUrl = `${process.env.NEXTAUTH_URL}/api/mpesa/badge-callback`;
    const stkResult = await initiateSTKPush(phoneNumber, amount, badgeCallbackUrl);

    if (!stkResult.CheckoutRequestID) {
      return NextResponse.json(
        { error: "Failed to initiate M-Pesa payment" },
        { status: 500 }
      );
    }

    // Save pending payment record
    const payment = await createBadgePayment(
      userId,
      badgeTier as "TRUSTED" | "ELITE",
      amount,
      stkResult.CheckoutRequestID
    );

    return NextResponse.json({
      success: true,
      message: "M-Pesa payment initiated. Please complete the STK prompt on your phone.",
      paymentId: payment.id,
      amount,
      badgeTier,
    });
  } catch (error: any) {
    console.error("[Badge Payment Error]", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to initiate badge payment",
      },
      { status: 500 }
    );
  }
}
