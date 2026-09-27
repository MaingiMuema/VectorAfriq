import { NextResponse } from "next/server";
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
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    const locationId = searchParams.get("locationId");

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (active === "true") {
      whereClause += " AND active = TRUE";
    } else if (active === "false") {
      whereClause += " AND active = FALSE";
    }


    const banners = await query<Banner>(
      `SELECT * FROM banner ${whereClause} ORDER BY createdAt DESC`,
      params
    );

    // Filter banners by location if specified
    let filteredBanners = banners;
    if (locationId) {
      filteredBanners = banners.filter(banner => {
        // Parse locations if it's a string (from database)
        const bannerLocations = typeof banner.locations === 'string'
          ? JSON.parse(banner.locations)
          : banner.locations || [];

        // Return banner if it has no locations (shows on all pages) or includes the requested location
        return bannerLocations.length === 0 || bannerLocations.includes(locationId);
      });

    }


    return NextResponse.json({ banners: filteredBanners });
  } catch (error) {
    console.error("Media-content API: Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error: error
    });

    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
