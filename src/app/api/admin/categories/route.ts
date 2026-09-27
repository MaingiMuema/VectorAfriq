import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import slugify from "slugify";
import { query, DatabaseValue } from "@/lib/db";

interface BlogCategory {
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

    const tags = await query<BlogCategory & { post_count: number }>(
      `
      SELECT 
        bc.*,
        COUNT(bcp.postId) as post_count
      FROM blogcategory bc
      LEFT JOIN _blogcategorytopost bcp ON bc.id = bcp.categoryId
      WHERE bc.name LIKE ? OR bc.slug LIKE ?
      GROUP BY bc.id
      ORDER BY bc.name ASC
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
    console.error("Error fetching categories:", error);
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

    // Check if category exists
    const [existingCategory] = await query<BlogCategory>(
      "SELECT * FROM blogcategory WHERE slug = ?",
      [slug]
    );

    if (existingCategory) {
      return new NextResponse("Category already exists", { status: 400 });
    }

    // Create new category
    const [result] = await query<{ insertId: number }>(
      "INSERT INTO blogcategory (name, slug, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())",
      [name, slug]
    );

    // Fetch the created category with post count
    const [category] = await query<BlogCategory & { post_count: number }>(
      `
      SELECT 
        bc.*,
        COUNT(bcp.postId) as post_count
      FROM blogcategory bc
      LEFT JOIN _blogcategorytopost bcp ON bc.id = bcp.categoryId
      WHERE bc.id = ?
      GROUP BY bc.id
    `,
      [result.insertId]
    );

    return NextResponse.json({
      ...category,
      _count: {
        posts: Number(category.post_count),
      },
    });
  } catch (error) {
    console.error("Error creating category:", error);
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

    // Check if category exists with same slug but different id
    const [existingCategory] = await query<BlogCategory>(
      "SELECT * FROM blogcategory WHERE slug = ? AND id != ?",
      [slug, id]
    );

    if (existingCategory) {
      return new NextResponse("Category already exists", { status: 400 });
    }

    // Update category
    await query(
      "UPDATE blogcategory SET name = ?, slug = ?, updatedAt = NOW() WHERE id = ?",
      [name, slug, id] as DatabaseValue[]
    );

    // Fetch updated category with post count
    const [category] = await query<BlogCategory & { post_count: number }>(
      `
      SELECT 
        bc.*,
        COUNT(bcp.postId) as post_count
      FROM blogcategory bc
      LEFT JOIN _blogcategorytopost bcp ON bc.id = bcp.categoryId
      WHERE bc.id = ?
      GROUP BY bc.id
    `,
      [id]
    );

    return NextResponse.json({
      ...category,
      _count: {
        posts: Number(category.post_count),
      },
    });
  } catch (error) {
    console.error("Error updating category:", error);
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
      return new NextResponse("Missing category ID", { status: 400 });
    }

    // Delete related records first
    await query("DELETE FROM _blogcategorytopost WHERE categoryId = ?", [id]);
    await query("DELETE FROM blogcategory WHERE id = ?", [id]);

    return new NextResponse("Category deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting category:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
