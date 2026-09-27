import { query } from "@/lib/db";

/**
 * Safely execute a query that may fail if the table doesn't exist yet.
 * Returns the fallback value instead of throwing.
 */
async function safeQuery<T>(sql: string, params: (string | number)[] = [], fallback: T[]): Promise<T[]> {
  try {
    return await query<T>(sql, params);
  } catch (err) {
    const error = err as { code?: string; errno?: number };
    // MySQL error 1146 = Table doesn't exist
    if (error.errno === 1146 || error.code === 'ER_NO_SUCH_TABLE') {
      console.warn('[servicePages] service_pages table not found, using fallback');
      return fallback;
    }
    throw err;
  }
}

export interface ServicePageRecord {
  id: string;
  configKey: string;
  slug: string;
  previousSlugs: string[];
  title: string;
  shortTitle: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string | null;
  ogDescription: string | null;
  canonicalUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ServicePageRow {
  id: string;
  configKey: string;
  slug: string;
  previousSlugs: string | null;
  title: string;
  shortTitle: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string | null;
  ogDescription: string | null;
  canonicalUrl: string | null;
  isActive: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ServicePageLinkRow {
  slug: string;
  title: string;
}

function parseRow(row: ServicePageRow): ServicePageRecord {
  return {
    ...row,
    previousSlugs: row.previousSlugs ? JSON.parse(row.previousSlugs) : [],
    isActive: Boolean(row.isActive),
  };
}

/**
 * Fetch all active service pages, ordered by sortOrder.
 */
export async function getActiveServicePages(): Promise<ServicePageRecord[]> {
  const rows = await safeQuery<ServicePageRow>(
    "SELECT * FROM service_pages WHERE isActive = 1 ORDER BY sortOrder ASC, createdAt ASC",
    [],
    []
  );
  return rows.map(parseRow);
}

/**
 * Find a service page by its current slug.
 */
export async function getServicePageBySlug(
  slug: string
): Promise<ServicePageRecord | null> {
  const rows = await safeQuery<ServicePageRow>(
    "SELECT * FROM service_pages WHERE slug = ? AND isActive = 1",
    [slug],
    []
  );
  return rows.length > 0 ? parseRow(rows[0]) : null;
}

/**
 * Given a slug, check if it's a previous (old) slug that should 301-redirect.
 * Returns the current slug if found, or null if no redirect needed.
 */
export async function findRedirectForSlug(
  slug: string
): Promise<string | null> {
  const rows = await safeQuery<ServicePageRow>(
    "SELECT slug, previousSlugs FROM service_pages WHERE isActive = 1",
    [],
    []
  );
  for (const row of rows) {
    const prev: string[] = row.previousSlugs ? JSON.parse(row.previousSlugs) : [];
    if (prev.includes(slug)) {
      return row.slug;
    }
  }
  return null;
}

/**
 * Get all service pages (including inactive) for admin use.
 */
export async function getAllServicePages(): Promise<ServicePageRecord[]> {
  const rows = await safeQuery<ServicePageRow>(
    "SELECT * FROM service_pages ORDER BY sortOrder ASC, createdAt ASC",
    [],
    []
  );
  return rows.map(parseRow);
}

/**
 * Get service pages as a simple list for navbar/dropdowns.
 * Returns { slug, title } for active pages.
 */
export async function getServicePageLinks(): Promise<
  { slug: string; title: string }[]
> {
  const rows = await safeQuery<ServicePageLinkRow>(
    "SELECT slug, title FROM service_pages WHERE isActive = 1 ORDER BY sortOrder ASC",
    [],
    []
  );
  return rows;
}
