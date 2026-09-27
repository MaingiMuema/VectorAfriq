import Link from "next/link";
import Image from "next/image";
import {
  getBedroomOptions,
  propertyCategoryDisplayNames,
  SEARCH_PROPERTY_CATEGORIES,
} from "@/lib/propertyCategories";
import { getCategoryLabel, type SearchListingType } from "@/lib/search/searchUrl";
import type { PropertySearchResult } from "@/lib/propertySearch";
import type { Property } from "@/types";
import { processImageUrl } from "@/lib/imageUtils";
import { getPropertyUrl } from "@/lib/propertyCache";
import PropertyBanner from "@/components/banners/PropertyBanner";
import PropertyListContainer from "./PropertyListContainer";
import SaveSearchButton from "./SaveSearchButton";
import StickySidebar from "./StickySidebar";
import NeighborhoodGuideFetcher from "@/components/neighborhood-guides/NeighborhoodGuideFetcher";
import PaginationLinks, { type PaginationItem } from "./PaginationLinks";

interface ListingQueryState {
  category?: string;
  location?: string;
  bedrooms?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  limit?: string;
}

interface ListingSearchDefaults {
  type: SearchListingType;
  category?: string;
  location?: string;
  bedrooms?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  limit?: string;
}

interface PropertySearchResultsPageProps {
  title: string;
  description: string;
  breadcrumbPath: string;
  currentPath: string;
  result: PropertySearchResult;
  locationId?: string;
  queryState: ListingQueryState;
  searchDefaults: ListingSearchDefaults;
  categoryLinkMode?: "search" | "current";
  /** When set, only these categories are shown in filter pills and the sidebar dropdown */
  allowedCategories?: string[];
  /** Properties from other categories or locations at a similar price range */
  similarProperties?: Property[];
  /** Location IDs for neighborhood guide matching */
  countyId?: string;
  cityId?: string;
  neighborhoodId?: string;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function buildCurrentPageHref(
  currentPath: string,
  queryState: ListingQueryState,
  overrides: Partial<ListingQueryState & { page?: number | undefined }>
): string {
  const params = new URLSearchParams();
  const merged = { ...queryState, ...overrides };

  if (merged.location) {
    params.set("location", merged.location);
  }

  if (merged.category) {
    params.set("category", merged.category);
  }

  if (merged.bedrooms) {
    params.set("bedrooms", merged.bedrooms);
  }

  if (merged.minPrice) {
    params.set("minPrice", merged.minPrice);
  }

  if (merged.maxPrice) {
    params.set("maxPrice", merged.maxPrice);
  }

  if (merged.sortBy && merged.sortBy !== "newest") {
    params.set("sortBy", merged.sortBy);
  }

  if (merged.limit && merged.limit !== "10") {
    params.set("limit", merged.limit);
  }

  if (overrides.page && overrides.page > 1) {
    params.set("page", String(overrides.page));
  }

  const query = params.toString();
  return query ? `${currentPath}?${query}` : currentPath;
}

function buildSearchHref(
  defaults: ListingSearchDefaults,
  overrides: Partial<ListingSearchDefaults>
): string {
  const params = new URLSearchParams();
  const merged = { ...defaults, ...overrides };

  params.set("type", merged.type);

  if (merged.category) {
    params.set("category", merged.category);
  }

  if (merged.location) {
    params.set("location", merged.location);
  }

  if (merged.bedrooms) {
    params.set("bedrooms", merged.bedrooms);
  }

  if (merged.minPrice) {
    params.set("minPrice", merged.minPrice);
  }

  if (merged.maxPrice) {
    params.set("maxPrice", merged.maxPrice);
  }

  if (merged.sortBy && merged.sortBy !== "newest") {
    params.set("sortBy", merged.sortBy);
  }

  if (merged.limit && merged.limit !== "10") {
    params.set("limit", merged.limit);
  }

  return `/search?${params.toString()}`;
}

function getPaginationItems(currentPage: number, totalPages: number): Array<number | string> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | string> = [1];
  if (currentPage > 3) {
    items.push("...");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    if (!items.includes(page)) {
      items.push(page);
    }
  }

  if (currentPage < totalPages - 2) {
    items.push("...");
  }

  if (!items.includes(totalPages)) {
    items.push(totalPages);
  }

  return items;
}

function buildPaginationProps(
  currentPath: string,
  currentPage: number,
  totalPages: number,
  queryState: ListingQueryState
): {
  items: PaginationItem[];
  prevHref: string | null;
  nextHref: string | null;
} {
  const items: PaginationItem[] = getPaginationItems(currentPage, totalPages).map((item) =>
    item === "..."
      ? { ellipsis: true }
      : {
          page: item as number,
          href: buildCurrentPageHref(currentPath, queryState, { page: item as number }),
        }
  );

  return {
    items,
    prevHref:
      currentPage > 1
        ? buildCurrentPageHref(currentPath, queryState, { page: currentPage - 1 })
        : null,
    nextHref:
      currentPage < totalPages
        ? buildCurrentPageHref(currentPath, queryState, { page: currentPage + 1 })
        : null,
  };
}

function SearchSidebarForm({
  defaults,
  allowedCategories,
}: {
  defaults: ListingSearchDefaults;
  allowedCategories?: string[];
}) {
  const bedroomOptions = getBedroomOptions(defaults.category || undefined);
  const categoryOptions = allowedCategories ?? SEARCH_PROPERTY_CATEGORIES;

  return (
    <form
      action="/search"
      method="get"
      className="w-full max-w-full bg-white rounded-xl shadow-sm border p-4 xl:p-5"
    >
      <div className="flex rounded-lg bg-gray-100 p-1 mb-5">
        {[
          { value: "sale", label: "For Sale" },
          { value: "rent", label: "For Rent" },
          { value: "airbnb", label: "Airbnb" },
        ].map((option) => (
          <label key={option.value} className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="type"
              value={option.value}
              defaultChecked={defaults.type === option.value}
              className="peer sr-only"
            />
            <span className="block py-2 px-2 rounded-md text-sm font-medium transition-colors text-center text-gray-600 hover:text-gray-900 peer-checked:bg-[#468AD1] peer-checked:text-white">
              {option.label}
            </span>
          </label>
        ))}
      </div>

      <div className="space-y-3.5">
        <div>
          <label htmlFor="sidebar-location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            id="sidebar-location"
            type="text"
            name="location"
            defaultValue={defaults.location}
            placeholder="Enter a county, city or neighbourhood"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#468AD1]/20 focus:border-[#468AD1] text-gray-600 placeholder-gray-400 text-sm"
          />
        </div>

        <div>
          <label htmlFor="sidebar-category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="sidebar-category"
            name="category"
            defaultValue={defaults.category || ""}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#468AD1]/20 focus:border-[#468AD1] text-gray-600"
          >
            <option value="">All Categories</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {propertyCategoryDisplayNames[option as keyof typeof propertyCategoryDisplayNames]}
              </option>
            ))}
          </select>
        </div>

        <details className="rounded-lg border border-gray-200 bg-gray-50">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-700 [&::-webkit-details-marker]:hidden">
            More Filters
          </summary>
          <div className="px-4 pb-4 space-y-4">
            <div>
              <label htmlFor="sidebar-bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <select
                id="sidebar-bedrooms"
                name="bedrooms"
                defaultValue={defaults.bedrooms || ""}
                className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#468AD1]/20 focus:border-[#468AD1] text-gray-600"
              >
                {bedroomOptions.map((option) => (
                  <option key={option.value || "any"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sidebar-min-price" className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <input
                  id="sidebar-min-price"
                  type="number"
                  name="minPrice"
                  min="0"
                  defaultValue={defaults.minPrice}
                  placeholder="Min"
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#468AD1]/20 focus:border-[#468AD1] text-gray-600"
                />
              </div>
              <div>
                <label htmlFor="sidebar-max-price" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <input
                  id="sidebar-max-price"
                  type="number"
                  name="maxPrice"
                  min="0"
                  defaultValue={defaults.maxPrice}
                  placeholder="Max"
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#468AD1]/20 focus:border-[#468AD1] text-gray-600"
                />
              </div>
            </div>
          </div>
        </details>

        {defaults.sortBy && defaults.sortBy !== "newest" && (
          <input type="hidden" name="sortBy" value={defaults.sortBy} />
        )}
        {defaults.limit && defaults.limit !== "10" && (
          <input type="hidden" name="limit" value={defaults.limit} />
        )}

        <button
          type="submit"
          className="w-full bg-[#468AD1] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#c9273a] transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}

function CategoryLinks({
  stats,
  currentPath,
  queryState,
  searchDefaults,
  selectedCategory,
  mode,
  allowedCategories,
}: {
  stats: Record<string, number>;
  currentPath: string;
  queryState: ListingQueryState;
  searchDefaults: ListingSearchDefaults;
  selectedCategory?: string;
  mode: "search" | "current";
  allowedCategories?: string[];
}) {
  const entries = Object.entries(stats).filter(([category]) =>
    allowedCategories ? allowedCategories.includes(category) : true
  );
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex flex-nowrap overflow-x-auto gap-2 pb-1 lg:flex-wrap scrollbar-hide">
        {entries.map(([category, count]) => {
          const isSelected = selectedCategory === category;
          const href =
            mode === "current"
              ? buildCurrentPageHref(currentPath, queryState, {
                  category: isSelected ? undefined : category,
                  page: undefined,
                })
              : buildSearchHref(searchDefaults, {
                  category: isSelected ? undefined : category,
                });

          return (
            <Link
              key={category}
              href={href}
              className={`text-sm px-3 py-2 border rounded-md transition-colors flex-shrink-0 ${
                isSelected
                  ? "bg-[#468AD1] text-white border-[#468AD1] hover:bg-[#468AD1]/90"
                  : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600"
              }`}
            >
              {getCategoryLabel(category)} ({formatNumber(count)})
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function PropertySearchResultsPage({
  title,
  description,
  breadcrumbPath,
  currentPath,
  result,
  locationId,
  queryState,
  searchDefaults,
  categoryLinkMode = "search",
  allowedCategories,
  similarProperties = [],
  countyId,
  cityId,
  neighborhoodId,
}: PropertySearchResultsPageProps) {
  const currentPage = result.pagination.currentPage;
  const totalPages = result.pagination.totalPages;
  const showingFrom =
    result.pagination.totalItems === 0
      ? 0
      : result.pagination.itemsPerPage * (currentPage - 1) + 1;
  const showingTo =
    result.pagination.totalItems === 0
      ? 0
      : Math.min(
          result.pagination.itemsPerPage * currentPage,
          result.pagination.totalItems
        );
  const savedSearchUrl = buildCurrentPageHref(currentPath, queryState, {});
  const savedSearch = {
    name: title,
    criteria: {
      type: searchDefaults.type,
      category: searchDefaults.category || queryState.category,
      location: searchDefaults.location || queryState.location,
      bedrooms: searchDefaults.bedrooms || queryState.bedrooms,
      minPrice: searchDefaults.minPrice || queryState.minPrice,
      maxPrice: searchDefaults.maxPrice || queryState.maxPrice,
      sortBy: queryState.sortBy || searchDefaults.sortBy,
      limit: queryState.limit || searchDefaults.limit,
    },
    url: savedSearchUrl,
    matchCount: result.pagination.totalItems,
  };

  return (
    <div className="pt-16">
      <div className="w-full bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link href={breadcrumbPath} className="hover:text-primary">
              Search
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-primary font-medium">{title}</span>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-5 lg:py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-[calc(100%-30rem)] xl:w-3/4">
              <div className="bg-white border rounded-xl p-4 lg:p-5 mb-4">
                <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-[28px] leading-tight font-bold text-gray-900">{title}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                      <span className="font-medium text-gray-800">
                        {formatNumber(result.pagination.totalItems)} properties found
                      </span>
                      <span className="hidden sm:inline text-gray-300">|</span>
                      <span>
                        Showing {showingFrom} - {showingTo} of {formatNumber(result.pagination.totalItems)} listings
                      </span>
                    </div>
                    <p className="mt-2 hidden max-w-3xl text-sm leading-6 text-gray-600 sm:block">{description}</p>
                    <div className="mt-4">
                      <SaveSearchButton search={savedSearch} />
                    </div>
                  </div>

                  <form
                    action={currentPath}
                    method="get"
                    className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-row sm:items-end xl:flex-shrink-0"
                  >
                    {queryState.location && (
                      <input type="hidden" name="location" value={queryState.location} />
                    )}
                    {queryState.category && (
                      <input type="hidden" name="category" value={queryState.category} />
                    )}
                    {queryState.bedrooms && (
                      <input type="hidden" name="bedrooms" value={queryState.bedrooms} />
                    )}
                    {queryState.minPrice && (
                      <input type="hidden" name="minPrice" value={queryState.minPrice} />
                    )}
                    {queryState.maxPrice && (
                      <input type="hidden" name="maxPrice" value={queryState.maxPrice} />
                    )}

                    <label className="text-sm text-gray-600">
                      <span className="block mb-1">Sort by</span>
                      <select
                        name="sortBy"
                        defaultValue={queryState.sortBy || "newest"}
                        className="w-full sm:w-52 border rounded-lg px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="newest">Newest First</option>
                        <option value="price-asc">Price (Low to High)</option>
                        <option value="price-desc">Price (High to Low)</option>
                      </select>
                    </label>

                    <label className="text-sm text-gray-600">
                      <span className="block mb-1">Show</span>
                      <select
                        name="limit"
                        defaultValue={queryState.limit || "10"}
                        className="w-full sm:w-40 border rounded-lg px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="6">6 per page</option>
                        <option value="10">10 per page</option>
                        <option value="12">12 per page</option>
                        <option value="24">24 per page</option>
                        <option value="48">48 per page</option>
                      </select>
                    </label>

                    <button
                      type="submit"
                      className="col-span-2 px-5 py-2.5 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors font-medium sm:col-span-1"
                    >
                      Update
                    </button>
                  </form>
                </div>
              </div>

              <CategoryLinks
                stats={result.stats}
                currentPath={currentPath}
                queryState={queryState}
                searchDefaults={searchDefaults}
                selectedCategory={queryState.category || searchDefaults.category}
                mode={categoryLinkMode}
                allowedCategories={allowedCategories}
              />

              <div className="mb-4">
                <PropertyBanner
                  fallbackDescription={description}
                  locationId={locationId}
                />
                <noscript>
                  <div className="w-full rounded-lg overflow-hidden shadow-md bg-gray-900 text-white px-6 md:px-8 flex items-center aspect-[4/1]">
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold mb-1">
                        Find Your Perfect Property
                      </h2>
                      <p className="text-xs md:text-sm text-gray-200 font-light">
                        {description}
                      </p>
                    </div>
                  </div>
                </noscript>
              </div>

              {result.properties.length > 0 ? (
                <>
                  <PropertyListContainer properties={result.properties} />
                  <PaginationLinks
                    currentPage={currentPage}
                    totalPages={totalPages}
                    {...buildPaginationProps(currentPath, currentPage, totalPages, queryState)}
                  />
                </>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Properties Found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your search criteria or browse related listings.
                  </p>
                </div>
              )}

              {/* Neighborhood Guides Section – SEO optimized */}
              <NeighborhoodGuideFetcher
                countyId={countyId}
                cityId={cityId}
                neighborhoodId={neighborhoodId}
                category={queryState.category || searchDefaults.category}
                bedrooms={queryState.bedrooms || searchDefaults.bedrooms}
                listingType={searchDefaults.type}
                locationLabel={searchDefaults.location}
                page={currentPage}
              />
            </div>

            <div className="w-full lg:w-[28rem] xl:w-1/4 lg:flex-shrink-0 lg:self-stretch">
              <StickySidebar>
                <SearchSidebarForm defaults={searchDefaults} allowedCategories={allowedCategories} />

                {/* Similar Properties – from other categories or other locations */}
                {similarProperties.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {searchDefaults.category
                        ? "Similar by Category"
                        : "Similar by Location"}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      {searchDefaults.category
                        ? "Properties in other categories within a similar price range"
                        : "Properties in other areas within a similar price range"}
                    </p>
                    <div className="space-y-3">
                      {similarProperties.map((property) => (
                        <Link
                          key={property.id}
                          href={getPropertyUrl(property.id, property.title)}
                          className="group flex gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="relative w-20 h-16 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={processImageUrl(property.images[0], property.id)}
                              alt={property.title}
                              fill
                              sizes="80px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-[#468AD1] transition-colors">
                              {property.title}
                            </h4>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {property.location}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {getCategoryLabel(property.category)}
                            </p>
                            <p className="text-sm font-bold text-[#468AD1] mt-1">
                              KES {property.price?.toLocaleString()}
                              {property.type === "RENT" && (
                                <span className="text-xs font-normal text-gray-500">/mo</span>
                              )}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] rounded-lg shadow-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">
                      Premium Features
                    </h3>
                    <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-semibold rounded-full">
                      PRO
                    </span>
                  </div>

                  <div className="space-y-3 text-white/90 text-sm leading-6">
                    <p>Virtual tours available for selected listings.</p>
                    <p>Verified listings across major Kenyan markets.</p>
                    <p>Priority support for faster follow-up.</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Follow VectorAfriq
                  </h3>
                  <div className="flex gap-3">
                    <a
                      href="https://www.facebook.com/p/Property-Finder-KE-100063636204360/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
                    >
                      Facebook
                    </a>
                    <a
                      href="https://www.youtube.com/@vectorafriqproperties"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
                    >
                      YouTube
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Available Properties
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(result.stats).map(([category, count]) => (
                      <div key={category} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-gray-600">{getCategoryLabel(category)}</span>
                        <span className="ml-auto text-gray-900 font-medium">
                          {formatNumber(count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </StickySidebar>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
