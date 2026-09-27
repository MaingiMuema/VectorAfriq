"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import PropertiesListingPage from "@/components/properties/PropertiesListingPage";
import SearchSidebar from "@/components/search/SearchSidebar";
import PremiumFeaturesBanner from "@/components/properties/PremiumFeaturesBanner";
import SocialFollowLinks from "@/components/properties/SocialFollowLinks";
import PropertyStatsDisplay from "@/components/properties/PropertyStatsDisplay";
import SubscribeForm from "@/components/properties/SubscribeForm";
import { toast } from "react-hot-toast";
import { Suspense, useEffect, useRef } from "react";
import { usePropertyFetch } from "@/hooks/usePropertyFetch";
import { generateSeoDescription } from "@/app/actions/propertySeoAction";
import { normalizeCategoryValue } from "@/lib/search/searchUrl";

interface PropertyListingsClientProps {
  type?: "sale" | "rent" | "airbnb";
  category?: string;
  title: string;
  breadcrumbPath: string;
  description: string;
  locationId?: string;
}

function normalizeSelectedCategory(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return normalizeCategoryValue(value) || value;
}

export default function PropertyListingsClient({
  type,
  category,
  title,
  breadcrumbPath,
  description,
  locationId,
}: PropertyListingsClientProps) {
  const searchParams = useSearchParams();
  const toastShownRef = useRef(false);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    normalizeSelectedCategory(category)
  );

  const [seoDescription, setSeoDescription] = useState<string | null>(null);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

  const [currentPage, setCurrentPage] = useState(() => {
    const pageFromUrl = searchParams.get("page");
    return pageFromUrl ? parseInt(pageFromUrl) : 1;
  });

  const locationFromParam = searchParams.get("location");
  const categoryFromParam = searchParams.get("category");

  useEffect(() => {
    if (categoryFromParam) {
      setSelectedCategory(normalizeSelectedCategory(categoryFromParam));
    } else if (!category) {
      // Clear category if removed from URL and not provided via prop
      setSelectedCategory(null);
    } else if (category) {
      // Reset to prop if URL param is removed but prop exists (e.g. back navigation)
      setSelectedCategory(normalizeSelectedCategory(category));
    }
  }, [categoryFromParam, category]);

  // Use the new optimized hook for fetching properties
  const {
    properties,
    pagination,
    stats,
    loading,
    error,
    isFetching,
    refetch,
  } = usePropertyFetch({
    type,
    category: selectedCategory || undefined,
    location: locationId || locationFromParam || undefined,
    page: currentPage,
    limit: 6,
    enabled: true,
  });

  // Show toast only once on actual error (not during revalidation)
  useEffect(() => {
    if (error && !isFetching && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.error("Failed to load properties. Please try again.", { id: 'property-error' });
    }
    if (!error) {
      toastShownRef.current = false;
    }
  }, [error, isFetching]);

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
        .catch((err) => {
          console.error("Error fetching SEO desc:", err);
          setSeoError(err instanceof Error ? err.message : String(err));
        })
        .finally(() => setIsGeneratingSeo(false));
    }
  }, [properties, loading]);

  const handlePageChange = useCallback((page: number) => {
    if (loading || isFetching) return;

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
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [loading, isFetching]);

  const handleCategoryClick = useCallback((clickedCategory: string) => {
    // Prevent category changes while loading
    if (loading || isFetching) return;

    // If clicking the same category, clear the filter
    if (selectedCategory === clickedCategory) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(clickedCategory);
    }
    // Reset to first page when changing category
    setCurrentPage(1);
    // Update URL after state change
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      params.delete("page"); // Reset to page 1
      const newUrl = params.toString() ? `?${params.toString()}` : "";
      window.history.replaceState(null, "", window.location.pathname + newUrl);
    });
  }, [loading, isFetching, selectedCategory]);

  // Skeleton loading state - shows structure while loading
  if (loading) {
    return (
      <div className="pt-16 overflow-x-hidden">
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 max-w-full">
              {/* Main Content Skeleton */}
              <div className="w-full lg:w-3/4 order-2 lg:order-1">
                {/* Header Skeleton */}
                <div className="mb-6 space-y-3">
                  <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                </div>

                {/* Category Pills Skeleton */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                  ))}
                </div>

                {/* Property Cards Skeleton */}
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {/* Image Skeleton */}
                        <div className="w-full md:w-[340px] lg:w-[400px]">
                          <div className="h-[200px] sm:h-[240px] md:h-[280px] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
                          <div className="h-[60px] sm:h-[80px] bg-gray-100 flex gap-1 p-1">
                            {[1, 2, 3].map((j) => (
                              <div key={j} className="flex-1 bg-gray-200 rounded-sm animate-pulse"></div>
                            ))}
                          </div>
                        </div>
                        {/* Content Skeleton */}
                        <div className="flex-1 p-6 space-y-4">
                          <div className="space-y-2">
                            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3].map((j) => (
                              <div key={j} className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse"></div>
                            ))}
                          </div>
                          <div className="pt-4 border-t flex justify-between items-center">
                            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                            <div className="flex gap-2">
                              <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse"></div>
                              <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div className="w-full lg:w-1/4 order-1 lg:order-2">
                <div className="lg:sticky lg:top-24 h-fit space-y-4 lg:space-y-6">
                  <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
                  <div className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 overflow-x-hidden">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 max-w-full">
            {/* Main Content */}
            <div className="w-full lg:w-3/4 order-2 lg:order-1">
              {/* Inline loading indicator for background fetches */}
              {isFetching && !loading && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#468AD1]"></div>
                  <span>Updating...</span>
                </div>
              )}

              <PropertiesListingPage
                properties={properties}
                pagination={pagination}
                stats={stats}
                title={locationFromParam && !type && !category ? `Properties in ${locationFromParam}` : title}
                breadcrumbPath={breadcrumbPath}
                description={description}
                error={!!error}
                errorMessage={error || null}
                onPageChange={handlePageChange}
                selectedCategory={selectedCategory}
                onCategoryClick={handleCategoryClick}
                locationId={locationId}
                seoDescription={seoDescription}
                seoError={seoError}
                isGeneratingSeo={isGeneratingSeo}
              />
            </div>
            {/* Sidebar */}
            <div className="w-full lg:w-1/4 order-1 lg:order-2">
              <div className="lg:sticky lg:top-24 h-fit space-y-4 lg:space-y-6">
                <Suspense fallback={
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                }>
                  <SearchSidebar />
                </Suspense>
                <PremiumFeaturesBanner />
                <SocialFollowLinks />
                <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                    Get Property Updates
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                    Stay updated with the latest properties
                  </p>
                  <SubscribeForm />
                </div>
                <PropertyStatsDisplay stats={stats} />
              </div>
            </div>
          </div>

          {/* Mobile Search Toggle */}
          <div className="lg:hidden mt-4 mb-6">
            <button
              onClick={() => {
                const sidebar = document.getElementById('mobile-sidebar');
                if (sidebar) {
                  sidebar.classList.toggle('hidden');
                }
              }}
              className="w-full bg-white border rounded-lg p-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-700 font-medium">Filters & Search</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Mobile Sidebar */}
          <div id="mobile-sidebar" className="lg:hidden hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => {
              document.getElementById('mobile-sidebar')?.classList.add('hidden');
            }}></div>
            <div className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 overflow-y-auto">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-lg font-semibold">Search & Filters</h3>
                  <button
                    onClick={() => document.getElementById('mobile-sidebar')?.classList.add('hidden')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <SearchSidebar />
                <PremiumFeaturesBanner />
                <SocialFollowLinks />
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                    Get Property Updates
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Stay updated with the latest properties
                  </p>
                  <SubscribeForm />
                </div>
                <PropertyStatsDisplay stats={stats} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
