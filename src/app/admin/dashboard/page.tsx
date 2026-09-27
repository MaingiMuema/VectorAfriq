'use client';

import { useState, useEffect } from 'react';
import { FiUsers, FiHome, FiMessageSquare, FiTrendingUp, FiLoader } from 'react-icons/fi';

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  userGrowthPercentage: number;
  activeListings: number;
  newListingsThisMonth: number;
  listingGrowthPercentage: number;
  totalMessages: number;
  newMessagesThisMonth: number;
  messageGrowthPercentage: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  leadGrowthPercentage: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
  quickActions: {
    pendingListings: number;
    newMessages: number;
    newLeads: number;
  };
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: {
    value: string;
    up: boolean;
  };
  subtitle?: string;
  loading?: boolean;
}

const StatCard = ({ title, value, icon, trend, subtitle, loading }: StatCardProps) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-gray-100 rounded-lg">
        {loading ? <FiLoader className="w-6 h-6 text-gray-400 animate-spin" /> : icon}
      </div>
      <div className={`text-sm font-medium ${
        loading ? 'text-gray-400' :
        trend.value === 'No change' ? 'text-gray-500' :
        trend.up ? 'text-green-500' : 'text-red-500'
      }`}>
        {loading ? '...' :
         trend.value === 'No change' ? '—' :
         `${trend.up ? '↑' : '↓'} ${trend.value}`}
      </div>
    </div>
    <h3 className="text-lg font-semibold text-gray-900">
      {loading ? '...' : value}
    </h3>
    <p className="text-sm text-gray-600">{title}</p>
    {subtitle && !loading && (
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    )}
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/admin/dashboard');

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized: Admin access required');
          } else if (response.status === 500) {
            throw new Error('Server error: Please check database connection');
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          }
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'new':
        return 'text-blue-700 bg-blue-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'property':
        return '🏠';
      case 'message':
        return '💬';
      case 'lead':
        return '📈';
      default:
        return '📝';
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatTrendValue = (percentage: number) => {
    if (percentage === 0) return 'No change';
    return `${Math.abs(percentage)}%`;
  };

  const dashboardStats = stats ? [
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers),
      icon: <FiUsers className="w-6 h-6 text-blue-500" />,
      trend: {
        value: formatTrendValue(stats.userGrowthPercentage),
        up: stats.userGrowthPercentage > 0
      },
      subtitle: `${stats.newUsersThisMonth} new this month`,
    },
    {
      title: 'Active Listings',
      value: formatNumber(stats.activeListings),
      icon: <FiHome className="w-6 h-6 text-green-500" />,
      trend: {
        value: formatTrendValue(stats.listingGrowthPercentage),
        up: stats.listingGrowthPercentage > 0
      },
      subtitle: `${stats.newListingsThisMonth} new this month`,
    },
    {
      title: 'Total Messages',
      value: formatNumber(stats.totalMessages),
      icon: <FiMessageSquare className="w-6 h-6 text-purple-500" />,
      trend: {
        value: formatTrendValue(stats.messageGrowthPercentage),
        up: stats.messageGrowthPercentage > 0
      },
      subtitle: `${stats.newMessagesThisMonth} new this month`,
    },
    {
      title: 'Total Leads',
      value: formatNumber(stats.totalLeads),
      icon: <FiTrendingUp className="w-6 h-6 text-orange-500" />,
      trend: {
        value: formatTrendValue(stats.leadGrowthPercentage),
        up: stats.leadGrowthPercentage > 0
      },
      subtitle: `${stats.newLeadsThisMonth} new this month`,
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <StatCard
              key={index}
              title="Loading..."
              value="..."
              icon={<FiLoader className="w-6 h-6 text-gray-400" />}
              trend={{ value: "...", up: true }}
              loading={true}
            />
          ))
        ) : (
          dashboardStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton for activity
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div>
                    <div className="w-48 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))
          ) : stats?.recentActivity.length ? (
            stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-600">{activity.timestamp}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left rounded-lg border border-gray-200 hover:border-[#468AD1] hover:bg-gray-50 transition-colors">
            <h3 className="font-medium text-gray-900">Review Listings</h3>
            <p className="text-sm text-gray-600">
              {loading ? '...' : `${stats?.quickActions.pendingListings || 0} pending reviews`}
            </p>
          </button>
          <button className="p-4 text-left rounded-lg border border-gray-200 hover:border-[#468AD1] hover:bg-gray-50 transition-colors">
            <h3 className="font-medium text-gray-900">New Messages</h3>
            <p className="text-sm text-gray-600">
              {loading ? '...' : `${stats?.quickActions.newMessages || 0} new messages`}
            </p>
          </button>
          <button className="p-4 text-left rounded-lg border border-gray-200 hover:border-[#468AD1] hover:bg-gray-50 transition-colors">
            <h3 className="font-medium text-gray-900">New Leads</h3>
            <p className="text-sm text-gray-600">
              {loading ? '...' : `${stats?.quickActions.newLeads || 0} new leads`}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
