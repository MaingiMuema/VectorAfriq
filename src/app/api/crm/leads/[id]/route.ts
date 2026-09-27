import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// Get lead ID from URL path
function getLeadId(url: string) {
  const segments = url.split("/").filter(Boolean);
  return segments[segments.length - 1];
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leadId = getLeadId(req.nextUrl.pathname);
    const { status } = await req.json();

    // Validate status
    if (!["BASIC", "SILVER", "GOLD"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE lead 
      SET status = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(updateQuery, [status, leadId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Lead Update Error]:", error);
    return NextResponse.json(
      {
        error: "Failed to update lead",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
