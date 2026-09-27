import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, DatabaseValue } from "@/lib/db";
import { generateUniqueBlogSlug } from "@/lib/blogSlug";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}

interface Author {
  id: string;
  name: string | null;
  email: string;
}

async function createUniquePostSlug(
  slugSource: string,
  excludeId?: string
): Promise<string> {
  return generateUniqueBlogSlug(slugSource, async (slug) => {
    const sql = excludeId
      ? "SELECT id FROM post WHERE slug = ? AND id != ? LIMIT 1"
      : "SELECT id FROM post WHERE slug = ? LIMIT 1";
    const params = excludeId ? [slug, excludeId] : [slug];
    const [existingPost] = await query<{ id: string }>(sql, params);

    return Boolean(existingPost);
  });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const published = searchParams.get("published");

  // Allow public access only for published posts
  if (published !== "true" && (!session || session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const published = searchParams.get("published");

    const skip = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (search) {
      whereClause += " AND (p.title LIKE ? OR p.content LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (published !== null) {
      whereClause += " AND p.published = ?";
      params.push(published === "true" ? 1 : 0);
    }

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `
      SELECT COUNT(*) as total 
      FROM post p 
      ${whereClause}
    `,
      params
    );

    const total = countResult.total;

    // Get posts with related data
    const posts = await query<
      Post & { author: Author; categories: string; tags: string }
    >(
      `
      SELECT
        p.*,
        JSON_OBJECT(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as author,
        COALESCE(p.category, '[]') as categories,
        COALESCE(p.tag, '[]') as tags
      FROM post p
      LEFT JOIN user u ON p.authorId = u.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [...params, limit, skip]
    );

    // Parse JSON strings to objects
    const formattedPosts = posts.map((post) => ({
      ...post,
      author: JSON.parse(post.author as unknown as string),
      categories: JSON.parse(post.categories as unknown as string).filter(
        Boolean
      ),
      tags: JSON.parse(post.tags as unknown as string).filter(Boolean),
    }));

    return NextResponse.json({
      posts: formattedPosts,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
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
    const {
      title,
      slug: customSlug,
      content,
      excerpt,
      image,
      published,
      categories,
      tags,
    } =
      body;

    if (!title || !content) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const slug = await createUniquePostSlug(customSlug?.trim() || title);

    // Start transaction
    await query(
      `
      INSERT INTO post (
        id, title, slug, content, excerpt, image, published, authorId, category, tag, createdAt, updatedAt
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        title,
        slug,
        content,
        excerpt || null,
        image || null,
        published || false,
        session.user.id,
        categories ? JSON.stringify(categories) : "[]",
        tags ? JSON.stringify(tags) : "[]",
      ] as DatabaseValue[]
    );

    const [insertedPost] = await query("SELECT id FROM post WHERE slug = ?", [
      slug,
    ]);
    if (!insertedPost) {
      throw new Error("Failed to create post");
    }
    const postId = insertedPost.id;

    // Fetch created post with relationships
    const [post] = await query<
      Post & { author: Author; categories: string; tags: string }
    >(
      `
      SELECT
        p.*,
        JSON_OBJECT(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as author,
        COALESCE(p.category, '[]') as categories,
        COALESCE(p.tag, '[]') as tags
      FROM post p
      LEFT JOIN user u ON p.authorId = u.id
      WHERE p.id = ?
      GROUP BY p.id
    `,
      [postId]
    );

    return NextResponse.json({
      ...post,
      author: JSON.parse(post.author as unknown as string),
      categories: JSON.parse(post.categories as unknown as string).filter(
        Boolean
      ),
      tags: JSON.parse(post.tags as unknown as string).filter(Boolean),
    });
  } catch (error) {
    console.error("Error creating post:", error);
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
    const {
      id,
      title,
      slug: customSlug,
      content,
      excerpt,
      image,
      published,
      categories,
      tags,
    } = body;

    if (!id || (!title && customSlug === undefined && !content && published === undefined)) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    let slug;
    if (title || customSlug !== undefined) {
      let slugSource = customSlug?.trim() || title;

      if (!slugSource && customSlug !== undefined) {
        const [existingPost] = await query<{ title: string }>(
          "SELECT title FROM post WHERE id = ? LIMIT 1",
          [id]
        );
        slugSource = existingPost?.title;
      }

      if (slugSource) {
        slug = await createUniquePostSlug(slugSource, id);
      }
    }

    // Update post
    const updateFields: string[] = [];
    const updateParams: DatabaseValue[] = [];

    if (title) {
      updateFields.push("title = ?");
      updateParams.push(title);
    }
    if (slug) {
      updateFields.push("slug = ?");
      updateParams.push(slug);
    }
    if (content) {
      updateFields.push("content = ?");
      updateParams.push(content);
    }
    if (excerpt !== undefined) {
      updateFields.push("excerpt = ?");
      updateParams.push(excerpt || null);
    }
    if (image !== undefined) {
      updateFields.push("image = ?");
      updateParams.push(image || null);
    }
    if (published !== undefined) {
      updateFields.push("published = ?");
      updateParams.push(published);
    }

    // Update categories and tags if provided
    if (categories !== undefined) {
      updateFields.push("category = ?");
      updateParams.push(JSON.stringify(categories));
    }

    if (tags !== undefined) {
      updateFields.push("tag = ?");
      updateParams.push(JSON.stringify(tags));
    }

    updateFields.push("updatedAt = NOW()");
    updateParams.push(id);

    await query(
      `UPDATE post SET ${updateFields.join(", ")} WHERE id = ?`,
      updateParams
    );

    // Fetch updated post with relationships
    const [post] = await query<
      Post & { author: Author; categories: string; tags: string }
    >(
      `
      SELECT
        p.*,
        JSON_OBJECT(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as author,
        COALESCE(p.category, '[]') as categories,
        COALESCE(p.tag, '[]') as tags
      FROM post p
      LEFT JOIN user u ON p.authorId = u.id
      WHERE p.id = ?
      GROUP BY p.id
    `,
      [id]
    );

    return NextResponse.json({
      ...post,
      author: JSON.parse(post.author as unknown as string),
      categories: JSON.parse(post.categories as unknown as string).filter(
        Boolean
      ),
      tags: JSON.parse(post.tags as unknown as string).filter(Boolean),
    });
  } catch (error) {
    console.error("Error updating post:", error);
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
      return new NextResponse("Missing post ID", { status: 400 });
    }

    // Delete post
    await query("DELETE FROM post WHERE id = ?", [id]);

    return new NextResponse("Post deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting post:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
