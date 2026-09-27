"use client";

import { useState } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCheck,
  FiX,
} from "react-icons/fi";
import Link from "next/link";
import { PropertyImage } from "../properties/PropertyImage";

interface Listing {
  id: string;
  title: string;
  type: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  status: "active" | "pending" | "expired";
  featured: boolean;
  images: string[];
  createdAt: string;
}

interface ListingTableProps {
  listings: Listing[];
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string) => void;
}

export default function ListingTable({
  listings,
  onDelete,
  onToggleFeatured,
}: ListingTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Listing;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: keyof Listing) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };

  // Function to generate a URL-friendly slug from a title
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  const sortedListings = [...listings].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
    if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === listings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(listings.map((listing) => listing.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  const getStatusColor = (status: Listing["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 text-[#468AD1] focus:ring-[#468AD1] border-gray-300 rounded"
                  checked={selectedIds.length === listings.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Property
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("price")}
              >
                Price
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Details
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
                Featured
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedListings.map((listing) => (
              <tr key={listing.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-[#468AD1] focus:ring-[#468AD1] border-gray-300 rounded"
                    checked={selectedIds.includes(listing.id)}
                    onChange={() => handleSelect(listing.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-16 w-16 relative flex-shrink-0">
                      <div className="relative h-full w-full bg-gray-100 rounded-lg overflow-hidden">
                        <PropertyImage
                          property={listing}
                          className="rounded-lg object-cover"
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const imgElement = e.target as HTMLImageElement;
                            console.error("Table image load error:", {
                              currentSrc: imgElement.currentSrc,
                              url: listing.images[0],
                              propertyId: listing.id,
                              propertyTitle: listing.title,
                              property: listing,
                              allImages: listing.images
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {listing.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {listing.location}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    KES {listing.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">{listing.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {listing.bedrooms} Beds
                  </div>
                  <div className="text-sm text-gray-500">
                    {listing.bathrooms} Baths
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      listing.status
                    )}`}
                  >
                    {listing.status.charAt(0).toUpperCase() +
                      listing.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => onToggleFeatured(listing.id)}
                    className={`p-1 rounded-full ${
                      listing.featured
                        ? "text-[#468AD1] bg-red-50"
                        : "text-gray-400 bg-gray-50"
                    }`}
                  >
                    {listing.featured ? (
                      <FiCheck className="w-4 h-4" />
                    ) : (
                      <FiX className="w-4 h-4" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      href={`/listings/${generateSlug(listing.title)}/${
                        listing.id
                      }`}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/crm/listing-management/edit/${listing.id}`}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onDelete(listing.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
