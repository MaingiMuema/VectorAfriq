"use client";

import { useEffect, useState } from "react";
import { FiUsers, FiPhoneCall, FiMail, FiDollarSign } from "react-icons/fi";
import StatsCard from "@/components/dashboard/StatsCard";
import LeadChart from "@/components/dashboard/LeadChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { DashboardStats } from "@/types/crm";
import { formatCurrency } from "@/utils/format";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/crm/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-pulse text-gray-500">
          Loading dashboard data...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">
            {error || "Failed to load dashboard data"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Leads"
          value={data.totalLeads.toString()}
          icon={<FiUsers className="w-6 h-6 text-[#468AD1]" />}
          trend={{
            value: Math.round(data.trends.leads),
            isUpward: data.trends.leads > 0,
          }}
          description="vs last month"
        />
        <StatsCard
          title="Phone Leads"
          value={data.phoneLeads.toString()}
          icon={<FiPhoneCall className="w-6 h-6 text-[#468AD1]" />}
          trend={{
            value: Math.round(data.trends.phone),
            isUpward: data.trends.phone > 0,
          }}
          description="vs last month"
        />
        <StatsCard
          title="Email Leads"
          value={data.emailLeads.toString()}
          icon={<FiMail className="w-6 h-6 text-[#468AD1]" />}
          trend={{
            value: Math.round(data.trends.email),
            isUpward: data.trends.email > 0,
          }}
          description="vs last month"
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={<FiDollarSign className="w-6 h-6 text-[#468AD1]" />}
          trend={{
            value: Math.round(data.trends.revenue),
            isUpward: data.trends.revenue > 0,
          }}
          description="vs last month"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-4">Lead Trends</h3>
          <LeadChart data={data.monthlyTrends.leads} />
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <RecentActivity activities={data.recentActivities} />
        </div>
      </div>
    </div>
  );
}
