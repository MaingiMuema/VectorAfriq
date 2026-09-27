"use client";

import { useState, useEffect, useCallback } from "react";
import { FiSearch, FiTrash2, FiEdit } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";
import {
  ALL_PROPERTY_CATEGORIES,
  propertyCategoryDisplayNames,
  PropertyCategory,
} from "@/lib/propertyCategories";

type Status = "AVAILABLE" | "PENDING" | "SOLD" | "RENTED";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toast } from "react-hot-toast";

// Helper function to safely parse JSON images - matches CRM pattern
const parseImages = (imagesJson: string | null, propertyId: string): string => {
  if (!imagesJson) return "/images/placeholder.png";

  try {
    // Handle cases where images might already be parsed
    const images =
      typeof imagesJson === "string" ? JSON.parse(imagesJson) : imagesJson;

    // Validate the parsed result
    if (!Array.isArray(images)) {
      console.error(
        `Invalid images format for property ${propertyId}:`,
        images
      );
      return "/images/placeholder.png";
    }

    // Find first valid image path
    const validImage = images.find((img) => typeof img === "string");
    if (!validImage) return "/images/placeholder.png";

    // Handle existing service URLs
    if (validImage.startsWith("/api/images/")) {
      return validImage;
    }

    // Extract filename from any path format
    let filename = validImage;
    if (validImage.includes('/')) {
      const pathParts = validImage.split('/');
      filename = pathParts[pathParts.length - 1];
    }

    // Route through image service
    return `/api/images/serve/${propertyId}/${filename}`;
  } catch (error) {
    console.error(`Failed to parse images for property ${propertyId}:`, {
      error,
      rawData: imagesJson,
    });
    return "/images/placeholder.png";
  }
};

interface Property {
  id: string;
  title: string;
  price: number;
  category: PropertyCategory;
  type: string;
  location: string;
  status: Status;
  images: string; // JSON string of image URLs
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(categoryFilter !== "ALL" && { category: categoryFilter }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/properties?${params}`);
      if (!res.ok) throw new Error("Failed to fetch properties");

      const data = await res.json();
      setProperties(data.properties);
      setTotalPages(data.pages);
    } catch (err) {
      setError("Error loading properties");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const updatePropertyStatus = async (
    propertyId: string,
    newStatus: Status
  ) => {
    try {
      const res = await fetch("/api/admin/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propertyId, status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update property status");

      const updatedProperty = await res.json();
      setProperties(
        properties.map((property) =>
          property.id === propertyId ? updatedProperty : property
        )
      );
      toast.success("Property status updated successfully");
    } catch (err) {
      toast.error("Error updating property status");
      console.error(err);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      const res = await fetch(`/api/admin/properties?id=${propertyId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete property");

      setProperties(
        properties.filter((property) => property.id !== propertyId)
      );
      toast.success("Property deleted successfully");
    } catch (err) {
      toast.error("Error deleting property");
      console.error(err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative">
          <input
            type="search"
            placeholder="Search properties..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>

        <div className="flex gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {ALL_PROPERTY_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {propertyCategoryDisplayNames[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SOLD">Sold</SelectItem>
              <SelectItem value="RENTED">Rented</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Property
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Owner
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Listed
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Edit
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    No properties found
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                          <Image
                            src={parseImages(property.images, property.id)}
                            alt={property.title}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9h6v6H9z"></path></svg>';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {property.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {property.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(property.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {propertyCategoryDisplayNames[property.category as PropertyCategory] || property.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={property.status}
                        onValueChange={(value: Status) =>
                          updatePropertyStatus(property.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">Available</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="SOLD">Sold</SelectItem>
                          <SelectItem value="RENTED">Rented</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {property.user.name || "No name"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {property.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(property.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/properties/${property.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FiEdit className="h-5 w-5" />
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => deleteProperty(property.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
