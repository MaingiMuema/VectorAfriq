import { NextResponse } from "next/server";
import { getPaymentSettings, getRateCardTiers } from "@/lib/rateCards";

/** Public/CRM: active rate cards + payment settings (till number) */
export async function GET() {
  try {
    const [tiers, paymentSettings] = await Promise.all([
      getRateCardTiers({ activeOnly: true, includePlans: true }),
      getPaymentSettings(),
    ]);
    return NextResponse.json({ tiers, paymentSettings });
  } catch (error) {
    console.error("[Rate Cards GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch rate cards" },
      { status: 500 }
    );
  }
}
