import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getPropertyUrl } from "@/lib/propertyCache";
import { processImageUrl } from "@/lib/imageUtils";
import type { FavoriteProperty } from "@/lib/favorites";

interface FavoriteRow {
  id: string;
  propertyId: string;
  createdAt: Date;
  title: string;
  location: string;
  price: number;
  type: string;
  category: string;
  bedrooms: number;
  bathrooms: number;
  floorSize: number;
  plotSize: number;
  images: string | null;
  status: string;
}

interface FavoriteIdRow {
  propertyId: string;
}

interface PropertyExistsRow {
  id: string;
}

function parseImages(images: string | null): string[] {
  if (!images) {
    return [];
  }

  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed)
      ? parsed.filter((image): image is string => typeof image === "string")
      : [];
  } catch {
    return [];
  }
}

function normalizeStatus(status: string): FavoriteProperty["status"] {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "pending" || normalizedStatus === "sold") {
    return normalizedStatus;
  }

  return "available";
}

function formatFavoriteProperty(row: FavoriteRow): FavoriteProperty {
  const images = parseImages(row.images);
  const area = Number(row.floorSize || row.plotSize || 0);

  return {
    id: row.propertyId,
    title: row.title,
    location: row.location,
    price: Number(row.price) || 0,
    type: row.category || row.type,
    bedrooms: Number(row.bedrooms) || 0,
    bathrooms: Number(row.bathrooms) || 0,
    area,
    image: processImageUrl(images[0], row.propertyId),
    addedDate: row.createdAt.toISOString(),
    status: normalizeStatus(row.status),
    url: getPropertyUrl(row.propertyId, row.title),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in to manage favorites" },
        { status: 401 }
      );
    }

    const propertyId = request.nextUrl.searchParams.get("propertyId");

    if (propertyId) {
      const rows = await query<FavoriteIdRow>(
        "SELECT propertyId FROM favorite WHERE userId = ? AND propertyId = ? LIMIT 1",
        [session.user.id, propertyId]
      );

      return NextResponse.json({ isFavorite: rows.length > 0 });
    }

    const rows = await query<FavoriteRow>(
      `
        SELECT
          f.id,
          f.propertyId,
          f.createdAt,
          p.title,
          p.location,
          p.price,
          p.type,
          p.category,
          p.bedrooms,
          p.bathrooms,
          p.floorSize,
          p.plotSize,
          p.images,
          p.status
        FROM favorite f
        INNER JOIN property p ON p.id = f.propertyId
        WHERE f.userId = ?
        ORDER BY f.createdAt DESC
      `,
      [session.user.id]
    );
    const properties = rows.map(formatFavoriteProperty);

    return NextResponse.json({
      properties,
      favoriteIds: properties.map((property) => property.id),
    });
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in to manage favorites" },
        { status: 401 }
      );
    }

    const { propertyId } = await request.json();

    if (typeof propertyId !== "string" || !propertyId.trim()) {
      return NextResponse.json(
        { error: "Property id is required" },
        { status: 400 }
      );
    }

    const [property] = await query<PropertyExistsRow>(
      "SELECT id FROM property WHERE id = ? LIMIT 1",
      [propertyId]
    );

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    try {
      await query(
        "INSERT INTO favorite (id, userId, propertyId, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP(3))",
        [randomUUID(), session.user.id, propertyId]
      );
    } catch (error) {
      if (error instanceof Error && error.message === "Duplicate entry") {
        return NextResponse.json({ success: true, alreadyFavorited: true });
      }

      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}
