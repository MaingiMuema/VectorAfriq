import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, pool } from "@/lib/db";
import { generateUniqueBlogSlug, normalizeBlogSlug } from "@/lib/blogSlug";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  category: string | null;
  tag: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface PostWithRelations extends Post {
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  categories: Category[];
  tags: Tag[];
}

const POST_WITH_AUTHOR_SELECT = `
  SELECT
    p.*,
    JSON_OBJECT(
      'id', u.id,
      'name', u.name,
      'email', u.email
    ) as author
  FROM post p
  LEFT JOIN user u ON p.authorId = u.id
`;

async function createUniquePostSlug(
  slugSource: string,
  excludeId: string
): Promise<string> {
  return generateUniqueBlogSlug(slugSource, async (slug) => {
    const [existingPost] = await query<{ id: string }>(
      "SELECT id FROM post WHERE slug = ? AND id != ? LIMIT 1",
      [slug, excludeId]
    );

    return Boolean(existingPost);
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const normalizedId = normalizeBlogSlug(id);
    const canViewUnpublished = session?.user.role === "ADMIN";
    console.log(`[API] Fetching post with ID/Slug: ${id}`);

    // Get post with author details and JSON columns
    let [post] = await query<Post & { author: string }>(
      `
      ${POST_WITH_AUTHOR_SELECT}
      WHERE (p.id = ? OR p.slug = ? OR p.slug = ?)
      ${canViewUnpublished ? "" : "AND p.published = true"}
      ORDER BY
        CASE
          WHEN p.id = ? THEN 0
          WHEN p.slug = ? THEN 1
          WHEN p.slug = ? THEN 2
          ELSE 3
        END
      LIMIT 1
      `,
      [id, id, normalizedId, id, id, normalizedId]
    );

    if (!post && normalizedId) {
      const candidates = await query<{ id: string; title: string; slug: string }>(
        `
        SELECT id, title, slug
        FROM post
        ${canViewUnpublished ? "" : "WHERE published = true"}
        `
      );
      const matchedCandidate = candidates.find((candidate) => {
        return (
          normalizeBlogSlug(candidate.slug || "") === normalizedId ||
          normalizeBlogSlug(candidate.title || "") === normalizedId
        );
      });

      if (matchedCandidate) {
        [post] = await query<Post & { author: string }>(
          `
          ${POST_WITH_AUTHOR_SELECT}
          WHERE p.id = ?
          LIMIT 1
          `,
          [matchedCandidate.id]
        );
      }
    }

    if (!post) {
      console.log(`[API] Post not found for ID/Slug: ${id}`);
      return new NextResponse("Post not found", { status: 404 });
    }

    // Format response
    const formattedPost: PostWithRelations = {
      ...post,
      author: JSON.parse(post.author as string),
      categories: post.category ? JSON.parse(post.category) : [],
      tags: post.tag ? JSON.parse(post.tag) : [],
    };

    return NextResponse.json(formattedPost);
  } catch (error) {
    console.error("Error fetching post:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ... (PATCH implementation remains the same as previously updated)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const connection = await pool.getConnection();

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      slug: customSlug,
      content,
      excerpt,
      image,
      published,
      categories: newCategories,
      tags: newTags,
    } = body;
    let slug: string | null = null;

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

    await connection.beginTransaction();

    // Update post
    const updateFields: string[] = [];
    const sqlParams: (string | number | boolean | null)[] = [];

    if (title) {
      updateFields.push("title = ?");
      sqlParams.push(title);
    }
    if (slug) {
      updateFields.push("slug = ?");
      sqlParams.push(slug);
    }
    if (content) {
      updateFields.push("content = ?");
      sqlParams.push(content);
    }
    if (excerpt !== undefined) {
      updateFields.push("excerpt = ?");
      sqlParams.push(excerpt || null);
    }
    if (image !== undefined) {
      updateFields.push("image = ?");
      sqlParams.push(image || null);
    }
    if (published !== undefined) {
      updateFields.push("published = ?");
      sqlParams.push(published);
    }
    if (newCategories !== undefined) {
      updateFields.push("category = ?");
      sqlParams.push(newCategories ? JSON.stringify(newCategories) : null);
    }
    if (newTags !== undefined) {
      updateFields.push("tag = ?");
      sqlParams.push(newTags ? JSON.stringify(newTags) : null);
    }

    if (updateFields.length > 0) {
      sqlParams.push(id);
      await connection.execute(
        `UPDATE post SET ${updateFields.join(
          ", "
        )}, updatedAt = NOW() WHERE id = ?`,
        sqlParams
      );
    }

    await connection.commit();

    // Fetch updated post with relationships
    const [post] = await query<Post & { author: string }>(
      `
      ${POST_WITH_AUTHOR_SELECT}
      WHERE p.id = ?
      `,
      [id]
    );

    // Format response
    const formattedPost: PostWithRelations = {
      ...post,
      author: JSON.parse(post.author as string),
      categories: post.category ? JSON.parse(post.category) : [],
      tags: post.tag ? JSON.parse(post.tag) : [],
    };

    return NextResponse.json(formattedPost);
  } catch (error) {
    await connection.rollback();
    console.error("Error updating post:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  } finally {
    connection.release();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const connection = await pool.getConnection();

  try {
    const { id } = await params;

    await connection.beginTransaction();

    // Delete the post
    await connection.execute("DELETE FROM post WHERE id = ?", [id]);

    await connection.commit();
    return new NextResponse("Post deleted successfully", { status: 200 });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting post:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  } finally {
    connection.release();
  }
}
