"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FiPlus, FiDownload } from "react-icons/fi";
import { toast } from "react-hot-toast";
import ListingTable from "@/components/listings/ListingTable";
import ListingFilters from "@/components/listings/ListingFilters";

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

// Helper function to safely parse JSON images - matches FeaturedListings approach
const parseImages = (imagesJson: string | null, propertyId: string): string[] => {
  if (!imagesJson) return ["/images/placeholder.png"];

  try {
    console.log("Parsing property images:", {
      propertyId: propertyId,
      raw: imagesJson,
      type: typeof imagesJson,
    });

    const images =
      typeof imagesJson === "string" ? JSON.parse(imagesJson) : imagesJson;

    console.log("Parsed images result:", {
      propertyId: propertyId,
      parsedImages: images,
      isArray: Array.isArray(images),
    });

    if (!Array.isArray(images)) {
      console.error(
        `Invalid images format for property ${propertyId}:`,
        images
      );
      return ["/images/placeholder.png"];
    }

    const processedImages = images.map(img => {
      if (typeof img !== "string") return "/images/placeholder.png";
      
      // Handle existing service URLs
      if (img.startsWith("/api/images/")) {
        return img;
      }
      
      // Extract filename from any path format
      let filename = img;
      if (img.includes('/')) {
        const pathParts = img.split('/');
        filename = pathParts[pathParts.length - 1];
      }
      
      // Route through image service
      return `/api/images/serve/${propertyId}/${filename}`;
    });

    return processedImages.length > 0 ? processedImages : ["/images/placeholder.png"];
  } catch (error) {
    console.error(`Failed to parse images for property ${propertyId}:`, {
      error,
      rawData: imagesJson,
    });
    return ["/images/placeholder.png"];
  }
};

export default function ListingManagementPage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const fetchListings = useCallback(
    async (searchParams = new URLSearchParams()) => {
      try {
        searchParams.set("page", currentPage.toString());
        searchParams.set("limit", limit.toString());

        const response = await fetch(
          `/api/crm/properties?${searchParams.toString()}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch listings");
        }

        const data: ListingsResponse = await response.json();

        if (!data.success) {
          throw new Error("Failed to fetch listings data");
        }

        const mappedListings = data.properties.map((property) => ({
          ...property,
          status: mapApiStatusToTableStatus(property.status),
          images: parseImages(property.images, property.id),
        }));

        setListings(mappedListings);
      } catch (error) {
        console.error("Error fetching listings:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch listings"
        );
      } finally {
        setLoading(false);
      }
    },
    [currentPage, limit]
  );

  useEffect(() => {
    if (session?.user) {
      fetchListings();
    }
  }, [session, fetchListings]);

  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    if (query) {
      params.append("search", query);
    }
    setCurrentPage(1);
    fetchListings(params);
  };

  const handleFilter = (filters: FilterOptions) => {
    const params = new URLSearchParams();
    if (filters.status) {
      params.append("status", filters.status.toUpperCase());
    }
    if (filters.type) {
      params.append("type", filters.type);
    }
    if (filters.featured) {
      params.append(
        "featured",
        filters.featured === "featured" ? "true" : "false"
      );
    }
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      if (min) params.append("minPrice", min.toString());
      if (max) params.append("maxPrice", max.toString());
    }
    setCurrentPage(1);
    fetchListings(params);
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
      fetchListings(); // Refresh the list
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
      fetchListings(); // Refresh the list
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update listing"
      );
    }
  };

  const handleExport = () => {
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
    const csv = [
      headers.join(","),
      ...csvContent.map((row) =>
        headers.map((header) => row[header].toString()).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "listings.csv");
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

      {/* Listing Table */}
      <ListingTable
        listings={listings}
        onDelete={handleDelete}
        onToggleFeatured={handleToggleFeatured}
      />
    </div>
  );
}
