import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface FavoriteRouteParams {
  params: Promise<{
    propertyId: string;
  }>;
}

export async function DELETE(
  _request: NextRequest,
  { params }: FavoriteRouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in to manage favorites" },
        { status: 401 }
      );
    }

    const { propertyId } = await params;

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property id is required" },
        { status: 400 }
      );
    }

    await query("DELETE FROM favorite WHERE userId = ? AND propertyId = ?", [
      session.user.id,
      propertyId,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
