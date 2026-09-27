import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAgentListingStatus } from "@/lib/rateCards";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getAgentListingStatus(session.user.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error("[CRM Listing Quota GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch listing quota" },
      { status: 500 }
    );
  }
}
