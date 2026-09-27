import { query } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import { getCanonicalBlogSlug, normalizeBlogSlug } from "@/lib/blogSlug";

export interface BlogCategory {
  id: string;
  name: string;
}

export interface BlogTag {
  id: string;
  name: string;
}

export interface BlogAuthor {
  id: string;
  name: string | null;
  email: string | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  categories: BlogCategory[];
  tags: BlogTag[];
  author: BlogAuthor;
}

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  authorId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  category: string | null;
  tag: string | null;
  author: string;
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

function parseJsonArray<T>(value: string | null): T[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    console.error("Failed to parse blog JSON array:", error);
    return [];
  }
}

export function formatBlogImage(image: string | null): string {
  if (!image) {
    return "/images/placeholder.png";
  }

  if (image.includes("vectorafriqproperties.co.ke")) {
    const match = image.match(/\/api\/images\/(.+)$/);
    if (match) {
      return `/api/images/${match[1]}`;
    }
  }

  return image;
}

function mapBlogPost(row: BlogPostRow): BlogPost {
  return {
    ...row,
    image: formatBlogImage(row.image),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    categories: parseJsonArray<BlogCategory>(row.category),
    tags: parseJsonArray<BlogTag>(row.tag),
    author: row.author
      ? JSON.parse(row.author)
      : { id: "", name: null, email: null },
  };
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  noStore();

  const rows = await query<BlogPostRow>(
    `
      ${POST_WITH_AUTHOR_SELECT}
      WHERE p.published = true
      ORDER BY p.createdAt DESC
    `
  );

  return rows.map(mapBlogPost);
}

export async function getBlogPostByIdentifier(
  identifier: string,
  options?: { includeUnpublished?: boolean }
): Promise<BlogPost | null> {
  noStore();

  const normalizedIdentifier = normalizeBlogSlug(identifier);
  const includeUnpublished = options?.includeUnpublished ?? false;
  const publishedClause = includeUnpublished ? "" : "AND p.published = true";

  let [post] = await query<BlogPostRow>(
    `
      ${POST_WITH_AUTHOR_SELECT}
      WHERE (p.id = ? OR p.slug = ? OR p.slug = ?)
      ${publishedClause}
      ORDER BY
        CASE
          WHEN p.id = ? THEN 0
          WHEN p.slug = ? THEN 1
          WHEN p.slug = ? THEN 2
          ELSE 3
        END
      LIMIT 1
    `,
    [
      identifier,
      identifier,
      normalizedIdentifier,
      identifier,
      identifier,
      normalizedIdentifier,
    ]
  );

  if (!post && normalizedIdentifier) {
    const candidates = await query<{ id: string; title: string; slug: string }>(
      `
        SELECT id, title, slug
        FROM post
        ${includeUnpublished ? "" : "WHERE published = true"}
      `
    );

    const matchedCandidate = candidates.find((candidate) => {
      return (
        normalizeBlogSlug(candidate.slug || "") === normalizedIdentifier ||
        normalizeBlogSlug(candidate.title || "") === normalizedIdentifier
      );
    });

    if (matchedCandidate) {
      [post] = await query<BlogPostRow>(
        `
          ${POST_WITH_AUTHOR_SELECT}
          WHERE p.id = ?
          LIMIT 1
        `,
        [matchedCandidate.id]
      );
    }
  }

  return post ? mapBlogPost(post) : null;
}

export function getBlogPlainText(content: string): string {
  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildBlogCategoriesWithCount(posts: BlogPost[]) {
  const categoryMap = new Map<
    string,
    { id: string; name: string; count: number }
  >();

  for (const post of posts) {
    for (const category of post.categories) {
      const existing = categoryMap.get(category.id);
      if (existing) {
        existing.count += 1;
      } else {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          count: 1,
        });
      }
    }
  }

  return Array.from(categoryMap.values());
}

export function getCanonicalBlogUrlPath(post: Pick<BlogPost, "id" | "slug" | "title">): string {
  return `/blogs/${getCanonicalBlogSlug(post)}`;
}
