import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, DatabaseValue } from "@/lib/db";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl?: string | null;
  locations: string[];
  active: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    // Note: Search functionality removed as banners no longer have title/description
    // Could be added back to search by category names if needed

    const active = searchParams.get("active");
    if (active !== null) {
      whereClause += " AND active = ?";
      params.push(active === "true" ? 1 : 0);
    }

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM banner ${whereClause}`,
      params
    );

    const total = countResult.total;

    // Get banners
    const banners = await query<Banner>(
      `
      SELECT * FROM banner
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [...params, limit, skip]
    );

    return NextResponse.json({
      banners,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { imageUrl, linkUrl, locations, active } = body;

    if (!imageUrl) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Create banner
    const locationsJson = JSON.stringify(locations || []);
    await query(
      `
      INSERT INTO banner (
        id, imageUrl, linkUrl, locations, active, userId,
        createdAt, updatedAt
      ) VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [imageUrl, normalizeBannerLinkUrl(linkUrl), locationsJson, active ?? true, session.user.id] as DatabaseValue[]
    );

    const [banner] = await query<Banner>(
      "SELECT * FROM banner WHERE imageUrl = ? ORDER BY createdAt DESC LIMIT 1",
      [imageUrl]
    );

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Error creating banner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, imageUrl, linkUrl, locations, active } = body;

    if (!id) {
      return new NextResponse("Missing banner ID", { status: 400 });
    }

    // Update banner
    const updateFields: string[] = [];
    const updateParams: DatabaseValue[] = [];

    if (imageUrl) {
      updateFields.push("imageUrl = ?");
      updateParams.push(imageUrl);
    }
    if (linkUrl !== undefined) {
      updateFields.push("linkUrl = ?");
      updateParams.push(normalizeBannerLinkUrl(linkUrl));
    }
    if (locations !== undefined) { // Allow empty array
      updateFields.push("locations = ?");
      updateParams.push(JSON.stringify(locations));
    }
    if (typeof active === 'boolean') {
      updateFields.push("active = ?");
      updateParams.push(active);
    }

    updateFields.push("updatedAt = NOW()");
    updateParams.push(id);

    await query(
      `UPDATE banner SET ${updateFields.join(", ")} WHERE id = ?`,
      updateParams
    );

    const [banner] = await query<Banner>("SELECT * FROM banner WHERE id = ?", [id]);

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Error updating banner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

function normalizeBannerLinkUrl(linkUrl: unknown): string | null {
  if (typeof linkUrl !== "string") return null;

  const trimmedLinkUrl = linkUrl.trim();
  if (trimmedLinkUrl.length === 0) return null;
  if (trimmedLinkUrl.startsWith("/") || trimmedLinkUrl.includes("://")) {
    return trimmedLinkUrl;
  }

  return `/${trimmedLinkUrl}`;
}
