import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, DatabaseValue } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!id) {
    return new NextResponse("Missing banner ID", { status: 400 });
  }

  try {
    const [banner] = await query(
      "SELECT * FROM banner WHERE id = ?",
      [id]
    );

    if (!banner) {
      return new NextResponse("Banner not found", { status: 404 });
    }

    // Parse locations JSON string back to array
    const processedBanner = {
      ...banner,
      locations: typeof banner.locations === 'string'
        ? JSON.parse(banner.locations)
        : banner.locations || []
    };

    return NextResponse.json({ banner: processedBanner });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function updateBanner(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!id) {
    return new NextResponse("Missing banner ID", { status: 400 });
  }

  try {
    const body = await request.json();
    const { imageUrl, linkUrl, locations, active } = body;

    const [existingBanner] = await query<{ id: string }>(
      "SELECT id FROM banner WHERE id = ?",
      [id]
    );

    if (!existingBanner) {
      return new NextResponse("Banner not found", { status: 404 });
    }

    const updateFields: string[] = [];
    const updateParams: DatabaseValue[] = [];

    if (imageUrl) {
      updateFields.push("imageUrl = ?");
      updateParams.push(imageUrl);
    }
    if (linkUrl !== undefined) {
      updateFields.push("linkUrl = ?");
      updateParams.push(normalizeBannerLinkUrl(linkUrl));
    }
    if (locations !== undefined) { // Allow empty array
      updateFields.push("locations = ?");
      updateParams.push(JSON.stringify(locations));
    }
    if (typeof active === 'boolean') {
      updateFields.push("active = ?");
      updateParams.push(active);
    }

    if (updateFields.length === 0) {
      return new NextResponse("No fields to update", { status: 400 });
    }

    updateFields.push("updatedAt = NOW()");
    updateParams.push(id);

    await query(
      `UPDATE banner SET ${updateFields.join(", ")} WHERE id = ?`,
      updateParams
    );

    const [banner] = await query(
      "SELECT * FROM banner WHERE id = ?",
      [id]
    );

    // Parse locations JSON string back to array for response
    const processedBanner = {
      ...banner,
      locations: typeof banner.locations === 'string'
        ? JSON.parse(banner.locations)
        : banner.locations || []
    };

    return NextResponse.json({ banner: processedBanner });
  } catch (error) {
    console.error("Error updating banner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

function normalizeBannerLinkUrl(linkUrl: unknown): string | null {
  if (typeof linkUrl !== "string") return null;

  const trimmedLinkUrl = linkUrl.trim();
  if (trimmedLinkUrl.length === 0) return null;
  if (trimmedLinkUrl.startsWith("/") || trimmedLinkUrl.includes("://")) {
    return trimmedLinkUrl;
  }

  return `/${trimmedLinkUrl}`;
}

export const PUT = updateBanner;
export const PATCH = updateBanner;

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!id) {
    return new NextResponse("Missing banner ID", { status: 400 });
  }

  try {
    // First check if banner exists
    const [existingBanner] = await query<{ id: string }>(
      "SELECT id FROM banner WHERE id = ?",
      [id]
    );

    if (!existingBanner) {
      return new NextResponse("Banner not found", { status: 404 });
    }

    // Delete banner
    await query("DELETE FROM banner WHERE id = ?", [id]);

    return new NextResponse("Banner deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
