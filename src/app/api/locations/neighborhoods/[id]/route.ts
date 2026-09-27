import { NextResponse } from "next/server";
import * as locationService from "@/lib/services/locations";

export async function PUT(request: Request) {
  try {
    const id = request.url.split("/").pop();
    const body = await request.json();
    const { name, cityId, countyId } = body;
    const slug = name.toLowerCase().replace(/ /g, "-");

    const neighborhood = await locationService.updateNeighborhood(id!, {
      name,
      slug,
      cityId,
      countyId,
    });
    return NextResponse.json(neighborhood);
  } catch (error) {
    console.error("Error in neighborhood PUT:", error);
    return NextResponse.json(
      { error: "Failed to update neighborhood" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const id = request.url.split("/").pop();
    await locationService.deleteNeighborhood(id!);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error in neighborhood DELETE:", error);
    return NextResponse.json(
      { error: "Failed to delete neighborhood" },
      { status: 500 }
    );
  }
}
