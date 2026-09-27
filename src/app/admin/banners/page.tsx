"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FiSearch, FiTrash2, FiEdit3, FiPlus } from "react-icons/fi";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Banner } from "@/types/banner";

function getBannerImageUrl(imageUrl: string): string {
  if (!imageUrl) return '/images/placeholder.png';
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/api/images/serve/')) return imageUrl;
  return imageUrl;
}

// Function to fetch all location data for name resolution
async function fetchLocationData(): Promise<LocationData[]> {
  try {
    const [countiesRes, citiesRes, neighborhoodsRes] = await Promise.all([
      fetch('/api/locations/counties'),
      fetch('/api/locations/cities'),
      fetch('/api/locations/neighborhoods')
    ]);

    const counties = countiesRes.ok ? await countiesRes.json() : [];
    const cities = citiesRes.ok ? await citiesRes.json() : [];
    const neighborhoods = neighborhoodsRes.ok ? await neighborhoodsRes.json() : [];

    const locationData: LocationData[] = [];

    // Add counties
    counties.forEach((county: any) => {
      locationData.push({ id: county.id, name: county.name, type: 'county' });
    });

    // Add cities
    cities.forEach((city: any) => {
      locationData.push({ id: city.id, name: city.name, type: 'city' });
    });

    // Add neighborhoods
    neighborhoods.forEach((neighborhood: any) => {
      locationData.push({ id: neighborhood.id, name: neighborhood.name, type: 'neighborhood' });
    });

    return locationData;
  } catch (error) {
    console.error('Error fetching location data:', error);
    return [];
  }
}

// Function to resolve location IDs to names
function resolveLocationNames(locationIds: string[], locationData: LocationData[]): string {
  if (locationIds.length === 0) return "All Locations";

  const names = locationIds.map(id => {
    const location = locationData.find(loc => loc.id === id);
    return location ? `${location.name} (${location.type})` : id; // Include type and fallback to ID if name not found
  });

  return names.join(", ");
}

// Location data interface
interface LocationData {
  id: string;
  name: string;
  type: 'county' | 'city' | 'neighborhood';
}

export default function BannersPage() {
  const { status } = useSession();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const fetchData = useCallback(async () => {
    // Don't fetch until authentication is ready
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      setError("");

      // Fetch banners and location data in parallel
      const url = `/api/admin/promotional-content?page=${page}&search=${encodeURIComponent(search)}${
        activeFilter !== "ALL" ? `&active=${activeFilter}` : ""
      }`;

      console.log('Fetching banners from:', url);

      const [bannersRes, locationData] = await Promise.all([
        fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }),
        fetchLocationData()
      ]);

      console.log('Response status:', bannersRes.status);
      console.log('Response ok:', bannersRes.ok);

      if (!bannersRes.ok) {
        const errorText = await bannersRes.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch data: ${bannersRes.status} ${errorText}`);
      }

      const bannersData = await bannersRes.json();
      console.log('Banners data:', bannersData);

      setBanners(bannersData.banners || []);
      setLocations(locationData);
      setTotalPages(bannersData.pages || 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error loading data: ${errorMessage}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter, status]);

  useEffect(() => {
    console.log('Session status:', status);
    if (status === 'loading') {
      console.log('Session is loading...');
      return;
    }
    if (status === 'unauthenticated') {
      console.log('User is not authenticated');
      setError('Please sign in to access this page');
      return;
    }
    fetchData();
  }, [fetchData, status]);

  const toggleBannerStatus = async (bannerId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/promotional-content", {
        method: "PATCH",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bannerId,
          active: !currentStatus,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update banner status: ${res.status} ${errorText}`);
      }

      const { banner: updatedBanner } = await res.json();
      setBanners(banners.map((banner) => (banner.id === bannerId ? updatedBanner : banner)));
      toast.success(
        `Banner ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Error updating banner status: ${errorMessage}`);
      console.error('Toggle banner error:', err);
    }
  };

  const deleteBanner = async (bannerId: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const res = await fetch(`/api/admin/promotional-content/${bannerId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete banner: ${res.status} ${errorText}`);
      }

      setBanners(banners.filter((banner) => banner.id !== bannerId));
      toast.success("Banner deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Error deleting banner: ${errorMessage}`);
      console.error('Delete banner error:', err);
    }
  };

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#468AD1] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Please sign in to access this page</p>
          <Link
            href="/auth/signin"
            className="bg-[#468AD1] text-white px-4 py-2 rounded-lg hover:bg-[#2F6FAE]"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
        <Link
          href="/admin/banners/new"
          className="bg-[#468AD1] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2F6FAE]"
        >
          <FiPlus className="w-5 h-5" />
          New Banner
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search banners..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>

        <div className="flex gap-4">
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20"
                >
                  Image
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Locations
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Link
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
                  Created
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
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    No banners found
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id}>
                    <td className="px-6 py-4">
                      <div className="relative w-32 h-16">
                        <Image
                          src={getBannerImageUrl(banner.imageUrl)}
                          alt="Banner image"
                          fill
                          className="object-cover rounded"
                          sizes="128px"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          const locationIds = typeof banner.locations === 'string'
                            ? JSON.parse(banner.locations)
                            : banner.locations || [];
                          return resolveLocationNames(locationIds, locations);
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {banner.linkUrl ? (
                        <a
                          href={banner.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block max-w-xs truncate text-sm text-indigo-600 hover:text-indigo-900"
                          title={banner.linkUrl}
                        >
                          {banner.linkUrl}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">Not linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleBannerStatus(banner.id, banner.active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          banner.active
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {banner.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(banner.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/banners/${banner.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <FiEdit3 className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => deleteBanner(banner.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
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
