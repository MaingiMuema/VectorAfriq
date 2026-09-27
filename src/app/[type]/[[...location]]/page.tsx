import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import PropertySearchResultsPage from "@/components/properties/PropertySearchResultsPage";
import LocationStructuredData from "@/components/seo/LocationStructuredData";
import { searchProperties, searchSimilarProperties } from "@/lib/propertySearch";
import {
  getCanonicalLocationSegments,
  getLocationDisplayName,
  getLocationFilters,
  resolveSearchLocationSegments,
  resolveSearchLocationText,
} from "@/lib/search/searchLocation";
import {
  buildInventorySlug,
  buildSearchResultsPath,
  getInventoryCollectionLabel,
  normalizeBedroomValue,
  normalizeCategoryValue,
  normalizePathSegment,
  parseBedroomSlug,
  parseInventorySlug,
  SearchListingType,
} from "@/lib/search/searchUrl";
import { AIRBNB_PROPERTY_CATEGORIES } from "@/lib/propertyCategories";
import { overlayPageOverride } from "@/lib/seo/metadata";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

type SearchPageSearchParams = {
  category?: string | string[];
  bedrooms?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  location?: string | string[];
  sortBy?: string | string[];
  limit?: string | string[];
  page?: string | string[];
};

type ResolvedPageFilters = {
  location: string;
  county?: string;
  city?: string;
  neighborhood?: string;
};

function getSearchParamValue(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toUrlSearchParams(searchParams: SearchPageSearchParams): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => params.append(key, item));
      return;
    }

    if (value) {
      params.set(key, value);
    }
  });

  return params;
}

function buildPageDescription(title: string, locationLabel?: string): string {
  if (locationLabel) {
    return `Browse ${title.toLowerCase()} in ${locationLabel}, Kenya. Compare prices, discover neighborhoods, and find verified listings on VectorAfriq.`;
  }

  return `Browse ${title.toLowerCase()} across Kenya. Compare prices, discover neighborhoods, and find verified listings on VectorAfriq.`;
}

async function resolvePageContext(
  inventorySegment: string,
  rawLocationSegments: string[] | undefined,
  searchParams: SearchPageSearchParams
) {
  const parsedInventory = parseInventorySlug(inventorySegment);
  if (!parsedInventory) {
    return null;
  }

  const queryCategory = normalizeCategoryValue(
    getSearchParamValue(searchParams.category)
  );
  const effectiveCategory = parsedInventory.category || queryCategory;
  const locationSegments = [...(rawLocationSegments || [])]
    .map(normalizePathSegment)
    .filter(Boolean);

  const pathBedroom = parseBedroomSlug(locationSegments[locationSegments.length - 1]);
  if (pathBedroom) {
    locationSegments.pop();
  }

  const bedrooms =
    pathBedroom || normalizeBedroomValue(getSearchParamValue(searchParams.bedrooms));
  const freeTextLocation = getSearchParamValue(searchParams.location)?.trim();
  const resolvedPathLocation = locationSegments.length
    ? await resolveSearchLocationSegments(locationSegments)
    : null;

  if (locationSegments.length > 0 && !resolvedPathLocation) {
    return null;
  }

  const resolvedQueryLocation =
    !resolvedPathLocation && freeTextLocation
      ? await resolveSearchLocationText(freeTextLocation)
      : null;
  const resolvedLocation = resolvedPathLocation || resolvedQueryLocation;

  const canonicalInventorySlug = buildInventorySlug({
    listingType: parsedInventory.listingType,
    category: effectiveCategory,
  });
  const canonicalLocationSegments = resolvedLocation
    ? getCanonicalLocationSegments(resolvedLocation)
    : [];
  const canonicalPath = buildSearchResultsPath({
    listingType: parsedInventory.listingType,
    category: effectiveCategory,
    locationSegments: canonicalLocationSegments,
    bedrooms,
  });
  const collectionLabel = getInventoryCollectionLabel({
    listingType: parsedInventory.listingType,
    category: effectiveCategory,
    bedrooms,
  });
  const locationDisplay = resolvedLocation
    ? getLocationDisplayName(resolvedLocation)
    : freeTextLocation;
  const filters: ResolvedPageFilters | undefined = resolvedLocation
    ? getLocationFilters(resolvedLocation)
    : freeTextLocation
      ? { location: freeTextLocation }
      : undefined;
  const title = locationDisplay
    ? `${collectionLabel} in ${locationDisplay}`
    : `${collectionLabel} in Kenya`;
  const description = buildPageDescription(collectionLabel, locationDisplay);

  return {
    parsedInventory,
    effectiveCategory,
    bedrooms,
    resolvedLocation,
    canonicalPath,
    canonicalInventorySlug,
    canonicalLocationSegments,
    locationDisplay,
    filters,
    title,
    description,
  };
}

function buildRedirectUrl(
  canonicalPath: string,
  searchParams: SearchPageSearchParams,
  options: {
    locationInPath: boolean;
    bedroomsInPath: boolean;
  }
): string {
  const params = toUrlSearchParams(searchParams);
  params.delete("category");

  if (options.locationInPath) {
    params.delete("location");
  }

  if (options.bedroomsInPath) {
    params.delete("bedrooms");
  }

  const queryString = params.toString();
  return queryString ? `${canonicalPath}?${queryString}` : canonicalPath;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; location?: string[] }>;
  searchParams: Promise<SearchPageSearchParams>;
}): Promise<Metadata> {
  const { type, location } = await params;
  const resolvedSearchParams = await searchParams;
  const context = await resolvePageContext(type, location, resolvedSearchParams);

  if (!context) {
    return {
      title: "Page Not Found",
    };
  }

  const baseMetadata: Metadata = {
    title: `${context.title} | VectorAfriq`,
    description: context.description,
    keywords: [
      context.title.toLowerCase(),
      `${context.locationDisplay || "Kenya"} real estate`,
      `${context.locationDisplay || "Kenya"} property listings`,
      `Kenya real estate`,
      `VectorAfriq ${context.locationDisplay || "Kenya"}`,
    ].join(", "),
    openGraph: {
      title: `${context.title} | VectorAfriq`,
      description: context.description,
      type: "website",
      locale: "en_US",
      siteName: "VectorAfriq Kenya",
    },
    twitter: {
      card: "summary_large_image",
      title: `${context.title} | VectorAfriq`,
      description: context.description,
    },
    alternates: {
      canonical: `${SITE_URL}${context.canonicalPath}`,
    },
  };

  return overlayPageOverride(context.canonicalPath, baseMetadata, { type: "location", id: context.canonicalPath });
}

export default async function LocationSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; location?: string[] }>;
  searchParams: Promise<SearchPageSearchParams>;
}) {
  const { type, location } = await params;
  const resolvedSearchParams = await searchParams;
  const context = await resolvePageContext(type, location, resolvedSearchParams);

  if (!context) {
    notFound();
  }

  const currentInventorySlug = normalizePathSegment(type);
  const currentLocationSegments = [...(location || [])]
    .map(normalizePathSegment)
    .filter(Boolean);
  const currentBedroom = parseBedroomSlug(
    currentLocationSegments[currentLocationSegments.length - 1]
  );
  const currentStructuralLocationSegments = currentBedroom
    ? currentLocationSegments.slice(0, -1)
    : currentLocationSegments;
  const shouldRedirect =
    currentInventorySlug !== context.canonicalInventorySlug ||
    currentStructuralLocationSegments.join("/") !==
      context.canonicalLocationSegments.join("/") ||
    (!!getSearchParamValue(resolvedSearchParams.category) &&
      !context.parsedInventory.category) ||
    (!!getSearchParamValue(resolvedSearchParams.location) &&
      context.canonicalLocationSegments.length > 0) ||
    (!!getSearchParamValue(resolvedSearchParams.bedrooms) &&
      context.canonicalLocationSegments.length > 0 &&
      !currentBedroom);

  if (shouldRedirect) {
    permanentRedirect(
      buildRedirectUrl(context.canonicalPath, resolvedSearchParams, {
        locationInPath: context.canonicalLocationSegments.length > 0,
        bedroomsInPath: context.canonicalLocationSegments.length > 0,
      })
    );
  }

  const minPrice = getSearchParamValue(resolvedSearchParams.minPrice);
  const maxPrice = getSearchParamValue(resolvedSearchParams.maxPrice);
  const sortBy = getSearchParamValue(resolvedSearchParams.sortBy) || "newest";
  const limit = getSearchParamValue(resolvedSearchParams.limit) || "10";
  const page = getSearchParamValue(resolvedSearchParams.page) || "1";

  const result = await searchProperties({
    type: context.parsedInventory.listingType,
    category: context.effectiveCategory,
    location: context.filters?.location,
    county: context.filters?.county,
    city: context.filters?.city,
    neighborhood: context.filters?.neighborhood,
    bedrooms: context.bedrooms,
    minPrice: minPrice ? Number.parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? Number.parseFloat(maxPrice) : undefined,
    sortBy,
    page: Number.parseInt(page, 10),
    limit: Number.parseInt(limit, 10),
  });

  /* ------------------------------------------------------------------ */
  /* Similar properties – from other categories (if category was set)   */
  /* or from other locations (if no category) within a similar range.    */
  /* ------------------------------------------------------------------ */
  const similarProperties = await (async () => {
    const prices = result.properties.map((p) => p.price).filter((p) => p > 0);
    const averagePrice =
      prices.length > 0
        ? prices.reduce((sum, p) => sum + p, 0) / prices.length
        : undefined;

    return searchSimilarProperties({
      type: context.parsedInventory.listingType,
      category: context.effectiveCategory,
      location: context.filters?.location,
      averagePrice,
      limit: 5,
    });
  })();

  const pageUrl = `${SITE_URL}${context.canonicalPath}`;
  const inventoryBasePath = `/${buildInventorySlug({
    listingType: context.parsedInventory.listingType,
    category: context.effectiveCategory,
  })}`;
  const mostSpecificLocationId =
    context.resolvedLocation?.neighborhood?.id ||
    context.resolvedLocation?.city?.id ||
    context.resolvedLocation?.county.id;

  return (
    <>
      {context.locationDisplay && context.canonicalLocationSegments.length > 0 && (
        <LocationStructuredData
          collectionLabel={getInventoryCollectionLabel({
            listingType: context.parsedInventory.listingType,
            category: context.effectiveCategory,
            bedrooms: context.bedrooms,
          })}
          basePath={inventoryBasePath}
          location={context.locationDisplay}
          propertyCount={result.pagination?.totalItems || 0}
          title={context.title}
          description={context.description}
          url={pageUrl}
        />
      )}
      <PropertySearchResultsPage
        title={context.title}
        breadcrumbPath={context.canonicalPath}
        description={context.description}
        currentPath={context.canonicalPath}
        result={result}
        locationId={mostSpecificLocationId}
        queryState={{
          location:
            context.canonicalLocationSegments.length === 0
              ? getSearchParamValue(resolvedSearchParams.location)
              : undefined,
          bedrooms:
            context.canonicalLocationSegments.length === 0
              ? context.bedrooms
              : undefined,
          minPrice,
          maxPrice,
          sortBy,
          limit,
        }}
        searchDefaults={{
          type: context.parsedInventory.listingType,
          category: context.effectiveCategory,
          location:
            context.locationDisplay ||
            getSearchParamValue(resolvedSearchParams.location),
          bedrooms: context.bedrooms,
          minPrice,
          maxPrice,
          sortBy,
          limit,
        }}
        allowedCategories={
          context.parsedInventory.listingType === "airbnb"
            ? AIRBNB_PROPERTY_CATEGORIES
            : undefined
        }
        similarProperties={similarProperties}
        countyId={context.resolvedLocation?.county?.id}
        cityId={context.resolvedLocation?.city?.id}
        neighborhoodId={context.resolvedLocation?.neighborhood?.id}
      />
    </>
  );
}

export const dynamicParams = true;
