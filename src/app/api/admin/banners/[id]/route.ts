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

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
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
    const { title, description, imageUrl, linkUrl, location, active } = body;

    if (!title && !description && !imageUrl && !linkUrl && !location && typeof active !== 'boolean') {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // First check if banner exists
    const [existingBanner] = await query<{ id: string }>(
      "SELECT id FROM banner WHERE id = ?",
      [id]
    );

    if (!existingBanner) {
      return new NextResponse("Banner not found", { status: 404 });
    }

    // Update banner
    const updateFields: string[] = [];
    const updateParams: DatabaseValue[] = [];

    if (title) {
      updateFields.push("title = ?");
      updateParams.push(title);
    }
    if (description) {
      updateFields.push("description = ?");
      updateParams.push(description);
    }
    if (imageUrl) {
      updateFields.push("imageUrl = ?");
      updateParams.push(imageUrl);
    }
    if (linkUrl) {
      updateFields.push("linkUrl = ?");
      updateParams.push(linkUrl);
    }
    if (location) {
      updateFields.push("location = ?");
      updateParams.push(location);
    }
    if (typeof active === 'boolean') {
      updateFields.push("active = ?");
      updateParams.push(active);
    }

    updateFields.push("updatedAt = NOW()");
    updateParams.push(id);

    await query(
      `UPDATE banner SET ${updateFields.join(", ")} WHERE id = ?`,
      updateParams
    );

    // Fetch updated banner
    const [banner] = await query(
      "SELECT * FROM banner WHERE id = ?",
      [id]
    );

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error updating banner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

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