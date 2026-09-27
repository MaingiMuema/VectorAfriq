/**
 * Single source of truth for slug generation and URL classification.
 * Fixes D14 (three+ divergent generateSlug copies) and D18 (hardcoded pageType).
 *
 * Pure/no DB or Node-only imports — safe to use from client components too
 * (e.g. src/lib/propertyCache.ts's prefetch helper runs in the browser).
 */

export type EntityType = "static" | "property" | "blog_post" | "location" | "service";
export type PageType =
  | "static"
  | "property_listing"
  | "location_page"
  | "blog_post"
  | "service_page"
  | "category_page";

export interface UrlClassification {
  entityType: EntityType;
  entityId: string | null;
  pageType: PageType;
}

const STATIC_INVENTORY_PATH_PREFIXES = [
  "/properties-for-sale",
  "/properties-for-rent",
  "/houses-for-sale",
  "/houses-for-rent",
  "/apartments-for-sale",
  "/apartments-for-rent",
  "/land-for-sale",
  "/commercial-property-for-sale",
  "/commercial-property-for-rent",
  "/townhouses",
  "/villas-for-sale",
  "/airbnb",
  "/properties",
];

// Matches the [type]/[[...location]] catch-all search route, e.g. /for-sale/nairobi/kilimani
const INVENTORY_TYPE_SEGMENTS = new Set(["for-sale", "for-rent", "airbnb", "sale", "rent"]);

/** Generate URL-friendly slug from a title. Canonical implementation — do not duplicate. */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Build the canonical /listings/{slug}/{id} URL for a property. */
export function buildListingUrl(property: { id: string; title: string }): string {
  return `/listings/${generateSlug(property.title)}/${property.id}`;
}

/**
 * Classify a URL (absolute or relative) into an entity type / id / page type.
 * Used to resolve seo_optimization_task.pageUrl into a seo_page_override target
 * and to populate seo_optimization_task.pageType correctly (fixes D18).
 */
export function classifyUrl(url: string): UrlClassification {
  let path = url;
  try {
    if (/^https?:\/\//i.test(url)) {
      path = new URL(url).pathname;
    }
  } catch {
    // not a valid absolute URL — treat the raw string as a path
  }
  path = path.split("?")[0].split("#")[0];
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  const listingMatch = path.match(/^\/listings\/[^/]+\/([^/]+)$/);
  if (listingMatch) {
    return { entityType: "property", entityId: listingMatch[1], pageType: "property_listing" };
  }

  const blogMatch = path.match(/^\/blogs\/([^/]+)$/);
  if (blogMatch) {
    return { entityType: "blog_post", entityId: blogMatch[1], pageType: "blog_post" };
  }

  const serviceMatch = path.match(/^\/services\/([^/]+)$/);
  if (serviceMatch) {
    return { entityType: "service", entityId: serviceMatch[1], pageType: "service_page" };
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0 && INVENTORY_TYPE_SEGMENTS.has(segments[0])) {
    return { entityType: "location", entityId: segments.slice(1).join("/") || null, pageType: "location_page" };
  }

  if (STATIC_INVENTORY_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return { entityType: "location", entityId: null, pageType: "category_page" };
  }

  return { entityType: "static", entityId: null, pageType: "static" };
}
