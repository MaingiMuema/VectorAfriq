import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import slugify from "slugify";
import { query, DatabaseValue } from "@/lib/db";

interface Tag {
  id: string;
  name: string;
  slug: string;
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
    const search = searchParams.get("search") || "";

    const tags = await query<Tag & { post_count: number }>(
      `
      SELECT 
        t.*,
        COUNT(pt.postId) as post_count
      FROM tag t
      LEFT JOIN _posttotag pt ON t.id = pt.tagId
      WHERE t.name LIKE ? OR t.slug LIKE ?
      GROUP BY t.id
      ORDER BY t.name ASC
    `,
      [`%${search}%`, `%${search}%`]
    );

    // Transform to match Prisma response structure
    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      _count: {
        posts: Number(tag.post_count),
      },
    }));

    return NextResponse.json(formattedTags);
  } catch (error) {
    console.error("Error fetching tags:", error);
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
    const { name } = body;

    if (!name) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const slug = slugify(name, { lower: true });

    // Check if tag exists
    const [existingTag] = await query<Tag>("SELECT * FROM tag WHERE slug = ?", [
      slug,
    ]);

    if (existingTag) {
      return new NextResponse("Tag already exists", { status: 400 });
    }

    // Create new tag
    const [result] = await query<{ insertId: number }>(
      "INSERT INTO tag (name, slug, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())",
      [name, slug]
    );

    // Fetch created tag with post count
    const [tag] = await query<Tag & { post_count: number }>(
      `
      SELECT 
        t.*,
        COUNT(pt.postId) as post_count
      FROM tag t
      LEFT JOIN _posttotag pt ON t.id = pt.tagId
      WHERE t.id = ?
      GROUP BY t.id
    `,
      [result.insertId]
    );

    return NextResponse.json({
      ...tag,
      _count: {
        posts: Number(tag.post_count),
      },
    });
  } catch (error) {
    console.error("Error creating tag:", error);
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
    const { id, name } = body;

    if (!id || !name) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const slug = slugify(name, { lower: true });

    // Check if tag exists with same slug but different id
    const [existingTag] = await query<Tag>(
      "SELECT * FROM tag WHERE slug = ? AND id != ?",
      [slug, id]
    );

    if (existingTag) {
      return new NextResponse("Tag already exists", { status: 400 });
    }

    // Update tag
    await query(
      "UPDATE tag SET name = ?, slug = ?, updatedAt = NOW() WHERE id = ?",
      [name, slug, id] as DatabaseValue[]
    );

    // Fetch updated tag with post count
    const [tag] = await query<Tag & { post_count: number }>(
      `
      SELECT 
        t.*,
        COUNT(pt.postId) as post_count
      FROM tag t
      LEFT JOIN _posttotag pt ON t.id = pt.tagId
      WHERE t.id = ?
      GROUP BY t.id
    `,
      [id]
    );

    return NextResponse.json({
      ...tag,
      _count: {
        posts: Number(tag.post_count),
      },
    });
  } catch (error) {
    console.error("Error updating tag:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing tag ID", { status: 400 });
    }

    // Delete related records first
    await query("DELETE FROM _posttotag WHERE tagId = ?", [id]);
    await query("DELETE FROM tag WHERE id = ?", [id]);

    return new NextResponse("Tag deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
