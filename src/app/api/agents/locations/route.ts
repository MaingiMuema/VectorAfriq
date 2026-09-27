import { NextResponse } from "next/server";
import { getPopularAgentLocations } from "@/lib/stats";

export async function GET() {
  try {
    const locations = await getPopularAgentLocations(5);
    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error fetching agent locations:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
