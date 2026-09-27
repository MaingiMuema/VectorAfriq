"use client";

import { useState } from "react";
import { FiSearch } from "react-icons/fi";

interface FavoritesFiltersProps {
  onSearch: (query: string) => void;
  onFilter: (filters: {
    propertyType: string;
    location: string;
    priceRange: string;
    status: string;
  }) => void;
  onSort: (sortBy: string) => void;
}

export default function FavoritesFilters({
  onSearch,
  onFilter,
  onSort,
}: FavoritesFiltersProps) {
  const [filters, setFilters] = useState({
    propertyType: "",
    location: "",
    priceRange: "",
    status: "",
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
      <div className="grid grid-cols-1 gap-4">
        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative">
              <input
                type="text"
                placeholder="Search favorites..."
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="md:w-48">
            <select
              onChange={(e) => onSort(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            >
              <option value="">Sort By</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="date-asc">Date Added: Oldest</option>
              <option value="date-desc">Date Added: Newest</option>
            </select>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select
            name="propertyType"
            value={filters.propertyType}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
          >
            <option value="">Property Type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
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
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
          >
            <option value="">Status</option>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </div>
    </div>
  );
}
