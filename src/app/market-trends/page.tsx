"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FiTrendingUp, FiMap, FiDollarSign, FiPieChart } from "react-icons/fi";

// Mock data - Replace with real API data in production
const priceData = [
  { month: "Jan", price: 12500000 },
  { month: "Feb", price: 12750000 },
  { month: "Mar", price: 13000000 },
  { month: "Apr", price: 12900000 },
  { month: "May", price: 13200000 },
  { month: "Jun", price: 13500000 },
];

const locationData = [
  { area: "Kitengela", value: 85 },
  { area: "Syokimau", value: 75 },
  { area: "Athi River", value: 65 },
  { area: "Mlolongo", value: 55 },
  { area: "Embakasi", value: 45 },
];

export default function MarketTrends() {
  const [timeframe, setTimeframe] = useState("6M");
  const [propertyType, setPropertyType] = useState("all");

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FiTrendingUp className="text-[#468AD1]" />
              Real Estate Market Trends
            </h1>
            <p className="mt-2 text-gray-600">
              Comprehensive analysis of Kenya&apos;s property market trends and
              insights
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#468AD1]"
            >
              <option value="1M">Last Month</option>
              <option value="3M">Last 3 Months</option>
              <option value="6M">Last 6 Months</option>
              <option value="1Y">Last Year</option>
            </select>

            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#468AD1]"
            >
              <option value="all">All Properties</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
            </select>
          </div>

          {/* Market Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <FiDollarSign className="text-[#468AD1] text-xl" />
                <h3 className="font-semibold text-gray-700">Average Price</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">KES 13.5M</p>
              <p className="text-sm text-green-600 mt-2">
                ↑ 5.2% from last month
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <FiMap className="text-[#468AD1] text-xl" />
                <h3 className="font-semibold text-gray-700">
                  Listed Properties
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
              <p className="text-sm text-green-600 mt-2">
                ↑ 12% from last month
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <FiPieChart className="text-[#468AD1] text-xl" />
                <h3 className="font-semibold text-gray-700">Market Demand</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">High</p>
              <p className="text-sm text-green-600 mt-2">Growing steadily</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <FiTrendingUp className="text-[#468AD1] text-xl" />
                <h3 className="font-semibold text-gray-700">Price Trend</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">Upward</p>
              <p className="text-sm text-green-600 mt-2">Steady growth</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Price Trends Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Price Trends
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#468AD1"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popular Locations Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Popular Locations
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="area" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#468AD1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Market Insights */}
          <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Market Insights
            </h3>
            <div className="space-y-4">
              <p className="text-gray-600">
                The real estate market in Kenya continues to show strong growth,
                with particularly high demand in emerging neighborhoods.
                Property prices have shown a steady increase over the past 6
                months, indicating a robust market despite economic challenges.
              </p>
              <p className="text-gray-600">Key trends include:</p>
              <ul className="list-disc pl-6 text-gray-600">
                <li>Growing interest in gated communities</li>
                <li>Increased demand for sustainable housing</li>
                <li>Rise in property technology adoption</li>
                <li>Expansion of real estate investment trusts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
