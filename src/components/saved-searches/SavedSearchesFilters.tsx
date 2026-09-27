"use client";

import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { SEARCH_PROPERTY_CATEGORIES, propertyCategoryDisplayNames } from "@/lib/propertyCategories";

interface SavedSearchesFiltersProps {
  onSearch: (query: string) => void;
  onFilter: (filters: {
    propertyType: string;
    location: string;
    priceRange: string;
    notificationStatus: string;
  }) => void;
}

export default function SavedSearchesFilters({
  onSearch,
  onFilter,
}: SavedSearchesFiltersProps) {
  const [filters, setFilters] = useState({
    propertyType: "",
    location: "",
    priceRange: "",
    notificationStatus: "",
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    onFilter({ ...filters, [name]: value });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search saved searches..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Filters */}
        <div className="md:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <select
              name="propertyType"
              value={filters.propertyType}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            >
              <option value="">Property Type</option>
              {SEARCH_PROPERTY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {propertyCategoryDisplayNames[cat]}
                </option>
              ))}
            </select>

            <select
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            >
              <option value="">Location</option>
              <option value="kilimani">Kilimani</option>
              <option value="karen">Karen</option>
              <option value="westlands">Westlands</option>
              <option value="lavington">Lavington</option>
              <option value="kileleshwa">Kileleshwa</option>
            </select>

            <select
              name="priceRange"
              value={filters.priceRange}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            >
              <option value="">Price Range</option>
              <option value="0-1000000">0 - 1M</option>
              <option value="1000000-5000000">1M - 5M</option>
              <option value="5000000-10000000">5M - 10M</option>
              <option value="10000000+">10M+</option>
            </select>

            <select
              name="notificationStatus"
              value={filters.notificationStatus}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            >
              <option value="">Notification Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
