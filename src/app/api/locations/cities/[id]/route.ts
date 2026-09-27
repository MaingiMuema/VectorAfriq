import { NextResponse } from "next/server";
import * as locationService from "@/lib/services/locations";

export async function PUT(request: Request) {
  try {
    // Extract id from URL
    const id = request.url.split("/").pop();
    const body = await request.json();
    const { name, countyId } = body;
    const slug = name.toLowerCase().replace(/ /g, "-");

    const city = await locationService.updateCity(id!, {
      name,
      slug,
      countyId,
    });
    return NextResponse.json(city);
  } catch (error) {
    console.error("Error in city PUT:", error);
    return NextResponse.json(
      { error: "Failed to update city" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Extract id from URL
    const id = request.url.split("/").pop();
    await locationService.deleteCity(id!);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error in city DELETE:", error);
    return NextResponse.json(
      { error: "Failed to delete city" },
      { status: 500 }
    );
  }
}
