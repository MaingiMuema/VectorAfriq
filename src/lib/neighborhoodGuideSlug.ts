/**
 * Generate a URL-friendly slug from a title for neighborhood guides.
 */
export function generateNeighborhoodGuideSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

/**
 * Check if a slug was derived from the title (not a custom slug).
 */
export function isTitleDerivedGuideSlug(
  title: string,
  slug: string
): boolean {
  return generateNeighborhoodGuideSlug(title || "guide") === slug;
}
