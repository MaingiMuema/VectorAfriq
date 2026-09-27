import { redirect } from "next/navigation";
import { getCanonicalLocationSegments, resolveSearchLocationText } from "@/lib/search/searchLocation";
import {
  buildSearchResultsPath,
  normalizeBedroomValue,
  normalizeCategoryValue,
  type SearchListingType,
} from "@/lib/search/searchUrl";

type SearchPageParams = {
  type?: string | string[];
  category?: string | string[];
  bedrooms?: string | string[];
  location?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  sortBy?: string | string[];
  limit?: string | string[];
};

function getSearchParam(
  searchParams: SearchPageParams,
  key: keyof SearchPageParams
): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  return value?.trim() || undefined;
}

function normalizeListingType(value?: string): SearchListingType {
  if (value === "rent" || value === "airbnb") {
    return value;
  }

  return "sale";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchPageParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const listingType = normalizeListingType(getSearchParam(resolvedSearchParams, "type"));
  const category = normalizeCategoryValue(
    getSearchParam(resolvedSearchParams, "category")
  );
  const bedrooms = normalizeBedroomValue(
    getSearchParam(resolvedSearchParams, "bedrooms")
  );
  const location = getSearchParam(resolvedSearchParams, "location");
  const minPrice = getSearchParam(resolvedSearchParams, "minPrice");
  const maxPrice = getSearchParam(resolvedSearchParams, "maxPrice");
  const sortBy = getSearchParam(resolvedSearchParams, "sortBy");
  const limit = getSearchParam(resolvedSearchParams, "limit");

  const resolvedLocation = location
    ? await resolveSearchLocationText(location)
    : null;
  const locationSegments = resolvedLocation
    ? getCanonicalLocationSegments(resolvedLocation)
    : [];

  const path = buildSearchResultsPath({
    listingType,
    category,
    locationSegments,
    bedrooms,
  });
  const redirectParams = new URLSearchParams();

  if (location && locationSegments.length === 0) {
    redirectParams.set("location", location);
  }

  if (bedrooms && locationSegments.length === 0) {
    redirectParams.set("bedrooms", bedrooms);
  }

  if (minPrice) {
    redirectParams.set("minPrice", minPrice);
  }

  if (maxPrice) {
    redirectParams.set("maxPrice", maxPrice);
  }

  if (sortBy) {
    redirectParams.set("sortBy", sortBy);
  }

  if (limit) {
    redirectParams.set("limit", limit);
  }

  const redirectUrl = redirectParams.toString()
    ? `${path}?${redirectParams.toString()}`
    : path;

  redirect(redirectUrl);
}
