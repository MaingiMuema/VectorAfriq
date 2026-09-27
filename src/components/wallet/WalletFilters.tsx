/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';

interface WalletFiltersProps {
  onSearch: (query: string) => void;
  onFilter: (filters: {
    type: string;
    status: string;
    dateRange: string;
    amountRange: string;
  }) => void;
}

export default function WalletFilters({ onSearch, onFilter }: WalletFiltersProps) {
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateRange: '',
    amountRange: '',
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
              placeholder="Search transactions..."
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
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            >
              <option value="">Transaction Type</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            >
              <option value="">Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <select
              name="dateRange"
              value={filters.dateRange}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            >
              <option value="">Date Range</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            <select
              name="amountRange"
              value={filters.amountRange}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
            >
              <option value="">Amount Range</option>
              <option value="0-1000">0 - 1,000</option>
              <option value="1000-10000">1,000 - 10,000</option>
              <option value="10000-100000">10,000 - 100,000</option>
              <option value="100000+">100,000+</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
