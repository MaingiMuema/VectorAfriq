import { NextResponse } from "next/server";
import { searchProperties } from "@/lib/propertySearch";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const response = NextResponse.json(
      await searchProperties({
        page: Number.parseInt(searchParams.get("page") || "1", 10),
        limit: Number.parseInt(searchParams.get("limit") || "8", 10),
        category: searchParams.get("category") || undefined,
        bedrooms: searchParams.get("bedrooms") || undefined,
        minPrice: Number.parseFloat(searchParams.get("minPrice") || "0"),
        maxPrice: Number.parseFloat(
          searchParams.get("maxPrice") || "999999999"
        ),
        location: searchParams.get("location") || undefined,
        county: searchParams.get("county") || undefined,
        city: searchParams.get("city") || undefined,
        neighborhood: searchParams.get("neighborhood") || undefined,
        sortBy: searchParams.get("sortBy") || undefined,
        sortOrder: searchParams.get("sortOrder") || undefined,
        type: searchParams.get("type") || undefined,
        featured: searchParams.get("featured") === "true",
      })
    );

    response.headers.set(
      "Cache-Control",
      "public, max-age=30, stale-while-revalidate=60"
    );

    return response;
  } catch (error) {
    console.error("[PROPERTIES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
