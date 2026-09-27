import { NextResponse } from "next/server";
import {
  getCanonicalLocationSegments,
  getLocationDisplayName,
  resolveSearchLocationText,
} from "@/lib/search/searchLocation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q) {
      return NextResponse.json(null);
    }

    const location = await resolveSearchLocationText(q);

    if (!location) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      type: location.neighborhood
        ? "neighborhood"
        : location.city
          ? "city"
          : "county",
      display: getLocationDisplayName(location),
      pathSegments: getCanonicalLocationSegments(location),
    });
  } catch (error) {
    console.error("[LOCATIONS_RESOLVE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
