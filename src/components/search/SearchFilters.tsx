/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FaFilter, FaChevronDown, FaMapMarkerAlt, FaBed } from "react-icons/fa";
import {
  getBedroomOptions,
  propertyCategoryDisplayNames,
  SEARCH_PROPERTY_CATEGORIES,
} from "@/lib/propertyCategories";
import { buildInventorySlug, parseInventorySlug } from "@/lib/search/searchUrl";

interface FilterSection {
  title: string;
  options: {
    label: string;
    value: string;
  }[];
}

interface SearchFiltersProps {
  category: string;
  currentLocation?: string;
  currentBedrooms?: string;
}

const priceRanges = [
  { label: "Under KES 5M", value: "0-5000000" },
  { label: "KES 5M - 10M", value: "5000000-10000000" },
  { label: "KES 10M - 20M", value: "10000000-20000000" },
  { label: "KES 20M - 30M", value: "20000000-30000000" },
  { label: "Over KES 30M", value: "30000000-999999999" },
];

const propertyTypes = SEARCH_PROPERTY_CATEGORIES.map((category) => ({
  label: propertyCategoryDisplayNames[category],
  value: category,
}));

const amenities = [
  { label: "Swimming Pool", value: "pool" },
  { label: "Gym", value: "gym" },
  { label: "Security", value: "security" },
  { label: "Parking", value: "parking" },
  { label: "Furnished", value: "furnished" },
];

export default function SearchFilters() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const routeInventory =
    (params?.type as string) || (params?.category as string) || "";
  const parsedInventory = routeInventory
    ? parseInventorySlug(routeInventory)
    : null;
  const inventorySlug = buildInventorySlug({
    listingType:
      parsedInventory?.listingType ||
      (routeInventory === "rent" || routeInventory === "airbnb"
        ? routeInventory
        : "sale"),
    category: parsedInventory?.category,
  });
  const [location, setLocation] = useState(searchParams?.get("location") || "");
  const [bedrooms, setBedrooms] = useState(searchParams?.get("bedrooms") || "");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["price", "type", "amenities"])
  );
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleFilterChange = (section: string, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[section] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      return {
        ...prev,
        [section]: updated,
      };
    });
  };

  const isFilterSelected = (section: string, value: string) => {
    return (selectedFilters[section] || []).includes(value);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (bedrooms) params.set("bedrooms", bedrooms);
    Object.keys(selectedFilters).forEach((key) => {
      selectedFilters[key].forEach((value) => {
        params.append(key, value);
      });
    });
    const queryString = params.toString();
    router.push(queryString ? `/${inventorySlug}?${queryString}` : `/${inventorySlug}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b">
        <FaFilter className="text-[#468AD1]" />
        <h2 className="text-lg font-semibold text-[#514f63]">Filters</h2>
      </div>

      {/* Location Filter */}
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Location</label>
        <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location"
            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Bedrooms Filter */}
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Bedrooms</label>
        <div className="relative">
          <FaBed className="absolute left-3 top-3 text-gray-400" />
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {getBedroomOptions().map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full py-2 text-left font-medium text-[#514f63]"
        >
          <span>Price Range</span>
          <FaChevronDown
            className={`transform transition-transform ${
              expandedSections.has("price") ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSections.has("price") && (
          <div className="mt-2 space-y-2">
            {priceRanges.map(({ label, value }) => (
              <label
                key={value}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isFilterSelected("price", value)}
                  onChange={() => handleFilterChange("price", value)}
                  className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                />
                <span className="text-sm text-gray-600">{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Property Type */}
      <div className="mb-4 border-t pt-4">
        <button
          onClick={() => toggleSection("type")}
          className="flex items-center justify-between w-full py-2 text-left font-medium text-[#514f63]"
        >
          <span>Property Type</span>
          <FaChevronDown
            className={`transform transition-transform ${
              expandedSections.has("type") ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSections.has("type") && (
          <div className="mt-2 space-y-2">
            {propertyTypes.map(({ label, value }) => (
              <label
                key={value}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isFilterSelected("type", value)}
                  onChange={() => handleFilterChange("type", value)}
                  className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                />
                <span className="text-sm text-gray-600">{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="mb-4 border-t pt-4">
        <button
          onClick={() => toggleSection("amenities")}
          className="flex items-center justify-between w-full py-2 text-left font-medium text-[#514f63]"
        >
          <span>Amenities</span>
          <FaChevronDown
            className={`transform transition-transform ${
              expandedSections.has("amenities") ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSections.has("amenities") && (
          <div className="mt-2 space-y-2">
            {amenities.map(({ label, value }) => (
              <label
                key={value}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isFilterSelected("amenities", value)}
                  onChange={() => handleFilterChange("amenities", value)}
                  className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                />
                <span className="text-sm text-gray-600">{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Apply Filters Button */}
      <button
        onClick={handleSearch}
        className="w-full py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#514f63] transition-colors mt-4"
      >
        Apply Filters
      </button>
    </div>
  );
}
