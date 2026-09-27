"use client";

import { useState } from "react";
import { FiBell, FiEye, FiTrash2 } from "react-icons/fi";
import Link from "next/link";
import { getSavedSearchCriteriaText } from "@/lib/savedSearches";
import type { SavedSearch } from "@/lib/savedSearches";

interface SavedSearchesTableProps {
  searches: SavedSearch[];
  onDelete: (id: string) => void;
  onToggleNotifications: (id: string) => void;
}

export default function SavedSearchesTable({
  searches,
  onDelete,
  onToggleNotifications,
}: SavedSearchesTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SavedSearch;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: keyof SavedSearch) => {
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

  const sortedSearches = [...searches].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    const aValue = String(a[key] ?? "");
    const bValue = String(b[key] ?? "");

    if (key === "matchCount") {
      return direction === "asc"
        ? a.matchCount - b.matchCount
        : b.matchCount - a.matchCount;
    }

    return direction === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Search Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Search Criteria
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("matchCount")}
              >
                Matches
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("lastUpdated")}
              >
                Last Updated
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Notifications
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSearches.map((search) => (
              <tr key={search.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {search.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {getSavedSearchCriteriaText(search.criteria)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {search.matchCount} properties
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(search.lastUpdated).toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleNotifications(search.id)}
                    className={`p-1 rounded-full ${
                      search.notificationsEnabled
                        ? "text-[#468AD1] bg-red-50"
                        : "text-gray-400 bg-gray-50"
                    }`}
                    aria-label={
                      search.notificationsEnabled
                        ? "Disable notifications"
                        : "Enable notifications"
                    }
                  >
                    <FiBell className="w-4 h-4" />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      href={search.url}
                      className="text-gray-400 hover:text-gray-500"
                      aria-label={`View ${search.name}`}
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onDelete(search.id)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label={`Remove ${search.name}`}
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
