"use client";

import { useState, useEffect } from "react";
import {
  FiUsers,
  FiHome,
  FiBarChart2,
  FiTrendingUp,
  FiSearch,
  FiMapPin,
  FiTag,
} from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface Stats {
  users: {
    total: number;
    new: number;
    byRole: {
      role: string;
      count: number;
    }[];
  };
  properties: {
    total: number;
    available: number;
    byCategory: {
      category: string;
      count: number;
    }[];
    byStatus: {
      status: string;
      count: number;
    }[];
  };
  interactions: {
    views: number;
    favorites: number;
    inquiries: number;
  };
  searches: {
    total: number;
    byLocation: {
      location: string;
      count: number;
    }[];
    byCategory: {
      category: string;
      count: number;
    }[];
    recent: {
      id: string;
      name: string;
      url: string;
      userName: string | null;
      userEmail: string | null;
      location: string;
      category: string;
      createdAt: string;
    }[];
  };
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("7d"); // 7d, 30d, 90d, all

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/stats?range=${timeRange}`);
        if (!res.ok) throw new Error("Failed to fetch statistics");

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Error loading statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <h3 className="text-2xl font-semibold text-gray-900">
                {stats.users.total}
              </h3>
            </div>
            <FiUsers className="w-8 h-8 text-blue-500" />
          </div>
          <p className="mt-2 text-sm text-green-600">
            +{stats.users.new} new users
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Properties</p>
              <h3 className="text-2xl font-semibold text-gray-900">
                {stats.properties.total}
              </h3>
            </div>
            <FiHome className="w-8 h-8 text-indigo-500" />
          </div>
          <p className="mt-2 text-sm text-blue-600">
            {stats.properties.available} available
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Views</p>
              <h3 className="text-2xl font-semibold text-gray-900">
                {stats.interactions.views}
              </h3>
            </div>
            <FiBarChart2 className="w-8 h-8 text-green-500" />
          </div>
          <p className="mt-2 text-sm text-gray-600">Property page views</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Saved Searches</p>
              <h3 className="text-2xl font-semibold text-gray-900">
                {stats.searches.total}
              </h3>
            </div>
            <FiSearch className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            User search intent
          </p>
        </div>
      </div>

      {/* Search Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Most Searched Locations</h2>
            <FiMapPin className="text-blue-500" />
          </div>
          <div className="space-y-4">
            {stats.searches.byLocation.length > 0 ? (
              stats.searches.byLocation.map((item) => (
                <div key={item.location} className="flex items-center justify-between">
                  <span className="text-gray-600">{item.location}</span>
                  <span className="text-gray-900 font-medium">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No saved searches yet</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Most Searched Categories</h2>
            <FiTag className="text-indigo-500" />
          </div>
          <div className="space-y-4">
            {stats.searches.byCategory.length > 0 ? (
              stats.searches.byCategory.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="text-gray-900 font-medium">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No saved searches yet</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent User Searches</h2>
            <FiSearch className="text-yellow-500" />
          </div>
          <div className="space-y-4">
            {stats.searches.recent.length > 0 ? (
              stats.searches.recent.map((search) => (
                <div key={search.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <a
                    href={search.url}
                    className="block font-medium text-gray-900 hover:text-[#468AD1]"
                  >
                    {search.name}
                  </a>
                  <p className="text-sm text-gray-500">
                    {search.userName || search.userEmail || "Unknown user"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {search.location} - {search.category}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No saved searches yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Users by Role</h2>
          <div className="space-y-4">
            {stats.users.byRole.map((role) => (
              <div
                key={role.role}
                className="flex items-center justify-between"
              >
                <span className="text-gray-600">{role.role}</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(role.count / stats.users.total) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="ml-4 text-gray-900 font-medium">
                    {role.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Properties by Category */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Properties by Category</h2>
          <div className="space-y-4">
            {stats.properties.byCategory.map((category) => (
              <div
                key={category.category}
                className="flex items-center justify-between"
              >
                <span className="text-gray-600">{category.category}</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{
                        width: `${
                          (category.count / stats.properties.total) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="ml-4 text-gray-900 font-medium">
                    {category.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Property Status</h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.properties.byStatus.map((status) => (
              <div
                key={status.status}
                className="p-4 rounded-lg bg-gray-50 flex flex-col"
              >
                <span className="text-sm text-gray-500">{status.status}</span>
                <span className="text-2xl font-semibold text-gray-900">
                  {status.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Interaction Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Interaction Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">Page Views</span>
                <FiBarChart2 className="text-blue-500" />
              </div>
              <span className="text-2xl font-semibold text-gray-900">
                {stats.interactions.views}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">Favorites</span>
                <FiTrendingUp className="text-green-500" />
              </div>
              <span className="text-2xl font-semibold text-gray-900">
                {stats.interactions.favorites}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">Total Inquiries</span>
                <FiTrendingUp className="text-yellow-500" />
              </div>
              <span className="text-2xl font-semibold text-gray-900">
                {stats.interactions.inquiries}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
