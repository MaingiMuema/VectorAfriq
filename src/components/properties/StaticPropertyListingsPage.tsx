import PropertySearchResultsPage from "./PropertySearchResultsPage";
import { searchProperties, searchSimilarProperties } from "@/lib/propertySearch";
import {
  normalizeBedroomValue,
  normalizeCategoryValue,
  type SearchListingType,
} from "@/lib/search/searchUrl";
import { AIRBNB_PROPERTY_CATEGORIES } from "@/lib/propertyCategories";

export interface StaticListingSearchParams {
  category?: string | string[];
  bedrooms?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  location?: string | string[];
  sortBy?: string | string[];
  limit?: string | string[];
  page?: string | string[];
}

interface StaticPropertyListingsPageProps {
  title: string;
  description: string;
  breadcrumbPath: string;
  type?: SearchListingType;
  category?: string;
  searchParams: StaticListingSearchParams;
  categoryLinkMode?: "search" | "current";
  sidebarType?: SearchListingType;
}

function getSearchParamValue(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function StaticPropertyListingsPage({
  title,
  description,
  breadcrumbPath,
  type,
  category,
  searchParams,
  categoryLinkMode = "search",
  sidebarType,
}: StaticPropertyListingsPageProps) {
  const categoryParam = normalizeCategoryValue(getSearchParamValue(searchParams.category));
  const effectiveCategory = normalizeCategoryValue(category) || categoryParam;
  const bedrooms = normalizeBedroomValue(getSearchParamValue(searchParams.bedrooms));
  const location = getSearchParamValue(searchParams.location)?.trim();
  const minPrice = getSearchParamValue(searchParams.minPrice);
  const maxPrice = getSearchParamValue(searchParams.maxPrice);
  const sortBy = getSearchParamValue(searchParams.sortBy) || "newest";
  const limit = getSearchParamValue(searchParams.limit) || "10";
  const page = getSearchParamValue(searchParams.page) || "1";

  const result = await searchProperties({
    type,
    category: effectiveCategory,
    location,
    bedrooms,
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
      type,
      category: effectiveCategory,
      location,
      averagePrice,
      limit: 5,
    });
  })();

  return (
    <PropertySearchResultsPage
      title={title}
      description={description}
      breadcrumbPath={breadcrumbPath}
      currentPath={breadcrumbPath}
      result={result}
      queryState={{
        category: type ? undefined : effectiveCategory,
        location,
        bedrooms,
        minPrice,
        maxPrice,
        sortBy,
        limit,
      }}
      searchDefaults={{
        type: sidebarType || type || "sale",
        category: effectiveCategory,
        location,
        bedrooms,
        minPrice,
        maxPrice,
        sortBy,
        limit,
      }}
      categoryLinkMode={categoryLinkMode}
      allowedCategories={type === "airbnb" ? AIRBNB_PROPERTY_CATEGORIES : undefined}
      similarProperties={similarProperties}
    />
  );
}
