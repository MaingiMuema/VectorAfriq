import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { completeBadgePayment, failBadgePayment } from "@/lib/agentBadges";

/**
 * POST /api/mpesa/badge-callback
 *
 * Safaricom M-Pesa callback for badge upgrade payments.
 * This is called by Safaricom when an STK push completes.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { Body } = body;

    if (!Body || !Body.stkCallback) {
      console.error("[Badge Callback] Invalid payload:", body);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { stkCallback } = Body;
    const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } =
      stkCallback;

    console.log(
      "[Badge Callback] Received:",
      JSON.stringify({ CheckoutRequestID, ResultCode }, null, 2)
    );

    if (ResultCode === 0) {
      // Payment successful
      const mpesaReceiptItem = CallbackMetadata?.Item?.find(
        (item: any) => item.Name === "MpesaReceiptNumber"
      );
      const receiptNumber = mpesaReceiptItem?.Value || "UNKNOWN";

      const payment = await completeBadgePayment(
        CheckoutRequestID,
        receiptNumber
      );

      if (payment) {
        console.log(
          `[Badge Callback] Payment completed: ${receiptNumber} for user ${payment.userId} → ${payment.badgeTier}`
        );
      } else {
        console.warn(
          `[Badge Callback] No pending payment found for ${CheckoutRequestID}`
        );
      }
    } else {
      // Payment failed or cancelled
      console.warn(
        `[Badge Callback] Payment failed: ${ResultDesc} (Code: ${ResultCode})`
      );
      await failBadgePayment(
        CheckoutRequestID,
        `Failed: ${ResultDesc} (Code: ${ResultCode})`
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Badge Callback] Error:", error);
    // Return 200 to prevent Safaricom retries
    return NextResponse.json({ received: true });
  }
}
