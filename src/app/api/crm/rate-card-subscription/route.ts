import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import {
  getAgentListingStatus,
  getPaymentSettings,
  getRateCardPlanById,
  planAmount,
  type BillingCycle,
} from "@/lib/rateCards";

/** GET current agent subscription status + history */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [listingStatus, subscriptions, paymentSettings] = await Promise.all([
      getAgentListingStatus(session.user.id),
      query<{
        id: string;
        planId: string;
        tierSlug: string;
        billingCycle: string;
        amount: number;
        listingLimit: number;
        status: string;
        proofUrl: string | null;
        mpesaCode: string | null;
        adminNotes: string | null;
        startsAt: Date | null;
        expiresAt: Date | null;
        createdAt: Date;
        planName: string | null;
      }>(
        `SELECT s.*, p.name as planName
         FROM rate_card_subscription s
         LEFT JOIN rate_card_plan p ON p.id = s.planId
         WHERE s.userId = ?
         ORDER BY s.createdAt DESC
         LIMIT 20`,
        [session.user.id]
      ),
      getPaymentSettings(),
    ]);

    return NextResponse.json({
      listingStatus,
      subscriptions,
      paymentSettings,
    });
  } catch (error) {
    console.error("[CRM Rate Card Subscription GET]", error);
    return NextResponse.json(
      { error: "Failed to load subscription status" },
      { status: 500 }
    );
  }
}

/**
 * POST create subscription payment request
 * body: { planId, billingCycle, proofUrl?, mpesaCode? }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const planId = body.planId as string;
    const billingCycle = (body.billingCycle || "MONTHLY") as BillingCycle;
    const proofUrl =
      typeof body.proofUrl === "string" ? body.proofUrl.trim() : "";
    const mpesaCode =
      typeof body.mpesaCode === "string" ? body.mpesaCode.trim() : "";

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }
    if (!["MONTHLY", "ANNUAL"].includes(billingCycle)) {
      return NextResponse.json(
        { error: "billingCycle must be MONTHLY or ANNUAL" },
        { status: 400 }
      );
    }
    if (!proofUrl) {
      return NextResponse.json(
        { error: "Payment proof is required. Please upload a screenshot." },
        { status: 400 }
      );
    }

    const plan = await getRateCardPlanById(planId);
    if (!plan || !plan.isActive || !plan.tierSlug) {
      return NextResponse.json(
        { error: "Selected plan is not available" },
        { status: 400 }
      );
    }

    // One pending request at a time
    const [pending] = await query<{ id: string }>(
      `SELECT id FROM rate_card_subscription
       WHERE userId = ? AND status = 'PENDING' LIMIT 1`,
      [session.user.id]
    );
    if (pending) {
      return NextResponse.json(
        {
          error:
            "You already have a pending payment under review. Please wait for admin confirmation.",
        },
        { status: 409 }
      );
    }

    const paymentSettings = await getPaymentSettings();
    const amount = planAmount(plan, billingCycle);
    const id = uuidv4().replace(/-/g, "");

    await query(
      `INSERT INTO rate_card_subscription
        (id, userId, planId, tierSlug, billingCycle, amount, listingLimit,
         tillNumber, proofUrl, mpesaCode, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
      [
        id,
        session.user.id,
        plan.id,
        plan.tierSlug,
        billingCycle,
        amount,
        plan.listingLimit,
        paymentSettings.tillNumber,
        proofUrl,
        mpesaCode || null,
      ]
    );

    return NextResponse.json({
      success: true,
      id,
      message:
        "Payment submitted for review. An admin will confirm and activate your plan shortly.",
    });
  } catch (error) {
    console.error("[CRM Rate Card Subscription POST]", error);
    return NextResponse.json(
      { error: "Failed to submit payment request" },
      { status: 500 }
    );
  }
}
