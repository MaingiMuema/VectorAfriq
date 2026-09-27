import slugify from "slugify";

const BLOG_SLUG_OPTIONS = {
  lower: true,
  strict: true,
  trim: true,
} as const;

const PERCENT_ENCODED_SEGMENT_RE = /%(?:[0-9A-Fa-f]{2})+/g;
const MAX_DECODE_PASSES = 3;

interface BlogSlugSource {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
}

export function generateBlogSlug(value: string): string {
  const normalizedValue = normalizeBlogSlugSource(value);
  const slug = slugify(normalizedValue, BLOG_SLUG_OPTIONS)
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "post";
}

export function normalizeBlogSlug(value: string): string {
  return generateBlogSlug(value);
}

export async function generateUniqueBlogSlug(
  value: string,
  isSlugTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = generateBlogSlug(value);
  let candidate = baseSlug;
  let suffix = 2;

  while (await isSlugTaken(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function getCanonicalBlogSlug(post: BlogSlugSource): string {
  if (post.slug?.trim()) {
    return normalizeBlogSlug(post.slug);
  }

  if (post.title?.trim()) {
    return generateBlogSlug(post.title);
  }

  return generateBlogSlug(post.id || "post");
}

export function getBlogPostPath(post: BlogSlugSource): string {
  return `/blogs/${getCanonicalBlogSlug(post)}`;
}

export function isTitleDerivedBlogSlug(
  title: string | null | undefined,
  slug: string | null | undefined
): boolean {
  if (!title?.trim() || !slug?.trim()) {
    return false;
  }

  return generateBlogSlug(title) === normalizeBlogSlug(slug);
}

function normalizeBlogSlugSource(value: string): string {
  return safelyDecodeSlug(value)
    .trim()
    .replace(/['\u2018\u2019]/g, "")
    .replace(/&/g, " and ")
    .replace(/[/"\u201C\u201D()[\]{}:;,!?]+/g, " ")
    .replace(/\s+/g, " ");
}

function safelyDecodeSlug(value: string): string {
  let decodedValue = value;

  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    const nextValue = decodedValue.replace(
      PERCENT_ENCODED_SEGMENT_RE,
      (segment) => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      }
    );

    if (nextValue === decodedValue) {
      break;
    }

    decodedValue = nextValue;
  }

  return decodedValue;
}
