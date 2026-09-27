import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug parameter is required" }, { status: 400 });
    }

    // Check if location exists in any of the location tables
    const [county, city, neighborhood] = await Promise.all([
      query<{ id: string; name: string; slug: string; type: string }>(
        "SELECT id, name, slug, 'county' as type FROM county WHERE slug = ?",
        [slug]
      ),
      query<{ id: string; name: string; slug: string; type: string }>(
        "SELECT id, name, slug, 'city' as type FROM city WHERE slug = ?",
        [slug]
      ),
      query<{ id: string; name: string; slug: string; type: string }>(
        "SELECT id, name, slug, 'neighborhood' as type FROM neighborhood WHERE slug = ?",
        [slug]
      ),
    ]);

    const location = county[0] || city[0] || neighborhood[0];

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Get additional context based on location type
    let context = {};
    
    if (location.type === 'city') {
      const [countyInfo] = await query<{ name: string; slug: string }>(
        "SELECT c.name, c.slug FROM county c JOIN city ci ON c.id = ci.countyId WHERE ci.slug = ?",
        [slug]
      );
      context = { county: countyInfo };
    } else if (location.type === 'neighborhood') {
      const [cityCountyInfo] = await query<{ cityName: string; citySlug: string; countyName: string; countySlug: string }>(
        `SELECT c.name as cityName, c.slug as citySlug, co.name as countyName, co.slug as countySlug 
         FROM neighborhood n 
         JOIN city c ON n.cityId = c.id 
         JOIN county co ON n.countyId = co.id 
         WHERE n.slug = ?`,
        [slug]
      );
      context = { city: { name: cityCountyInfo.cityName, slug: cityCountyInfo.citySlug }, county: { name: cityCountyInfo.countyName, slug: cityCountyInfo.countySlug } };
    }

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        name: location.name,
        slug: location.slug,
        type: location.type,
        ...context,
      },
    });

  } catch (error) {
    console.error("Error validating location:", error);
    return NextResponse.json(
      { error: "Failed to validate location" },
      { status: 500 }
    );
  }
}
