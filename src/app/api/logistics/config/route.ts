import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    googleMapsApiKey:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || process.env.GOOGLE_MAPS_API || "",
  });
}
