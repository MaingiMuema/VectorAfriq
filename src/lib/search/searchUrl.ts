export type SearchListingType = "sale" | "rent" | "airbnb";
export type SearchLocationType = "county" | "city" | "neighborhood";

interface CategoryConfig {
  label: string;
  slug: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  APARTMENTS: { label: "Apartments", slug: "apartments" },
  BUNGALOWS: { label: "Bungalows", slug: "bungalows" },
  COMMERCIAL_PLOTS: {
    label: "Commercial Land",
    slug: "commercial-land",
  },
  COMMERCIAL_PROPERTIES: {
    label: "Commercial Properties",
    slug: "commercial-property",
  },
  DUPLEX: { label: "Duplex", slug: "duplex" },
  HOUSES: { label: "Houses", slug: "houses" },
  MAISONETTES: { label: "Maisonettes", slug: "maisonettes" },
  OFFICES: { label: "Offices", slug: "offices" },
  PENTHOUSES: { label: "Penthouses", slug: "penthouses" },
  RESIDENTIAL_PLOTS: {
    label: "Residential Land",
    slug: "residential-land",
  },
  STUDIOS: { label: "Studios", slug: "studios" },
  TOWNHOUSES: { label: "Townhouses", slug: "townhouses" },
  VILLAS: { label: "Villas", slug: "villas" },
};

const CATEGORY_ALIASES: Record<string, string> = {
  apartment: "APARTMENTS",
  apartments: "APARTMENTS",
  bungalows: "BUNGALOWS",
  bungalow: "BUNGALOWS",
  commercial: "COMMERCIAL_PROPERTIES",
  "commercial-land": "COMMERCIAL_PLOTS",
  "commercial-plot": "COMMERCIAL_PLOTS",
  "commercial-plots": "COMMERCIAL_PLOTS",
  "commercial-houses-plots": "COMMERCIAL_PLOTS",
  "commercial-properties": "COMMERCIAL_PROPERTIES",
  "commercial-property": "COMMERCIAL_PROPERTIES",
  duplex: "DUPLEX",
  house: "HOUSES",
  houses: "HOUSES",
  maisonette: "MAISONETTES",
  maisonettes: "MAISONETTES",
  office: "OFFICES",
  offices: "OFFICES",
  penthouse: "PENTHOUSES",
  penthouses: "PENTHOUSES",
  "plot-for-sale": "RESIDENTIAL_PLOTS",
  plot: "RESIDENTIAL_PLOTS",
  plots: "RESIDENTIAL_PLOTS",
  "residential-land": "RESIDENTIAL_PLOTS",
  "residential-plot": "RESIDENTIAL_PLOTS",
  "residential-plots": "RESIDENTIAL_PLOTS",
  land: "RESIDENTIAL_PLOTS",
  studio: "STUDIOS",
  studios: "STUDIOS",
  townhouse: "TOWNHOUSES",
  townhouses: "TOWNHOUSES",
  villa: "VILLAS",
  villas: "VILLAS",
};

export interface ParsedInventorySlug {
  inventorySlug: string;
  listingType: SearchListingType;
  category?: string;
  isLegacy: boolean;
}

export function normalizePathSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function normalizeCountyPathSegment(value: string): string {
  return normalizePathSegment(value).replace(/-county$/, "");
}

export function getPublicLocationSlug(
  value: string,
  type: SearchLocationType
): string {
  return type === "county"
    ? normalizeCountyPathSegment(value)
    : normalizePathSegment(value);
}

export function normalizeCategoryValue(
  value?: string | null
): string | undefined {
  if (!value) {
    return undefined;
  }

  const raw = value.trim();
  if (!raw) {
    return undefined;
  }

  const upper = raw.toUpperCase();
  if (CATEGORY_CONFIG[upper]) {
    return upper;
  }

  return CATEGORY_ALIASES[normalizePathSegment(raw)];
}

export function getCategoryLabel(category?: string): string {
  const normalizedCategory = normalizeCategoryValue(category);
  if (!normalizedCategory) {
    return "Properties";
  }

  return CATEGORY_CONFIG[normalizedCategory]?.label || "Properties";
}

export function getListingTypeLabel(listingType: SearchListingType): string {
  switch (listingType) {
    case "sale":
      return "For Sale";
    case "rent":
      return "For Rent";
    case "airbnb":
      return "Airbnb";
  }
}

export function buildInventorySlug({
  listingType,
  category,
}: {
  listingType: SearchListingType;
  category?: string;
}): string {
  const normalizedCategory = normalizeCategoryValue(category);

  if (!normalizedCategory) {
    return listingType === "sale"
      ? "properties-for-sale"
      : listingType === "rent"
        ? "properties-for-rent"
        : "airbnb";
  }

  const categorySlug =
    CATEGORY_CONFIG[normalizedCategory]?.slug ||
    normalizePathSegment(normalizedCategory);

  return listingType === "airbnb"
    ? `${categorySlug}-airbnb`
    : `${categorySlug}-for-${listingType}`;
}

export function parseInventorySlug(value: string): ParsedInventorySlug | null {
  const slug = normalizePathSegment(value);

  if (!slug) {
    return null;
  }

  if (slug === "for-sale") {
    return {
      inventorySlug: "properties-for-sale",
      listingType: "sale",
      isLegacy: true,
    };
  }

  if (slug === "for-rent") {
    return {
      inventorySlug: "properties-for-rent",
      listingType: "rent",
      isLegacy: true,
    };
  }

  if (slug === "property-for-sale" || slug === "properties-for-sale") {
    return {
      inventorySlug: "properties-for-sale",
      listingType: "sale",
      isLegacy: slug === "property-for-sale",
    };
  }

  if (slug === "property-for-rent" || slug === "properties-for-rent") {
    return {
      inventorySlug: "properties-for-rent",
      listingType: "rent",
      isLegacy: slug === "property-for-rent",
    };
  }

  if (slug === "airbnb" || slug === "property-for-airbnb") {
    return {
      inventorySlug: "airbnb",
      listingType: "airbnb",
      isLegacy: slug === "property-for-airbnb",
    };
  }

  const listingMatch = slug.match(/^(.*)-for-(sale|rent)$/);
  if (listingMatch) {
    const [, base, listingType] = listingMatch;
    const category = normalizeCategoryValue(base);

    if (!category) {
      return null;
    }

    return {
      inventorySlug: buildInventorySlug({
        listingType: listingType as SearchListingType,
        category,
      }),
      listingType: listingType as SearchListingType,
      category,
      isLegacy: false,
    };
  }

  const airbnbMatch = slug.match(/^(.*)-airbnb$/);
  if (airbnbMatch) {
    const [, base] = airbnbMatch;
    const category = normalizeCategoryValue(base);

    if (!category) {
      return null;
    }

    return {
      inventorySlug: buildInventorySlug({
        listingType: "airbnb",
        category,
      }),
      listingType: "airbnb",
      category,
      isLegacy: false,
    };
  }

  return null;
}

export function normalizeBedroomValue(
  bedrooms?: string | null
): string | undefined {
  if (!bedrooms) {
    return undefined;
  }

  const value = bedrooms.trim().toLowerCase();
  if (!value) {
    return undefined;
  }

  if (value === "studio") {
    return "studio";
  }

  const digits = value.match(/\d+/)?.[0];
  return digits || undefined;
}

export function buildBedroomSlug(
  bedrooms?: string | null
): string | undefined {
  const normalizedBedrooms = normalizeBedroomValue(bedrooms);
  if (!normalizedBedrooms) {
    return undefined;
  }

  if (normalizedBedrooms === "studio") {
    return "studio";
  }

  return `${normalizedBedrooms}-bedroom`;
}

export function parseBedroomSlug(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = normalizePathSegment(value);
  if (normalized === "studio") {
    return "studio";
  }

  const match = normalized.match(/^(\d+)-bedroom$/);
  return match?.[1];
}

export function getBedroomLabel(bedrooms?: string | null): string | null {
  const normalizedBedrooms = normalizeBedroomValue(bedrooms);
  if (!normalizedBedrooms) {
    return null;
  }

  if (normalizedBedrooms === "studio") {
    return "Studio";
  }

  return `${normalizedBedrooms} Bedroom`;
}

export function getInventoryCollectionLabel({
  listingType,
  category,
  bedrooms,
}: {
  listingType: SearchListingType;
  category?: string;
  bedrooms?: string;
}): string {
  const categoryLabel = getCategoryLabel(category);
  const bedroomLabel = getBedroomLabel(bedrooms);
  const bedroomPrefix = bedroomLabel ? `${bedroomLabel} ` : "";

  if (listingType === "airbnb") {
    return category
      ? `${bedroomPrefix}Airbnb ${categoryLabel}`
      : `${bedroomPrefix}Airbnb Properties`;
  }

  const subject = category ? categoryLabel : "Properties";
  return `${bedroomPrefix}${subject} ${getListingTypeLabel(listingType)}`;
}

export function buildSearchResultsPath({
  listingType,
  category,
  locationSegments = [],
  bedrooms,
}: {
  listingType: SearchListingType;
  category?: string;
  locationSegments?: string[];
  bedrooms?: string;
}): string {
  const parts = [
    buildInventorySlug({ listingType, category }),
    ...locationSegments.map(normalizePathSegment).filter(Boolean),
  ];

  const bedroomSlug = buildBedroomSlug(bedrooms);
  if (bedroomSlug && locationSegments.length > 0) {
    parts.push(bedroomSlug);
  }

  return `/${parts.join("/")}`;
}
