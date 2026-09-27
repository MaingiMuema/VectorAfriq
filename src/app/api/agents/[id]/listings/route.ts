import { NextResponse } from "next/server";
import { searchProperties } from "@/lib/propertySearch";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    const result = await searchProperties({
      userId: id,
      page: Number.parseInt(searchParams.get("page") || "1", 10),
      limit: Number.parseInt(searchParams.get("limit") || "12", 10),
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[AGENT_LISTINGS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
