import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, DatabaseValue } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

const VALID_TIERS = ["NONE", "VERIFIED", "TRUSTED", "ELITE"] as const;

interface BadgeTierRow {
  id: string;
  tier: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  features: string | null;
  price: number;
  sortOrder: number;
  isActive: boolean;
  autoAssignEnabled: boolean;
  minListings: number;
  bgGradient: string | null;
  iconColor: string | null;
  accentColor: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/admin/badge-tiers
 * Returns all badge tiers (including inactive) for admin management.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tiers = await query<BadgeTierRow>(
      `SELECT * FROM agent_badge_tier ORDER BY sortOrder ASC`
    );
    // Parse JSON features column (may be string or already parsed by driver)
    const parsed = tiers.map((t) => ({
      ...t,
      features: Array.isArray(t.features)
        ? t.features
        : typeof t.features === "string"
        ? (() => { try { return JSON.parse(t.features); } catch { return []; } })()
        : [],
    }));
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[Admin Badge Tiers GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch badge tiers" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/badge-tiers
 * Update a badge tier's configuration.
 * Body: { id, ...fields }
 */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Badge tier ID is required" },
        { status: 400 }
      );
    }

    // Verify the tier exists
    const [existing] = await query<BadgeTierRow>(
      "SELECT * FROM agent_badge_tier WHERE id = ?",
      [id]
    );
    if (!existing) {
      return NextResponse.json(
        { error: "Badge tier not found" },
        { status: 404 }
      );
    }

    // Build dynamic UPDATE query
    const allowedFields = [
      "name", "subtitle", "description", "features", "price",
      "sortOrder", "isActive", "autoAssignEnabled", "minListings",
      "bgGradient", "iconColor", "accentColor",
    ];

    const setClauses: string[] = [];
    const values: DatabaseValue[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        let value = updates[field];
        // Stringify features array
        if (field === "features" && Array.isArray(value)) {
          value = JSON.stringify(value);
        }
        setClauses.push(`\`${field}\` = ?`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    setClauses.push("updatedAt = NOW()");
    values.push(id);

    await query(
      `UPDATE agent_badge_tier SET ${setClauses.join(", ")} WHERE id = ?`,
      values
    );

    // Return updated tier
    const [updated] = await query<BadgeTierRow>(
      "SELECT * FROM agent_badge_tier WHERE id = ?",
      [id]
    );

    const updatedFeatures = Array.isArray(updated.features)
      ? updated.features
      : typeof updated.features === "string"
      ? (() => { try { return JSON.parse(updated.features); } catch { return []; } })()
      : [];
    return NextResponse.json({
      ...updated,
      features: updatedFeatures,
    });
  } catch (error) {
    console.error("[Admin Badge Tiers PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update badge tier" },
      { status: 500 }
    );
  }
}
