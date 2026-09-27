"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PropertyListContainer from "./PropertyListContainer";
import SearchSidebar from "@/components/search/SearchSidebar";
import { Property } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { FaHeart } from "react-icons/fa";
import PropertyBanner from "@/components/banners/PropertyBanner";
import Pagination from "@/components/common/Pagination";
import { usePropertyFetch } from "@/hooks/usePropertyFetch";
import { generateSeoDescription } from "@/app/actions/propertySeoAction";

interface PropertyListingsClientSearchProps {
  type: string;
  title: string;
  location: string;
  breadcrumbPath: string;
  description: string;
  category?: string;
  bedrooms?: string;
  locationId?: string;
  locationFilters?: {
    location?: string;
    county?: string;
    city?: string;
    neighborhood?: string;
  };
  currentFilters?: {
    category?: string;
    location?: string;
    locationPath?: string[];
    minPrice?: string;
    maxPrice?: string;
    type?: "sale" | "rent" | "airbnb";
  };
  initialData?: {
    properties: Property[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
}

export default function PropertyListingsClientSearch({
  type,
  title,
  location,
  breadcrumbPath,
  description,
  category,
  bedrooms,
  locationId,
  locationFilters,
  currentFilters,
  initialData,
}: PropertyListingsClientSearchProps) {
  const searchParams = useSearchParams();

  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get("limit") || "10"));
  const [seoDescription, setSeoDescription] = useState<string | null>(null);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

  const [currentPage, setCurrentPage] = useState(() => {
    const pageFromUrl = searchParams.get("page");
    return pageFromUrl ? parseInt(pageFromUrl) : (initialData?.pagination?.currentPage || 1);
  });

  const minPrice = searchParams.get("minPrice") || currentFilters?.minPrice;
  const maxPrice = searchParams.get("maxPrice") || currentFilters?.maxPrice;
  const locationQuery = searchParams.get("location") || locationFilters?.location || location;

  // Use the optimized hook
  const {
    properties,
    pagination,
    loading,
    error: fetchError,
    isFetching
  } = usePropertyFetch({
    type,
    location: locationQuery,
    county: locationFilters?.county,
    city: locationFilters?.city,
    neighborhood: locationFilters?.neighborhood,
    page: currentPage,
    limit: itemsPerPage,
    sortBy: sortBy === "newest" ? "createdAt" :
      sortBy === "price-asc" ? "price-asc" :
        sortBy === "price-desc" ? "price-desc" : "createdAt",
    category,
    bedrooms,
    minPrice,
    maxPrice,
    initialData: initialData ? {
      properties: initialData.properties,
      pagination: {
        ...initialData.pagination,
        itemsPerPage: 10 // Default since initialData doesn't have it
      }
    } : undefined
  });

  // Use hook error if present
  const displayError = fetchError;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Update URL after state change using microtask
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      if (page > 1) {
        params.set("page", page.toString());
      } else {
        params.delete("page");
      }
      const newUrl = params.toString() ? `?${params.toString()}` : "";
      window.history.replaceState(null, "", window.location.pathname + newUrl);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1); // Reset to first page when sorting changes
    // Update URL after state change
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      if (newSortBy !== "newest") {
        params.set("sortBy", newSortBy);
      } else {
        params.delete("sortBy");
      }
      params.delete("page"); // Reset to page 1
      const newUrl = params.toString() ? `?${params.toString()}` : "";
      window.history.replaceState(null, "", window.location.pathname + newUrl);
    });
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when items per page changes
    // Update URL after state change
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      if (newLimit !== 10) {
        params.set("limit", newLimit.toString());
      } else {
        params.delete("limit");
      }
      params.delete("page"); // Reset to page 1
      const newUrl = params.toString() ? `?${params.toString()}` : "";
      window.history.replaceState(null, "", window.location.pathname + newUrl);
    });
  };

  // Effect to sync URL params if they change externally (back/forward button)
  useEffect(() => {
    const page = searchParams.get("page");
    if (page) setCurrentPage(parseInt(page));

    const sort = searchParams.get("sortBy");
    if (sort) setSortBy(sort);

    const limit = searchParams.get("limit");
    if (limit) setItemsPerPage(parseInt(limit));
  }, [searchParams]);

  // Fetch SEO description when properties change
  useEffect(() => {
    if (properties && properties.length > 0 && !loading) {
      setIsGeneratingSeo(true);
      setSeoDescription(null);
      setSeoError(null);
      generateSeoDescription(properties)
        .then((result) => {
          if (result.text) {
            setSeoDescription(result.text);
          }
          if (result.error) {
            setSeoError(result.error);
            console.error("SEO Generation Error:", result.error);
          }
        })
        .catch((error) => {
          console.error("Error fetching SEO desc:", error);
          setSeoError(error instanceof Error ? error.message : String(error));
        })
        .finally(() => setIsGeneratingSeo(false));
    }
  }, [properties, loading]);

  return (
    <div className="pt-16">
      {/* Breadcrumb */}
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
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-lg text-gray-600">
              {loading ? "Loading..." : displayError ? "Error loading properties" : `${pagination.totalItems} Properties found`}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Property List */}
            <div className="w-full lg:w-3/4">
              {/* Sort, Items per Page, and Save Search */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="border rounded-lg px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={loading}
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-asc">Price (Low to High)</option>
                      <option value="price-desc">Price (High to Low)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                      className="border rounded-lg px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={loading}
                    >
                      <option value="6">6 per page</option>
                      <option value="12">12 per page</option>
                      <option value="24">24 per page</option>
                      <option value="48">48 per page</option>
                    </select>
                  </div>
                </div>

                <button className="flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary/20 disabled:opacity-50">
                  <FaHeart className="w-4 h-4" />
                  <span>Save Search</span>
                </button>
              </div>

              {/* Dynamic Banner */}
              <PropertyBanner
                fallbackDescription={description}
                locationId={locationId}
              />

              {/* Property List */}
              {displayError ? (
                <div className="text-center py-12">
                  <div className="w-[200px] h-[200px] mx-auto mb-4">
                    <Image
                      src="/images/error.svg"
                      alt="Error"
                      width={200}
                      height={200}
                      className="w-full h-full opacity-50"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-red-600 mb-2">
                    Error Loading Properties
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {displayError}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Try Again
                  </button>
                </div>
              ) : loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading properties...</p>
                  </div>
                </div>
              ) : properties.length > 0 ? (
                <>
                  <PropertyListContainer properties={properties} />
                  <Pagination
                    totalPages={pagination.totalPages}
                    currentPage={pagination.currentPage}
                    onPageChange={handlePageChange}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-[200px] h-[200px] mx-auto mb-4">
                    <Image
                      src="/images/no-results.svg"
                      alt="No results found"
                      width={200}
                      height={200}
                      className="w-full h-full"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Properties Found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your search criteria or browse our other
                    properties
                  </p>
                </div>
              )}

              {/* SEO Description */}
              {(seoDescription || seoError || isGeneratingSeo) && (
                <div className={`bg-white p-5 rounded-lg shadow-sm mt-8 border-l-4 ${seoError ? 'border-red-500' : 'border-primary'}`}>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                    {seoError ? "SEO Generator Error" : "About these Properties"}
                  </h3>
                  {isGeneratingSeo ? (
                    <div className="animate-pulse flex flex-col gap-2 pt-1">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  ) : seoError ? (
                    <div className="text-red-600 bg-red-50 p-3 rounded text-sm font-mono break-all">
                      {seoError}
                      <p className="mt-2 text-xs text-red-500">Hint: Verify your API Key and Model configuration in .env</p>
                    </div>
                  ) : (
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {seoDescription}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="sticky top-24 h-fit space-y-6">
              <SearchSidebar currentFilters={currentFilters} />



              {/* Premium Features Banner */}
              <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Premium Features
                  </h3>
                  <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-semibold rounded-full">
                    PRO
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/90">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Virtual Tours Available</p>
                      <p className="text-sm text-white/70">
                        Experience properties from anywhere
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-white/90">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">24/7 Support</p>
                      <p className="text-sm text-white/70">
                        Get help whenever you need it
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-white/90">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Verified Listings</p>
                      <p className="text-sm text-white/70">
                        All properties are thoroughly vetted
                      </p>
                    </div>
                  </div>
                </div>

                <button className="w-full mt-6 px-4 py-2.5 bg-white text-gray-900 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                  Upgrade to Premium
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </button>
              </div>

              {/* VectorAfriq Follow Banner */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Follow VectorAfriq
                </h3>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Subscribe Section */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Get Property Updates
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Stay updated with the latest properties
                </p>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button className="w-full px-4 py-2 bg-[#468AD1] text-white rounded-md text-sm hover:bg-[#514f63] transition-colors">
                    Subscribe Now
                  </button>
                </div>
              </div>

              {/* Available Properties */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Available Properties
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-gray-600">Houses</span>
                    <span className="ml-auto text-gray-900 font-medium">
                      2,145
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-gray-600">Apartments</span>
                    <span className="ml-auto text-gray-900 font-medium">
                      1,873
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-gray-600">Commercial</span>
                    <span className="ml-auto text-gray-900 font-medium">
                      432
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-gray-600">Bedsitters</span>
                    <span className="ml-auto text-gray-900 font-medium">
                      965
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
