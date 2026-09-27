import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGuidesForSearchResults } from "@/lib/neighborhoodGuideData";

/**
 * Public API endpoint for fetching neighborhood guides for search results.
 * Used by the search results page to display relevant guides below pagination.
 *
 * When an authenticated admin passes admin=1, unpublished guides are included
 * so admins can manage them directly from the search results page.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countyId = searchParams.get("countyId");
    const cityId = searchParams.get("cityId");
    const neighborhoodId = searchParams.get("neighborhoodId");
    const category = searchParams.get("category") || undefined;
    const bedrooms = searchParams.get("bedrooms") || undefined;
    const listingType = searchParams.get("listingType") || undefined;
    const limit = parseInt(searchParams.get("limit") || "4");
    const page = parseInt(searchParams.get("page") || "1");
    const wantsAdminView = searchParams.get("admin") === "1";

    if (!countyId) {
      return NextResponse.json({ guides: [], total: 0 });
    }

    let includeUnpublished = false;
    if (wantsAdminView) {
      const session = await getServerSession(authOptions);
      includeUnpublished = session?.user?.role?.toLowerCase() === "admin";
    }

    const guides = await getGuidesForSearchResults({
      countyId,
      cityId: cityId || undefined,
      neighborhoodId: neighborhoodId || undefined,
      category,
      bedrooms,
      listingType,
      limit,
      page,
      includeUnpublished,
    });

    return NextResponse.json({ guides, page, limit });
  } catch (error) {
    console.error("Error fetching neighborhood guides:", error);
    return NextResponse.json([]);
  }
}
