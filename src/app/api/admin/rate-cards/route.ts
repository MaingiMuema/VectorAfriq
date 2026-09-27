import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import {
  buildUpdateSet,
  getPaymentSettings,
  getRateCardTiers,
  updatePaymentSettings,
} from "@/lib/rateCards";

function requireAdmin(session: { user?: { role?: string } } | null) {
  return session && session.user?.role === "ADMIN";
}

/** GET all tiers+plans + payment settings */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [tiers, paymentSettings] = await Promise.all([
      getRateCardTiers({ activeOnly: false, includePlans: true }),
      getPaymentSettings(),
    ]);
    return NextResponse.json({ tiers, paymentSettings });
  } catch (error) {
    console.error("[Admin Rate Cards GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch rate cards" },
      { status: 500 }
    );
  }
}

/**
 * POST create tier or plan
 * body.kind: 'tier' | 'plan' | 'settings'
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const kind = body.kind as string;

    if (kind === "settings") {
      await updatePaymentSettings({
        tillNumber: body.tillNumber,
        tillName: body.tillName,
        instructions: body.instructions,
      });
      return NextResponse.json({
        success: true,
        paymentSettings: await getPaymentSettings(),
      });
    }

    if (kind === "tier") {
      const slug = String(body.slug || "").toUpperCase();
      if (!["SILVER", "GOLD", "PLATINUM"].includes(slug)) {
        return NextResponse.json(
          { error: "slug must be SILVER, GOLD, or PLATINUM" },
          { status: 400 }
        );
      }
      const id = body.id || `tier_${slug.toLowerCase()}_${uuidv4().slice(0, 8)}`;
      await query(
        `INSERT INTO rate_card_tier
          (id, slug, name, subtitle, description, features, visibilityPercent, sortOrder, isActive, bgGradient, accentColor, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          slug,
          body.name || slug,
          body.subtitle || null,
          body.description || null,
          JSON.stringify(body.features || []),
          Number(body.visibilityPercent ?? 20),
          Number(body.sortOrder ?? 0),
          body.isActive === false ? 0 : 1,
          body.bgGradient || null,
          body.accentColor || null,
        ]
      );
      return NextResponse.json({ success: true, id });
    }

    if (kind === "plan") {
      if (!body.tierId || !body.listingLimit) {
        return NextResponse.json(
          { error: "tierId and listingLimit are required" },
          { status: 400 }
        );
      }
      const id = body.id || `plan_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
      const monthly = Number(body.monthlyPrice || 0);
      const annual =
        body.annualPrice !== undefined
          ? Number(body.annualPrice)
          : monthly * 10;
      await query(
        `INSERT INTO rate_card_plan
          (id, tierId, name, listingLimit, monthlyPrice, annualPrice, features, sortOrder, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          body.tierId,
          body.name || `${body.listingLimit} listings`,
          Number(body.listingLimit),
          monthly,
          annual,
          JSON.stringify(body.features || []),
          Number(body.sortOrder ?? 0),
          body.isActive === false ? 0 : 1,
        ]
      );
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  } catch (error) {
    console.error("[Admin Rate Cards POST]", error);
    const msg = error instanceof Error ? error.message : "Failed to create";
    if (msg.includes("Duplicate") || msg.includes("uniq_")) {
      return NextResponse.json(
        { error: "A tier with this slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PATCH update tier, plan, or settings */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const kind = body.kind as string;

    if (kind === "settings") {
      await updatePaymentSettings({
        tillNumber: body.tillNumber,
        tillName: body.tillName,
        instructions: body.instructions,
      });
      return NextResponse.json({
        success: true,
        paymentSettings: await getPaymentSettings(),
      });
    }

    if (kind === "tier") {
      if (!body.id) {
        return NextResponse.json({ error: "id required" }, { status: 400 });
      }
      const { setClause, values } = buildUpdateSet(
        [
          "name",
          "subtitle",
          "description",
          "features",
          "visibilityPercent",
          "sortOrder",
          "isActive",
          "bgGradient",
          "accentColor",
        ],
        body
      );
      if (!setClause) {
        return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
      }
      await query(`UPDATE rate_card_tier SET ${setClause} WHERE id = ?`, [
        ...values,
        body.id,
      ]);
      return NextResponse.json({ success: true });
    }

    if (kind === "plan") {
      if (!body.id) {
        return NextResponse.json({ error: "id required" }, { status: 400 });
      }
      const { setClause, values } = buildUpdateSet(
        [
          "name",
          "listingLimit",
          "monthlyPrice",
          "annualPrice",
          "features",
          "sortOrder",
          "isActive",
          "tierId",
        ],
        body
      );
      if (!setClause) {
        return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
      }
      await query(`UPDATE rate_card_plan SET ${setClause} WHERE id = ?`, [
        ...values,
        body.id,
      ]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  } catch (error) {
    console.error("[Admin Rate Cards PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update rate card" },
      { status: 500 }
    );
  }
}

/** DELETE tier or plan */
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind");
    const id = searchParams.get("id");

    if (!kind || !id) {
      return NextResponse.json(
        { error: "kind and id are required" },
        { status: 400 }
      );
    }

    if (kind === "plan") {
      await query(`DELETE FROM rate_card_plan WHERE id = ?`, [id]);
      return NextResponse.json({ success: true });
    }

    if (kind === "tier") {
      await query(`DELETE FROM rate_card_plan WHERE tierId = ?`, [id]);
      await query(`DELETE FROM rate_card_tier WHERE id = ?`, [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  } catch (error) {
    console.error("[Admin Rate Cards DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
