import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, DatabaseValue } from "@/lib/db";

interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";

    const skip = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (search) {
      whereClause += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (location) {
      whereClause += " AND location = ?";
      params.push(location);
    }

    const active = searchParams.get("active");
    if (active !== null) {
      whereClause += " AND active = ?";
      params.push(active === "true" ? 1 : 0);
    }

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM banner ${whereClause}`,
      params
    );

    const total = countResult.total;

    // Get banners
    const banners = await query<Banner>(
      `
      SELECT * FROM banner
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [...params, limit, skip]
    );

    return NextResponse.json({
      banners,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, imageUrl, linkUrl, location, active } = body;

    if (!title || !description || !imageUrl || !linkUrl || !location) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Create banner
    await query(
      `
      INSERT INTO banner (
        id, title, description, imageUrl, linkUrl, location, active,
        createdAt, updatedAt
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [title, description, imageUrl, linkUrl, location, active ?? true] as DatabaseValue[]
    );

    const [banner] = await query<Banner>(
      "SELECT * FROM banner WHERE title = ? ORDER BY createdAt DESC LIMIT 1",
      [title]
    );

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error creating banner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, description, imageUrl, linkUrl, location, active } = body;

    if (!id) {
      return new NextResponse("Missing banner ID", { status: 400 });
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

    const [banner] = await query<Banner>("SELECT * FROM banner WHERE id = ?", [id]);

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error updating banner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}