"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiBell, FiBookmark, FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";
import SavedSearchesTable from "@/components/saved-searches/SavedSearchesTable";
import SavedSearchesFilters from "@/components/saved-searches/SavedSearchesFilters";
import Link from "next/link";
import {
  readSavedSearches,
  removeSavedSearch,
  SavedSearchAuthError,
  subscribeToSavedSearchUpdates,
  toggleSavedSearchNotifications,
} from "@/lib/savedSearches";
import type { SavedSearch } from "@/lib/savedSearches";

interface SavedSearchFilters {
  propertyType: string;
  location: string;
  priceRange: string;
  notificationStatus: string;
}

function matchesPriceRange(search: SavedSearch, priceRange: string): boolean {
  if (!priceRange) {
    return true;
  }

  const minPrice = Number(search.criteria.minPrice) || 0;
  const maxPrice = Number(search.criteria.maxPrice) || Number.POSITIVE_INFINITY;

  if (priceRange.endsWith("+")) {
    return maxPrice >= (Number(priceRange.replace("+", "")) || 0);
  }

  const [minValue, maxValue] = priceRange.split("-");
  const rangeMin = Number(minValue) || 0;
  const rangeMax = maxValue ? Number(maxValue) : Number.POSITIVE_INFINITY;

  return minPrice <= rangeMax && maxPrice >= rangeMin;
}

export default function SavedSearchesPage() {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SavedSearchFilters>({
    propertyType: "",
    location: "",
    priceRange: "",
    notificationStatus: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadSearches = async () => {
      try {
        const nextSearches = await readSavedSearches();
        if (isMounted) {
          setSearches(nextSearches);
          setLoading(false);
        }
      } catch (error) {
        if (error instanceof SavedSearchAuthError) {
          router.push("/auth/signin?callbackUrl=/crm/saved-searches");
          return;
        }

        console.error("Unable to fetch saved searches:", error);
        toast.error("Unable to load saved searches");
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSearches();
    const unsubscribe = subscribeToSavedSearchUpdates(loadSearches);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  const filteredSearches = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return searches.filter((search) => {
      const criteriaText = [
        search.criteria.type,
        search.criteria.category,
        search.criteria.location,
        search.criteria.bedrooms,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !normalizedQuery ||
        search.name.toLowerCase().includes(normalizedQuery) ||
        criteriaText.includes(normalizedQuery);
      const matchesType =
        !filters.propertyType ||
        search.criteria.category?.toLowerCase().includes(filters.propertyType.toLowerCase());
      const matchesLocation =
        !filters.location ||
        search.criteria.location?.toLowerCase().includes(filters.location);
      const matchesNotifications =
        !filters.notificationStatus ||
        (filters.notificationStatus === "enabled"
          ? search.notificationsEnabled
          : !search.notificationsEnabled);

      return (
        matchesSearch &&
        matchesType &&
        matchesLocation &&
        matchesPriceRange(search, filters.priceRange) &&
        matchesNotifications
      );
    });
  }, [filters, searchQuery, searches]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this saved search?")) {
      try {
        await removeSavedSearch(id);
        setSearches((current) => current.filter((search) => search.id !== id));
        toast.success("Saved search removed");
      } catch (error) {
        console.error("Unable to remove saved search:", error);
        toast.error("Unable to remove saved search");
      }
    }
  };

  const handleToggleNotifications = async (id: string) => {
    try {
      const updatedSearch = await toggleSavedSearchNotifications(id);
      setSearches((current) =>
        current.map((search) => (search.id === id ? updatedSearch : search))
      );
    } catch (error) {
      console.error("Unable to update notifications:", error);
      toast.error("Unable to update notifications");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Searches</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your saved property searches and notifications
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/search"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#468AD1] hover:bg-[#2F6FAE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1]"
          >
            <FiSearch className="mr-2 h-4 w-4" />
            New Search
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiBookmark className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Saved Searches
              </p>
              <h3 className="text-xl font-semibold text-gray-900">
                {filteredSearches.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FiBell className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Active Notifications
              </p>
              <h3 className="text-xl font-semibold text-gray-900">
                {
                  filteredSearches.filter((search) => search.notificationsEnabled)
                    .length
                }
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <SavedSearchesFilters onSearch={setSearchQuery} onFilter={setFilters} />

      {/* Saved Searches Table */}
      {loading ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-600">
          Loading saved searches...
        </div>
      ) : filteredSearches.length > 0 ? (
        <SavedSearchesTable
          searches={filteredSearches}
          onDelete={handleDelete}
          onToggleNotifications={handleToggleNotifications}
        />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <FiBookmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">
            No saved searches yet
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Save a search from any search results page to see it here.
          </p>
        </div>
      )}
    </div>
  );
}
