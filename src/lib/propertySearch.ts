import { query, type DatabaseValue } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import type { BadgeTier, Property } from "@/types";
import {
  getVisibilityWeights,
  interleaveByRateCardTier,
} from "@/lib/rateCards";

interface CategoryCount {
  category: string;
  count: number;
}

interface DatabaseProperty extends Omit<Property, "images" | "features" | "company"> {
  images: string;
  features: string;
  user: string;
  company: string | null;
}

export interface PropertySearchParams {
  page?: number;
  limit?: number;
  category?: string;
  bedrooms?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  county?: string;
  city?: string;
  neighborhood?: string;
  sortBy?: string;
  sortOrder?: string;
  type?: string;
  featured?: boolean;
  userId?: string;
}

export interface PropertySearchResult {
  properties: Property[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  stats: Record<string, number>;
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 48;

function normalizePositiveInt(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || !value || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}

function normalizeLimit(value: number | undefined): number {
  return Math.min(normalizePositiveInt(value, DEFAULT_LIMIT), MAX_LIMIT);
}

function normalizePrice(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || value === undefined || value < 0) {
    return fallback;
  }

  return value;
}

function resolveOrderClause(
  sortBy: string | undefined,
  sortOrder: string | undefined
): string {
  const normalizedSortBy = (sortBy || "createdAt").trim().toLowerCase();
  const normalizedSortOrder =
    (sortOrder || "desc").trim().toLowerCase() === "asc" ? "ASC" : "DESC";

  if (normalizedSortBy === "price-asc") {
    return "p.price ASC";
  }

  if (normalizedSortBy === "price-desc") {
    return "p.price DESC";
  }

  if (normalizedSortBy === "newest") {
    return "p.createdAt DESC";
  }

  if (normalizedSortBy === "updatedat") {
    return `p.updatedAt ${normalizedSortOrder}`;
  }

  if (normalizedSortBy === "price") {
    return `p.price ${normalizedSortOrder}`;
  }

  return `p.createdAt ${normalizedSortOrder}`;
}

function parseFeatureList(value: string | null | undefined): string[] {
  try {
    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);
    if (parsed?.features && Array.isArray(parsed.features)) {
      return parsed.features;
    }

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (typeof parsed === "object" && parsed !== null) {
      const copy = { ...parsed } as Record<string, unknown>;
      delete copy.metadata;
      return Object.values(copy).filter(
        (item): item is string => typeof item === "string"
      );
    }

    return [];
  } catch (error) {
    console.error("Error parsing property features:", error);
    return [];
  }
}

function parseImages(value: string | null | undefined): string[] {
  try {
    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((image) => (typeof image === "string" ? image : ""))
      .filter(Boolean)
      .map((image) => (image.startsWith("/") ? image : `/${image}`));
  } catch (error) {
    console.error("Error parsing property images:", error);
    return [];
  }
}

function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Error parsing JSON value:", error);
    return null;
  }
}

function formatProperty(property: DatabaseProperty): Property {
  const parsedUser = safeJsonParse<{
    name?: string;
    avatar?: string | null;
    phone?: string;
    badgeTier?: string;
    rateCardTier?: string;
  }>(property.user);
  const parsedCompany = safeJsonParse<{
    id?: string;
    name?: string;
    logo?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  }>(property.company);
  const featureList = parseFeatureList(property.features);

  const company = parsedCompany?.id
    ? {
        id: parsedCompany.id,
        name: parsedCompany.name || "",
        logo: parsedCompany.logo || "",
        email: parsedCompany.email || "",
        phone: parsedCompany.phone || "",
        website: parsedCompany.website,
      }
    : undefined;

  // Strip the raw DB fields before spreading: `property.user`/`.company`
  // are JSON strings containing the agent's email, phone and bio, and
  // `property.userId` is an internal id - none of that should reach an
  // unauthenticated listing response.
  const publicFields: Record<string, unknown> = { ...property };
  delete publicFields.user;
  delete publicFields.company;
  delete publicFields.userId;
  delete publicFields.images;
  delete publicFields.features;

  return {
    ...publicFields,
    company,
    images: parseImages(property.images),
    features: featureList,
    agent: parsedUser
      ? {
          name: parsedUser.name || "Unknown Agent",
          image: parsedUser.avatar || null,
          company: parsedCompany?.name || undefined,
          phone: parsedUser.phone || undefined,
          whatsapp: parsedUser.phone || undefined,
          badgeTier: (parsedUser.badgeTier as BadgeTier) || "NONE",
          rateCardTier: parsedUser.rateCardTier || "NONE",
        }
      : undefined,
    // Used for tier-weighted result interleaving
    rateCardTier: parsedUser?.rateCardTier || "NONE",
    createdAt: new Date(property.createdAt),
    updatedAt: new Date(property.updatedAt),
  } as Property & { rateCardTier?: string };
}

export interface SimilarPropertyParams {
  /** Current search category – when provided, similar properties are from OTHER categories */
  category?: string;
  /** Current search type (SALE, RENT, AIRBNB) */
  type?: string;
  /** Current search location – when no category, similar properties are from DIFFERENT locations */
  location?: string;
  /** Average price of the current results (used to build ±30 % band) */
  averagePrice?: number;
  /** Minimum price of the current results (overrides averagePrice-based band) */
  minPrice?: number;
  /** Maximum price of the current results (overrides averagePrice-based band) */
  maxPrice?: number;
  /** Max number of similar properties to return (default 5) */
  limit?: number;
}

/**
 * Fetches "similar" properties for the sidebar:
 *
 * 1. **Category search** – when `category` is set the function returns
 *    properties from **other categories** (i.e. everything except the
 *    current one) that fall within a similar price range (±30 % of the
 *    average price of the current results).
 *
 * 2. **No category** – when `category` is absent the function returns
 *    properties from **different locations** that fall within a similar
 *    price range.
 */
export async function searchSimilarProperties(
  params: SimilarPropertyParams = {}
): Promise<Property[]> {
  noStore();

  const limit = normalizePositiveInt(params.limit, 5);
  const hasCategory = !!params.category;

  /* ------------------------------------------------------------------ */
  /* Price band                                                          */
  /* ------------------------------------------------------------------ */
  let bandMin: number;
  let bandMax: number;

  if (params.minPrice !== undefined && params.maxPrice !== undefined) {
    bandMin = params.minPrice;
    bandMax = params.maxPrice;
  } else if (params.averagePrice !== undefined && params.averagePrice > 0) {
    bandMin = Math.round(params.averagePrice * 0.7);
    bandMax = Math.round(params.averagePrice * 1.3);
  } else {
    bandMin = 0;
    bandMax = 999999999;
  }

  /* ------------------------------------------------------------------ */
  /* Build query                                                         */
  /* ------------------------------------------------------------------ */
  let whereClause = "WHERE p.status = 'AVAILABLE'";
  const whereParams: DatabaseValue[] = [];

  // Type filter (shared)
  if (params.type) {
    const lowerType = params.type.toLowerCase();
    const upperType = params.type.toUpperCase();
    whereClause += " AND (LOWER(p.type) = ? OR UPPER(p.type) = ?)";
    whereParams.push(lowerType, upperType);
  }

  // Price band (shared)
  if (bandMin > 0 || bandMax < 999999999) {
    whereClause += " AND p.price BETWEEN ? AND ?";
    whereParams.push(bandMin, bandMax);
  }

  if (hasCategory) {
    // ── Scenario 1: exclude the current category ──
    whereClause += " AND p.category != ?";
    whereParams.push(params.category!);
  } else {
    // ── Scenario 2: exclude the current location ──
    if (params.location) {
      whereClause += " AND p.location NOT LIKE ?";
      whereParams.push(`%${params.location}%`);
    }
  }

  const properties = await query<DatabaseProperty>(
    `
      SELECT
        p.*,
        JSON_OBJECT(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'phone', u.phone,
          'role', u.role,
          'avatar', u.avatar,
          'bio', u.bio,
          'badgeTier', u.badgeTier
        ) as user,
        IF(
          c.id IS NOT NULL,
          JSON_OBJECT(
            'id', c.id,
            'name', c.name,
            'logo', c.logo,
            'email', c.email,
            'phone', c.phone,
            'website', c.website,
            'address', c.address
          ),
          NULL
        ) as company
      FROM property p
      LEFT JOIN \`user\` u ON p.userId = u.id
      LEFT JOIN company c ON p.userId = c.userId
      ${whereClause}
      ORDER BY p.price ASC
      LIMIT ?
    `,
    [...whereParams, limit]
  );

  return properties.map(formatProperty);
}

export async function searchProperties(
  filters: PropertySearchParams = {}
): Promise<PropertySearchResult> {
  noStore();

  const page = normalizePositiveInt(filters.page, 1);
  const limit = normalizeLimit(filters.limit);
  const minPrice = normalizePrice(filters.minPrice, 0);
  const maxPrice = normalizePrice(filters.maxPrice, 999999999);
  const skip = (page - 1) * limit;

  let whereClause = "WHERE p.status = 'AVAILABLE'";
  let statsWhereClause = "WHERE p.status = 'AVAILABLE'";
  const params: DatabaseValue[] = [];
  const statsParams: DatabaseValue[] = [];
  const orderParams: DatabaseValue[] = [];

  const addSharedFilter = (condition: string, ...values: DatabaseValue[]) => {
    whereClause += condition;
    statsWhereClause += condition;

    if (values.length > 0) {
      params.push(...values);
      statsParams.push(...values);
    }
  };

  const addListingFilter = (condition: string, ...values: DatabaseValue[]) => {
    whereClause += condition;

    if (values.length > 0) {
      params.push(...values);
    }
  };

  if (filters.type) {
    const lowerType = filters.type.toLowerCase();
    const upperType = filters.type.toUpperCase();

    addSharedFilter(
      " AND (LOWER(p.type) = ? OR UPPER(p.type) = ?)",
      lowerType,
      upperType
    );
  }

  if (filters.featured) {
    addSharedFilter(" AND p.featured = true");
  }

  if (filters.userId) {
    addSharedFilter(" AND p.userId = ?", filters.userId);
  }

  if (minPrice > 0 || maxPrice < 999999999) {
    addSharedFilter(" AND p.price BETWEEN ? AND ?", minPrice, maxPrice);
  }

  if (filters.category) {
    addListingFilter(" AND p.category = ?", filters.category);
  }

  if (filters.bedrooms) {
    if (filters.bedrooms === "studio") {
      addSharedFilter(" AND p.bedrooms = ?", 0);
    } else if (filters.bedrooms === "5") {
      addSharedFilter(" AND p.bedrooms >= ?", 5);
    } else {
      const bedroomCount = Number.parseInt(filters.bedrooms, 10);
      if (Number.isFinite(bedroomCount)) {
        addSharedFilter(" AND p.bedrooms = ?", bedroomCount);
      }
    }
  }

  if (filters.county) {
    addSharedFilter(" AND p.location LIKE ?", `%${filters.county}%`);
  }

  if (filters.city) {
    addSharedFilter(" AND p.location LIKE ?", `%${filters.city}%`);
  }

  if (filters.neighborhood) {
    addSharedFilter(" AND p.location LIKE ?", `%${filters.neighborhood}%`);
  }

  if (
    filters.location &&
    !filters.county &&
    !filters.city &&
    !filters.neighborhood
  ) {
    addSharedFilter(" AND p.location LIKE ?", `%${filters.location}%`);
  }

  const [countResult] = await query<{ total: number }>(
    `
      SELECT COUNT(*) as total
      FROM property p
      ${whereClause}
    `,
    params
  );

  const total = countResult?.total || 0;

  const priorityLocation =
    filters.neighborhood || filters.city || filters.county || filters.location;

  let orderClause = "ORDER BY ";
  if (priorityLocation) {
    orderClause +=
      "CASE WHEN p.location = ? THEN 0 WHEN p.location LIKE ? THEN 1 ELSE 2 END, ";
    orderParams.push(priorityLocation, `${priorityLocation}%`);
  }

  orderClause += resolveOrderClause(filters.sortBy, filters.sortOrder);

  // Cap candidate window for tier interleaving (keeps memory bounded)
  const maxCandidates = Math.min(Math.max(limit * page * 4, 200), 800);
  const candidates = await query<DatabaseProperty & { rateCardTierRaw?: string }>(
    `
      SELECT
        p.*,
        COALESCE(u.rateCardTier, 'NONE') as rateCardTierRaw,
        JSON_OBJECT(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'phone', u.phone,
          'role', u.role,
          'avatar', u.avatar,
          'bio', u.bio,
          'badgeTier', u.badgeTier,
          'rateCardTier', COALESCE(u.rateCardTier, 'NONE')
        ) as user,
        IF(
          c.id IS NOT NULL,
          JSON_OBJECT(
            'id', c.id,
            'name', c.name,
            'logo', c.logo,
            'email', c.email,
            'phone', c.phone,
            'website', c.website,
            'address', c.address
          ),
          NULL
        ) as company
      FROM property p
      LEFT JOIN \`user\` u ON p.userId = u.id
      LEFT JOIN company c ON p.userId = c.userId
      ${whereClause}
      ${orderClause}
      LIMIT ?
    `,
    [...params, ...orderParams, maxCandidates]
  );

  const formatted = candidates.map((row) => {
    const prop = formatProperty(row) as Property & { rateCardTier?: string };
    prop.rateCardTier =
      row.rateCardTierRaw || prop.rateCardTier || "NONE";
    return prop;
  });

  // Apply rate-card visibility mix (Platinum / Gold / Silver %)
  // Skip weighted mix when user explicitly sorts by price
  const sortBy = (filters.sortBy || "newest").toLowerCase();
  const priceSort =
    sortBy === "price" ||
    sortBy === "price-asc" ||
    sortBy === "price-desc";

  let pageProperties: Property[];
  if (priceSort || formatted.length <= limit) {
    pageProperties = formatted.slice(skip, skip + limit);
  } else {
    const weights = await getVisibilityWeights();
    pageProperties = interleaveByRateCardTier(
      formatted,
      limit,
      page,
      weights
    ) as Property[];
  }

  const categoryCounts = await query<CategoryCount>(
    `
      SELECT
        p.category as category,
        COUNT(*) as count
      FROM property p
      ${statsWhereClause}
      GROUP BY p.category
      ORDER BY count DESC, p.category ASC
    `,
    statsParams
  );

  return {
    properties: pageProperties,
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalItems: total,
      itemsPerPage: limit,
    },
    stats: categoryCounts.reduce<Record<string, number>>((acc, current) => {
      acc[current.category] = current.count;
      return acc;
    }, {}),
  };
}
