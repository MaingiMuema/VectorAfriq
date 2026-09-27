import { query, type DatabaseValue } from "@/lib/db";
import {
  normalizeBedroomValue,
  normalizeCategoryValue,
} from "@/lib/search/searchUrl";

export interface NeighborhoodGuide {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  locationType: "county" | "city" | "neighborhood";
  countyId: string;
  cityId: string | null;
  neighborhoodId: string | null;
  categories: string[];
  bedrooms: string[] | null;
  listingTypes: string[] | null;
  published: boolean;
  sortOrder: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  countyName?: string;
  cityName?: string | null;
  neighborhoodName?: string | null;
}

interface GuideRow extends Omit<NeighborhoodGuide, "categories" | "bedrooms" | "listingTypes"> {
  categories: string;
  bedrooms: string | null;
  listingTypes: string | null;
  authorName?: string | null;
  authorEmail?: string | null;
}

function mapGuideRow(row: GuideRow): NeighborhoodGuide {
  return {
    ...row,
    categories: (() => {
      try {
        const parsed = JSON.parse(row.categories);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    })(),
    bedrooms: (() => {
      if (!row.bedrooms) return null;
      try {
        const parsed = JSON.parse(row.bedrooms);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : null;
      } catch {
        return null;
      }
    })(),
    listingTypes: (() => {
      if (!row.listingTypes) return null;
      try {
        const parsed = JSON.parse(row.listingTypes);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : null;
      } catch {
        return null;
      }
    })(),
  };
}

/**
 * Generate a URL-friendly slug from a title, ensuring uniqueness.
 */
export async function generateUniqueGuideSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  let slug = base || "guide";
  let counter = 0;

  while (true) {
    const whereClause = excludeId
      ? "WHERE slug = ? AND id != ?"
      : "WHERE slug = ?";
    const params = excludeId ? [slug, excludeId] : [slug];
    const [existing] = await query<{ id: string }>(
      `SELECT id FROM neighborhood_guides ${whereClause} LIMIT 1`,
      params as DatabaseValue[]
    );

    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

/**
 * Fetch paginated neighborhood guides for admin management.
 */
export async function getNeighborhoodGuides({
  page = 1,
  limit = 10,
  search = "",
  published,
  locationType,
}: {
  page?: number;
  limit?: number;
  search?: string;
  published?: boolean;
  locationType?: string;
} = {}) {
  const skip = (page - 1) * limit;
  let whereClause = "WHERE 1=1";
  const params: DatabaseValue[] = [];

  if (search) {
    whereClause += " AND (ng.title LIKE ? OR ng.excerpt LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (published !== undefined) {
    whereClause += " AND ng.published = ?";
    params.push(published ? 1 : 0);
  }

  if (locationType && ["county", "city", "neighborhood"].includes(locationType)) {
    whereClause += " AND ng.locationType = ?";
    params.push(locationType);
  }

  const [countResult] = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM neighborhood_guides ng ${whereClause}`,
    params
  );

  const guides = await query<GuideRow>(
    `
    SELECT
      ng.*,
      co.name AS countyName,
      ci.name AS cityName,
      nb.name AS neighborhoodName,
      u.name AS authorName,
      u.email AS authorEmail
    FROM neighborhood_guides ng
    LEFT JOIN county co ON ng.countyId = co.id
    LEFT JOIN city ci ON ng.cityId = ci.id
    LEFT JOIN neighborhood nb ON ng.neighborhoodId = nb.id
    LEFT JOIN user u ON ng.authorId = u.id
    ${whereClause}
    ORDER BY ng.sortOrder ASC, ng.createdAt DESC
    LIMIT ? OFFSET ?
    `,
    [...params, limit, skip]
  );

  return {
    guides: guides.map(mapGuideRow),
    total: countResult.total,
    pages: Math.ceil(countResult.total / limit),
  };
}

/**
 * Fetch a single neighborhood guide by ID.
 */
export async function getNeighborhoodGuideById(id: string) {
  const [guide] = await query<GuideRow>(
    `
    SELECT
      ng.*,
      co.name AS countyName,
      ci.name AS cityName,
      nb.name AS neighborhoodName
    FROM neighborhood_guides ng
    LEFT JOIN county co ON ng.countyId = co.id
    LEFT JOIN city ci ON ng.cityId = ci.id
    LEFT JOIN neighborhood nb ON ng.neighborhoodId = nb.id
    WHERE ng.id = ?
    LIMIT 1
    `,
    [id]
  );

  return guide ? mapGuideRow(guide) : null;
}

/**
 * Fetch a single neighborhood guide by slug (public).
 */
export async function getNeighborhoodGuideBySlug(slug: string) {
  const [guide] = await query<GuideRow>(
    `
    SELECT
      ng.*,
      co.name AS countyName,
      ci.name AS cityName,
      nb.name AS neighborhoodName
    FROM neighborhood_guides ng
    LEFT JOIN county co ON ng.countyId = co.id
    LEFT JOIN city ci ON ng.cityId = ci.id
    LEFT JOIN neighborhood nb ON ng.neighborhoodId = nb.id
    WHERE ng.slug = ? AND ng.published = 1
    LIMIT 1
    `,
    [slug]
  );

  return guide ? mapGuideRow(guide) : null;
}

/**
 * Fetch published neighborhood guides matching a search context.
 * Used on the search results page to show relevant guides.
 *
 * Match logic:
 * - Guide must be published
 * - Guide location must EXACTLY match the user's search location level
 *   (county pages show only county guides, city pages show only city guides,
 *    neighborhood pages show only neighborhood guides — no cascading)
 * - Guide categories: if a category is searched, guide must be tagged for it or marked "all"; if no category, guide must have no tags or be "all"
 * - Guide bedrooms: if bedrooms are searched, ONLY guides tagged for that
 *   specific bedroom are shown (strict — untagged general guides are excluded
 *   so each bedroom page shows its own bedroom-specific article); if no
 *   bedrooms are searched, guide must have no bedroom tags
 * - Values are normalized on both sides so e.g. "2 Bedrooms", "2-bedroom"
 *   and "2" all match a stored "2" tag, and "studio" matches "Studio".
 */
export async function getGuidesForSearchResults({
  countyId,
  cityId,
  neighborhoodId,
  category,
  bedrooms,
  listingType,
  limit = 4,
  page = 1,
  includeUnpublished = false,
}: {
  countyId?: string;
  cityId?: string;
  neighborhoodId?: string;
  category?: string;
  bedrooms?: string;
  listingType?: string;
  limit?: number;
  page?: number;
  /** When true (admin only), unpublished guides are also returned so admins
   *  can manage them directly from the search results page. */
  includeUnpublished?: boolean;
}): Promise<NeighborhoodGuide[]> {
  if (!countyId) return [];

  const normalizedCategory = normalizeCategoryValue(category);
  const normalizedBedrooms = normalizeBedroomValue(bedrooms);
  const normalizedListingType = listingType?.trim().toLowerCase() || undefined;

  // Build location matching conditions
  // Strict exact-level matching: guides only appear on pages that match their
  // specific location level. A city-level guide (e.g. "Apartments in Westlands")
  // does NOT cascade down to neighborhood pages, and a county-level guide
  // (e.g. "Apartments in Nairobi") does NOT cascade to city pages.
  const locationConditions: string[] = [];
  const locationParams: DatabaseValue[] = [];

  if (neighborhoodId) {
    // Neighborhood page: only show guides tagged to this exact neighborhood
    locationConditions.push("ng.neighborhoodId = ?");
    locationParams.push(neighborhoodId);
  } else if (cityId) {
    // City page: only show guides tagged to this exact city
    locationConditions.push("ng.cityId = ?");
    locationParams.push(cityId);
  } else {
    // County page: only show guides tagged to this exact county
    locationConditions.push("ng.countyId = ? AND ng.cityId IS NULL AND ng.neighborhoodId IS NULL");
    locationParams.push(countyId);
  }

  const guides = await query<GuideRow>(
    `
    SELECT
      ng.*,
      co.name AS countyName,
      ci.name AS cityName,
      nb.name AS neighborhoodName
    FROM neighborhood_guides ng
    LEFT JOIN county co ON ng.countyId = co.id
    LEFT JOIN city ci ON ng.cityId = ci.id
    LEFT JOIN neighborhood nb ON ng.neighborhoodId = nb.id
    WHERE ${includeUnpublished ? "" : "ng.published = 1 AND "}${locationConditions.join(" AND ")}
    ORDER BY ng.sortOrder ASC, ng.createdAt DESC
    LIMIT ? OFFSET ?
    `,
    [...locationParams, limit, (page - 1) * limit]
  );

  const results = guides.map(mapGuideRow);

  // Filter client-side based on JSON categories array
  // - "all" value in categories: guide appears on ALL category pages
  // - No category search ("All Properties" page): only show guides with no category tags (or "all")
  // - Category search: only show guides tagged for that specific category (or "all")
  const ALL_CATEGORIES = "all";
  // Normalize stored tags as well so lowercase/aliased tags (e.g. "bungalows")
  // stored when a guide is created from a page still match the canonical
  // category value ("BUNGALOWS").
  const matchesCategory = (guide: NeighborhoodGuide, target: string): boolean =>
    guide.categories.some(
      (tag) =>
        tag === ALL_CATEGORIES ||
        normalizeCategoryValue(tag) === target ||
        tag.trim().toLowerCase() === target.toLowerCase()
    );

  let filtered = results;
  if (normalizedCategory) {
    // Category-specific search: show guides tagged for this category or marked as "all"
    filtered = filtered.filter((guide) => matchesCategory(guide, normalizedCategory));
  } else {
    // No category ("All Properties" page): show guides with no category tags or marked as "all"
    filtered = filtered.filter(
      (guide) => guide.categories.length === 0 || guide.categories.includes(ALL_CATEGORIES)
    );
  }

  // Filter by bedrooms:
  // - No bedroom search: only show guides with no bedroom tags (general guides)
  // - Bedroom search: ONLY show guides tagged for that specific bedroom
  //   (strict match). Untagged general guides are deliberately excluded so
  //   a "1 Bedroom" search shows only the 1-bedroom article, a "Studio"
  //   search only the studio article, etc. Both sides are normalized so
  //   "2 Bedrooms", "2-bedroom" and "2" match a stored "2" tag.
  //
  // Studios are stored as 0-bedroom listings elsewhere in the codebase, so a
  // "0" tag is treated as equivalent to "studio" for matching purposes.
  const normalizeStoredBedroomTag = (tag: string): string | undefined => {
    const normalized = normalizeBedroomValue(tag);
    if (normalized === "0") return "studio";
    return normalized;
  };
  const normalizeTargetBedroom = (target: string): string | undefined => {
    if (target === "0") return "studio";
    return target;
  };
  const matchesBedrooms = (guide: NeighborhoodGuide, target: string): boolean => {
    const normalizedTarget = normalizeTargetBedroom(target);
    if (!normalizedTarget) return false;
    return (guide.bedrooms || []).some(
      (tag) => normalizeStoredBedroomTag(tag) === normalizedTarget
    );
  };

  if (normalizedBedrooms) {
    filtered = filtered.filter((guide) => matchesBedrooms(guide, normalizedBedrooms));
  } else {
    filtered = filtered.filter(
      (guide) => !guide.bedrooms || guide.bedrooms.length === 0
    );
  }

  // Filter by listing type:
  // - No listing type search: only show guides with no listing type tags (general guides)
  // - Listing type search: only show guides tagged for that specific type
  if (normalizedListingType) {
    filtered = filtered.filter(
      (guide) =>
        !guide.listingTypes ||
        guide.listingTypes.length === 0 ||
        guide.listingTypes.includes(normalizedListingType)
    );
  } else {
    filtered = filtered.filter(
      (guide) => !guide.listingTypes || guide.listingTypes.length === 0
    );
  }

  return filtered;
}



/**
 * Create a new neighborhood guide.
 */
export async function createNeighborhoodGuide(data: {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  image?: string;
  metaTitle?: string;
  metaDescription?: string;
  locationType: "county" | "city" | "neighborhood";
  countyId: string;
  cityId?: string;
  neighborhoodId?: string;
  categories: string[];
  bedrooms?: string[];
  listingTypes?: string[];
  published?: boolean;
  sortOrder?: number;
  authorId: string;
}) {
  await query(
    `
    INSERT INTO neighborhood_guides (
      id, title, slug, excerpt, content, image, metaTitle, metaDescription,
      locationType, countyId, cityId, neighborhoodId, categories, bedrooms, listingTypes,
      published, sortOrder, authorId, createdAt, updatedAt
    ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [
      data.title,
      data.slug,
      data.excerpt || null,
      data.content,
      data.image || null,
      data.metaTitle || null,
      data.metaDescription || null,
      data.locationType,
      data.countyId,
      data.cityId || null,
      data.neighborhoodId || null,
      JSON.stringify(data.categories),
      data.bedrooms ? JSON.stringify(data.bedrooms) : null,
      data.listingTypes ? JSON.stringify(data.listingTypes) : null,
      data.published ? 1 : 0,
      data.sortOrder || 0,
      data.authorId,
    ] as DatabaseValue[]
  );

  const [guide] = await query<GuideRow>(
    `SELECT id FROM neighborhood_guides WHERE slug = ?`,
    [data.slug]
  );

  if (!guide) throw new Error("Failed to create guide");

  return getNeighborhoodGuideById(guide.id);
}

/**
 * Update an existing neighborhood guide.
 */
export async function updateNeighborhoodGuide(
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image: string;
    metaTitle: string;
    metaDescription: string;
    locationType: "county" | "city" | "neighborhood";
    countyId: string;
    cityId: string;
    neighborhoodId: string;
    categories: string[];
    bedrooms: string[] | null;
    listingTypes: string[] | null;
    published: boolean;
    sortOrder: number;
  }>
) {
  const updateFields: string[] = [];
  const updateParams: DatabaseValue[] = [];

  if (data.title !== undefined) {
    updateFields.push("title = ?");
    updateParams.push(data.title);
  }
  if (data.slug !== undefined) {
    updateFields.push("slug = ?");
    updateParams.push(data.slug);
  }
  if (data.excerpt !== undefined) {
    updateFields.push("excerpt = ?");
    updateParams.push(data.excerpt || null);
  }
  if (data.content !== undefined) {
    updateFields.push("content = ?");
    updateParams.push(data.content);
  }
  if (data.image !== undefined) {
    updateFields.push("image = ?");
    updateParams.push(data.image || null);
  }
  if (data.metaTitle !== undefined) {
    updateFields.push("metaTitle = ?");
    updateParams.push(data.metaTitle || null);
  }
  if (data.metaDescription !== undefined) {
    updateFields.push("metaDescription = ?");
    updateParams.push(data.metaDescription || null);
  }
  if (data.locationType !== undefined) {
    updateFields.push("locationType = ?");
    updateParams.push(data.locationType);
  }
  if (data.countyId !== undefined) {
    updateFields.push("countyId = ?");
    updateParams.push(data.countyId);
  }
  if (data.cityId !== undefined) {
    updateFields.push("cityId = ?");
    updateParams.push(data.cityId || null);
  }
  if (data.neighborhoodId !== undefined) {
    updateFields.push("neighborhoodId = ?");
    updateParams.push(data.neighborhoodId || null);
  }
  if (data.categories !== undefined) {
    updateFields.push("categories = ?");
    updateParams.push(JSON.stringify(data.categories));
  }
  if (data.bedrooms !== undefined) {
    updateFields.push("bedrooms = ?");
    updateParams.push(data.bedrooms ? JSON.stringify(data.bedrooms) : null);
  }
  if (data.listingTypes !== undefined) {
    updateFields.push("listingTypes = ?");
    updateParams.push(data.listingTypes ? JSON.stringify(data.listingTypes) : null);
  }
  if (data.published !== undefined) {
    updateFields.push("published = ?");
    updateParams.push(data.published ? 1 : 0);
  }
  if (data.sortOrder !== undefined) {
    updateFields.push("sortOrder = ?");
    updateParams.push(data.sortOrder);
  }

  if (updateFields.length === 0) return getNeighborhoodGuideById(id);

  updateFields.push("updatedAt = NOW()");
  updateParams.push(id);

  await query(
    `UPDATE neighborhood_guides SET ${updateFields.join(", ")} WHERE id = ?`,
    updateParams
  );

  return getNeighborhoodGuideById(id);
}

/**
 * Delete a neighborhood guide.
 */
export async function deleteNeighborhoodGuide(id: string) {
  await query("DELETE FROM neighborhood_guides WHERE id = ?", [id]);
}

/**
 * Fetch all published neighborhood guides for the public index page.
 */
export async function getPublishedGuides(): Promise<NeighborhoodGuide[]> {
  const rows = await query<GuideRow>(
    `
    SELECT
      ng.*,
      co.name AS countyName,
      ci.name AS cityName,
      nb.name AS neighborhoodName
    FROM neighborhood_guides ng
    LEFT JOIN county co ON ng.countyId = co.id
    LEFT JOIN city ci ON ng.cityId = ci.id
    LEFT JOIN neighborhood nb ON ng.neighborhoodId = nb.id
    WHERE ng.published = 1
    ORDER BY ng.sortOrder ASC, ng.createdAt DESC
    LIMIT 50
    `
  );

  return rows.map(mapGuideRow);
}

/**
 * Search counties by name for the admin location picker.
 */
export async function searchCounties(search: string) {
  if (!search || search.length < 1) {
    return query<{ id: string; name: string }>(
      "SELECT id, name FROM county ORDER BY name ASC LIMIT 50"
    );
  }

  return query<{ id: string; name: string }>(
    `SELECT id, name FROM county WHERE name LIKE ? ORDER BY name ASC LIMIT 20`,
    [`%${search}%`]
  );
}

/**
 * Search cities by name, optionally filtered by county.
 */
export async function searchCities(search: string, countyId?: string) {
  let sql = `
    SELECT c.id, c.name, co.name AS countyName
    FROM city c
    JOIN county co ON c.countyId = co.id
    WHERE 1=1
  `;
  const params: DatabaseValue[] = [];

  if (countyId) {
    sql += " AND c.countyId = ?";
    params.push(countyId);
  }

  if (search && search.length >= 1) {
    sql += " AND c.name LIKE ?";
    params.push(`%${search}%`);
  }

  sql += " ORDER BY c.name ASC LIMIT 20";

  return query<{ id: string; name: string; countyName: string }>(sql, params);
}

/**
 * Search neighborhoods by name, optionally filtered by city or county.
 */
export async function searchNeighborhoods(
  search: string,
  cityId?: string,
  countyId?: string
) {
  let sql = `
    SELECT n.id, n.name, ci.name AS cityName, co.name AS countyName
    FROM neighborhood n
    JOIN city ci ON n.cityId = ci.id
    JOIN county co ON n.countyId = co.id
    WHERE 1=1
  `;
  const params: DatabaseValue[] = [];

  if (cityId) {
    sql += " AND n.cityId = ?";
    params.push(cityId);
  } else if (countyId) {
    sql += " AND n.countyId = ?";
    params.push(countyId);
  }

  if (search && search.length >= 1) {
    sql += " AND n.name LIKE ?";
    params.push(`%${search}%`);
  }

  sql += " ORDER BY n.name ASC LIMIT 20";

  return query<{
    id: string;
    name: string;
    cityName: string;
    countyName: string;
  }>(sql, params);
}
