import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getActivePromoModel,
  setActivePromoModel,
  PROMO_MODELS,
} from "@/lib/promo-video/config";

/**
 * GET /api/admin/promo-video/model
 * Returns the persisted active model + the two switchable options.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    activeModelId: getActivePromoModel(),
    models: PROMO_MODELS,
  });
}

/**
 * POST /api/admin/promo-video/model
 * Body: { modelId } — persists the active model for future generations.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const modelId = typeof body?.modelId === "string" ? body.modelId : "";
    const result = setActivePromoModel(modelId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, activeModelId: modelId });
  } catch (error) {
    console.error("[PromoVideo API] Model update failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
