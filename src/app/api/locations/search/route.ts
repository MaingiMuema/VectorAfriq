import { NextResponse } from "next/server";
import { searchLocationSuggestions } from "@/lib/search/searchLocation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q) {
      return NextResponse.json([]);
    }

    const results = await searchLocationSuggestions(q);
    return NextResponse.json(results);
  } catch (error) {
    console.error("[LOCATIONS_SEARCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
