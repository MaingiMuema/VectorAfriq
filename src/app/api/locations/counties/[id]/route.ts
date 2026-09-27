import { NextResponse } from "next/server";
import * as locationService from "@/lib/services/locations";

export async function GET(request: Request) {
  try {
    const id = request.url.split("/").pop();
    const county = await locationService.getCounty(id!);
    if (!county) {
      return NextResponse.json({ error: "County not found" }, { status: 404 });
    }
    return NextResponse.json(county);
  } catch (error) {
    console.error("Error in county GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch county" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const id = request.url.split("/").pop();
    const body = await request.json();
    const { name, slug } = body;

    const county = await locationService.updateCounty(id!, { name, slug });
    return NextResponse.json(county);
  } catch (error) {
    console.error("Error in county PUT:", error);
    return NextResponse.json(
      { error: "Failed to update county" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const id = request.url.split("/").pop();
    await locationService.deleteCounty(id!);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error in county DELETE:", error);
    return NextResponse.json(
      { error: "Failed to delete county" },
      { status: 500 }
    );
  }
}
