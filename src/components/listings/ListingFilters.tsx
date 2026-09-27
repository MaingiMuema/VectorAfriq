/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { SEARCH_PROPERTY_CATEGORIES, propertyCategoryDisplayNames } from '@/lib/propertyCategories';

interface ListingFiltersProps {
  onSearch: (query: string) => void;
  onFilter: (filters: {
    status: string;
    type: string;
    priceRange: string;
    featured: string;
  }) => void;
}

export default function ListingFilters({ onSearch, onFilter }: ListingFiltersProps) {
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priceRange: '',
    featured: '',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
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
              placeholder="Search listings..."
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
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            >
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>

            <select
              name="type"
              value={filters.type}
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
              name="featured"
              value={filters.featured}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            >
              <option value="">Featured Status</option>
              <option value="featured">Featured</option>
              <option value="not-featured">Not Featured</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}