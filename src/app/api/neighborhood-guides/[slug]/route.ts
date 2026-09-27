import { NextResponse } from "next/server";
import { getNeighborhoodGuideBySlug } from "@/lib/neighborhoodGuideData";

/**
 * Public API endpoint for fetching a single neighborhood guide by slug.
 * Used by the public guide page at /neighborhood-guide/[slug].
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const guide = await getNeighborhoodGuideBySlug(slug);

    if (!guide) {
      return NextResponse.json(
        { error: "Guide not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(guide);
  } catch (error) {
    console.error("Error fetching neighborhood guide:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
