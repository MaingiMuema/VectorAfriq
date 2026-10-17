"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FiPlus, FiDownload } from "react-icons/fi";
import { toast } from "react-hot-toast";
import ListingTable from "@/components/listings/ListingTable";
import ListingFilters from "@/components/listings/ListingFilters";
import Pagination from "@/components/common/Pagination";

type ListingStatus = "active" | "pending" | "expired";

interface ApiListing {
  id: string;
  title: string;
  type: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  status: "AVAILABLE" | "RENTED" | "SOLD" | "EXPIRED";
  featured: boolean;
  images: string; // JSON string of image URLs
  createdAt: string;
}

interface Listing {
  id: string;
  title: string;
  type: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  status: ListingStatus;
  featured: boolean;
  images: string[];
  createdAt: string;
}

interface ListingsResponse {
  success: boolean;
  properties: ApiListing[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

interface FilterOptions {
  status?: string;
  type?: string;
  featured?: string;
  priceRange?: string;
}

const PAGE_SIZES = [10, 20, 50];

const mapApiStatusToTableStatus = (
  apiStatus: ApiListing["status"]
): ListingStatus => {
  switch (apiStatus) {
    case "AVAILABLE":
      return "active";
    case "RENTED":
    case "SOLD":
      return "pending";
    case "EXPIRED":
      return "expired";
    default:
      return "active";
  }
};

// Safely parse the JSON image payload stored on the property row.
const parseImages = (imagesJson: string | null, propertyId: string): string[] => {
  if (!imagesJson) return ["/images/placeholder.png"];

  try {
    const images =
      typeof imagesJson === "string" ? JSON.parse(imagesJson) : imagesJson;

    if (!Array.isArray(images)) return ["/images/placeholder.png"];

    const processedImages = images.map((img) => {
      if (typeof img !== "string") return "/images/placeholder.png";
      if (img.startsWith("/api/images/")) return img;
      let filename = img;
      if (img.includes("/")) {
        const pathParts = img.split("/");
        filename = pathParts[pathParts.length - 1];
      }
      return `/api/images/serve/${propertyId}/${filename}`;
    });

    return processedImages.length > 0 ? processedImages : ["/images/placeholder.png"];
  } catch {
    return ["/images/placeholder.png"];
  }
};

function buildFilterParams(filters: FilterOptions): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status.toUpperCase());
  if (filters.type) params.append("type", filters.type);
  if (filters.featured) {
    params.append("featured", filters.featured === "featured" ? "true" : "false");
  }
  if (filters.priceRange) {
    const range = filters.priceRange.trim();
    if (range.endsWith("+")) {
      const min = Number(range.slice(0, -1));
      if (Number.isFinite(min)) params.append("minPrice", String(min));
    } else {
      const [minRaw, maxRaw] = range.split("-");
      const min = Number(minRaw);
      const max = Number(maxRaw);
      if (Number.isFinite(min)) params.append("minPrice", String(min));
      if (Number.isFinite(max)) params.append("maxPrice", String(max));
    }
  }
  return params;
}

export default function ListingManagementPage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  const fetchListings = useCallback(async () => {
    if (!session?.user) return;
    if (isFirstLoad.current) {
      setLoading(true);
    } else {
      setPageLoading(true);
    }
    try {
      const searchParams = buildFilterParams(activeFilters);
      if (searchQuery.trim()) searchParams.set("search", searchQuery.trim());
      searchParams.set("page", currentPage.toString());
      searchParams.set("limit", limit.toString());

      const response = await fetch(
        `/api/crm/properties?${searchParams.toString()}`,
        { credentials: "include" }
      );

      if (!response.ok) throw new Error("Failed to fetch listings");

      const data: ListingsResponse = await response.json();
      if (!data.success) throw new Error("Failed to fetch listings data");

      const mappedListings = data.properties.map((property) => ({
        ...property,
        status: mapApiStatusToTableStatus(property.status),
        images: parseImages(property.images, property.id),
      }));

      setListings(mappedListings);
      const pages = Math.max(1, data.pagination?.pages ?? 1);
      setTotalPages(pages);
      setTotalItems(data.pagination?.total ?? mappedListings.length);
      // If filters shrank the result set below the current page, jump back.
      if (currentPage > pages) setCurrentPage(pages);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch listings"
      );
    } finally {
      setLoading(false);
      setPageLoading(false);
      isFirstLoad.current = false;
    }
  }, [session, currentPage, limit, searchQuery, activeFilters]);

  useEffect(() => {
    if (session?.user) {
      fetchListings();
    } else if (!session) {
      setLoading(false);
    }
  }, [session, fetchListings]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const handleSearch = (query: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchQuery(query);
      setCurrentPage(1);
    }, 350);
  };

  const handleFilter = (filters: FilterOptions) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveFilters({});
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const handleLimitChange = (next: number) => {
    setLimit(next);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/properties/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete listing");
      }

      toast.success("Listing deleted successfully");
      // If this was the last row on the page, step back so the page isn't empty.
      if (listings.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchListings();
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete listing"
      );
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const listing = listings.find((l) => l.id === id);
      const response = await fetch(`/api/crm/properties/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          featured: !listing?.featured,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update listing");
      }

      toast.success("Listing updated successfully");
      fetchListings();
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update listing"
      );
    }
  };

  const handleExport = () => {
    if (listings.length === 0) {
      toast.error("Nothing to export on this page");
      return;
    }

    type CSVRow = {
      Title: string;
      Type: string;
      Location: string;
      Price: number;
      Bedrooms: number;
      Bathrooms: number;
      Status: string;
      Featured: string;
      CreatedAt: string;
    };

    const csvContent: CSVRow[] = listings.map((listing) => ({
      Title: listing.title,
      Type: listing.type,
      Location: listing.location,
      Price: listing.price,
      Bedrooms: listing.bedrooms,
      Bathrooms: listing.bathrooms,
      Status: listing.status,
      Featured: listing.featured ? "Yes" : "No",
      CreatedAt: new Date(listing.createdAt).toLocaleDateString(),
    }));

    const headers = Object.keys(csvContent[0]) as (keyof CSVRow)[];
    const escapeCell = (value: string | number) => {
      const text = String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const csv = [
      headers.join(","),
      ...csvContent.map((row) =>
        headers.map((header) => escapeCell(row[header])).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `listings-page-${currentPage}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#468AD1]"></div>
        </div>
      </div>
    );
  }

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const rangeEnd = Math.min(currentPage * limit, totalItems);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Listing Management
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track all your property listings
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1]"
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Export Listings
          </button>
          <Link
            href="/crm/create-listing"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#468AD1] hover:bg-[#2F6FAE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1]"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Add New Listing
          </Link>
        </div>
      </div>

      {/* Filters */}
      <ListingFilters onSearch={handleSearch} onFilter={handleFilter} />

      {/* Result count + page size */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-gray-600" aria-live="polite">
          {totalItems === 0
            ? "No listings found"
            : `Showing ${rangeStart}–${rangeEnd} of ${totalItems} listing${totalItems === 1 ? "" : "s"}`}
          {pageLoading ? " — updating…" : ""}
        </p>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Per page
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-sm focus:ring-[#468AD1] focus:border-[#468AD1]"
            aria-label="Listings per page"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Listing Table */}
      <div className={pageLoading ? "opacity-60 pointer-events-none" : ""}>
        {listings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-gray-900">No listings on this page</p>
            <p className="mt-1 text-sm text-gray-600">
              Try a different search, clear your filters, or add a new listing.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear search & filters
              </button>
              <Link
                href="/crm/create-listing"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-[#468AD1] hover:bg-[#2F6FAE]"
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Add New Listing
              </Link>
            </div>
          </div>
        ) : (
          <ListingTable
            listings={listings}
            onDelete={handleDelete}
            onToggleFeatured={handleToggleFeatured}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
