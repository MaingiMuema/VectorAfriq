"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiTrendingUp,
  FiUsers,
  FiEye,
  FiClock,
  FiSettings,
  FiRefreshCw,
  FiDownload,
  FiBarChart2,
  FiGlobe,
  FiSmartphone,
  FiMonitor,
  FiChevronDown,
  FiSearch,
  FiActivity,
  FiInfo,
  FiZap,
  FiTarget
} from "react-icons/fi";
import { toast } from "react-hot-toast";

interface VisitorStats {
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number; percentage: number }>;
  topCountries: Array<{ country: string; visitors: number; percentage: number }>;
  deviceStats: Array<{ device: string; visitors: number; percentage: number }>;
  browserStats: Array<{ browser: string; visitors: number; percentage: number }>;
  dailyVisitors: Array<{ date: string; visitors: number; uniqueVisitors: number }>;
  hourlyDistribution: Array<{ hour: number; visitors: number }>;
}

interface SearchConsoleData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  performanceByDate: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  overallScore: number;
  recommendations: string[];
}



interface AnalyticsConfig {
  [key: string]: {
    value: string;
    description: string;
    isActive: boolean;
    updatedAt: string;
  };
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend?: { value: number; isUpward: boolean }; 
  subtitle?: string;
}) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-gray-100 rounded-lg">
        {icon}
      </div>
      {trend && (
        <div className={`text-sm font-medium ${trend.isUpward ? 'text-green-500' : 'text-red-500'}`}>
          {trend.isUpward ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    <p className="text-sm text-gray-600">{title}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'searchConsole' | 'performance' | 'config'>('overview');
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [searchConsoleData, setSearchConsoleData] = useState<SearchConsoleData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [config, setConfig] = useState<AnalyticsConfig>({});
  const [loading, setLoading] = useState(true);
  const [searchConsoleLoading, setSearchConsoleLoading] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [period, setPeriod] = useState(30);
  const [exporting, setExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/visitors?days=${period}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error("Failed to fetch analytics data");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Error loading analytics data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  const fetchSearchConsoleData = useCallback(async () => {
    try {
      setSearchConsoleLoading(true);
      const response = await fetch(`/api/admin/analytics/search-console?days=${period}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchConsoleData(data.data);
      } else {
        if (data.needsConfiguration) {
          toast.error(data.error);
        } else {
          toast.error("Failed to fetch Search Console data");
        }
      }
    } catch (error) {
      console.error("Error fetching Search Console data:", error);
      toast.error("Error loading Search Console data");
    } finally {
      setSearchConsoleLoading(false);
    }
  }, [period]);

  const fetchPerformanceMetrics = useCallback(async () => {
    try {
      setPerformanceLoading(true);
      const response = await fetch('/api/admin/analytics/performance');
      const data = await response.json();
      
      if (data.success) {
        setPerformanceMetrics(data.metrics);
      } else {
        toast.error("Failed to fetch performance metrics");
      }
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      toast.error("Error loading performance metrics");
    } finally {
      setPerformanceLoading(false);
    }
  }, []);


  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/analytics/config');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.configs);
      } else {
        toast.error("Failed to fetch configuration");
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      toast.error("Error loading configuration");
    }
  };

  const updateConfig = async () => {
    try {
      setConfigLoading(true);
      const response = await fetch('/api/admin/analytics/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: config }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.configs);
        toast.success("Configuration updated successfully");
      } else {
        toast.error(data.error || "Failed to update configuration");
      }
    } catch (error) {
      console.error("Error updating config:", error);
      toast.error("Error updating configuration");
    } finally {
      setConfigLoading(false);
    }
  };



  useEffect(() => {
    fetchStats();
    fetchConfig();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'searchConsole') {
      fetchSearchConsoleData();
    } else if (activeTab === 'performance') {
      fetchPerformanceMetrics();
    } else if (activeTab === 'config') {
      fetchConfig();
    }
  }, [activeTab, fetchSearchConsoleData, fetchPerformanceMetrics]);

  // Handle click outside for export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    // Validate input
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      return '0m 0s';
    }

    const totalSeconds = Math.round(seconds); // Round to nearest second
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const exportData = async (format: 'csv' | 'json' = 'csv') => {
    if (!stats) {
      toast.error("No data to export");
      return;
    }

    try {
      setExporting(true);

      const exportData = {
        exportDate: new Date().toISOString(),
        period: `${period} days`,
        summary: {
          totalVisitors: stats.totalVisitors,
          uniqueVisitors: stats.uniqueVisitors,
          pageViews: stats.pageViews,
          avgSessionDuration: stats.avgSessionDuration,
          bounceRate: stats.bounceRate,
        },
        topPages: stats.topPages,
        topCountries: stats.topCountries,
        deviceStats: stats.deviceStats,
        browserStats: stats.browserStats,
        dailyVisitors: stats.dailyVisitors,
        hourlyDistribution: stats.hourlyDistribution,
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csvContent = generateCSV(exportData);
        downloadFile(csvContent, `analytics-${period}days-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
      } else {
        // Export as JSON
        const jsonContent = JSON.stringify(exportData, null, 2);
        downloadFile(jsonContent, `analytics-${period}days-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
      }

      toast.success(`Analytics data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

interface ExportData {
  exportDate: string;
  period: string;
  summary: {
    totalVisitors: number;
    uniqueVisitors: number;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  topPages: Array<{ page: string; views: number; percentage: number }>;
  topCountries: Array<{ country: string; visitors: number; percentage: number }>;
  deviceStats: Array<{ device: string; visitors: number; percentage: number }>;
  browserStats: Array<{ browser: string; visitors: number; percentage: number }>;
  dailyVisitors: Array<{ date: string; visitors: number; uniqueVisitors: number }>;
  hourlyDistribution: Array<{ hour: number; visitors: number }>;
}

  const generateCSV = (data: ExportData) => {
    const lines = [];

    // Summary section
    lines.push('ANALYTICS SUMMARY');
    lines.push(`Export Date,${data.exportDate}`);
    lines.push(`Period,${data.period}`);
    lines.push('');
    lines.push('Metric,Value');
    lines.push(`Total Visitors,${data.summary.totalVisitors}`);
    lines.push(`Unique Visitors,${data.summary.uniqueVisitors}`);
    lines.push(`Page Views,${data.summary.pageViews}`);
    lines.push(`Average Session Duration,${formatDuration(data.summary.avgSessionDuration)}`);
    lines.push(`Bounce Rate,${data.summary.bounceRate}%`);
    lines.push('');

    // Top Pages
    lines.push('TOP PAGES');
    lines.push('Page,Views,Percentage');
    data.topPages.forEach((page) => {
      lines.push(`"${page.page}",${page.views},${page.percentage}%`);
    });
    lines.push('');

    // Top Countries
    lines.push('TOP COUNTRIES');
    lines.push('Country,Visitors,Percentage');
    data.topCountries.forEach((country) => {
      lines.push(`${country.country},${country.visitors},${country.percentage}%`);
    });
    lines.push('');

    // Device Stats
    lines.push('DEVICE STATISTICS');
    lines.push('Device,Visitors,Percentage');
    data.deviceStats.forEach((device) => {
      lines.push(`${device.device},${device.visitors},${device.percentage}%`);
    });
    lines.push('');

    // Browser Stats
    lines.push('BROWSER STATISTICS');
    lines.push('Browser,Visitors,Percentage');
    data.browserStats.forEach((browser) => {
      lines.push(`${browser.browser},${browser.visitors},${browser.percentage}%`);
    });
    lines.push('');

    // Daily Visitors
    lines.push('DAILY VISITORS');
    lines.push('Date,Total Visitors,Unique Visitors');
    data.dailyVisitors.forEach((day) => {
      lines.push(`${day.date},${day.visitors},${day.uniqueVisitors}`);
    });
    lines.push('');

    // Hourly Distribution
    lines.push('HOURLY DISTRIBUTION');
    lines.push('Hour,Visitors');
    data.hourlyDistribution.forEach((hour) => {
      lines.push(`${hour.hour}:00,${hour.visitors}`);
    });

    return lines.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportServerSide = async (format: 'csv' | 'json') => {
    try {
      setExporting(true);

      const response = await fetch(`/api/admin/analytics/export?days=${period}&format=${format}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `analytics-${period}days-${new Date().toISOString().split('T')[0]}.${format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Detailed analytics data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting server-side data:", error);
      toast.error("Failed to export detailed data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Google Analytics & SEO Console</h1>
          <p className="text-gray-600">Monitor site performance, search visibility, and configure SEO settings</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={exporting || !stats}
              className="flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] disabled:opacity-50"
            >
              <FiDownload className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export'}
              <FiChevronDown className="w-4 h-4" />
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      exportData('csv');
                      setShowExportDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiDownload className="w-4 h-4" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      exportData('json');
                      setShowExportDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiDownload className="w-4 h-4" />
                    Export as JSON
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      exportServerSide('csv');
                      setShowExportDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiDownload className="w-4 h-4" />
                    Export Detailed CSV
                  </button>
                  <button
                    onClick={() => {
                      exportServerSide('json');
                      setShowExportDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiDownload className="w-4 h-4" />
                    Export Detailed JSON
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="px-4 py-2 text-xs text-gray-500">
                    Standard export: Current dashboard data<br/>
                    Detailed export: Comprehensive data with visitor details
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap space-x-1 sm:space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-[#468AD1] text-[#468AD1]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiBarChart2 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('searchConsole')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'searchConsole'
                ? 'border-[#468AD1] text-[#468AD1]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiSearch className="w-4 h-4 inline mr-2" />
            Search Console
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'performance'
                ? 'border-[#468AD1] text-[#468AD1]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiZap className="w-4 h-4 inline mr-2" />
            Performance
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-[#468AD1] text-[#468AD1]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiSettings className="w-4 h-4 inline mr-2" />
            Configuration
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Period:</span>
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-3 py-1 text-sm rounded-lg ${
                  period === days
                    ? 'bg-[#468AD1] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#468AD1]"></div>
            </div>
          ) : stats ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Visitors"
                  value={stats.totalVisitors.toLocaleString()}
                  icon={<FiUsers className="w-6 h-6 text-blue-500" />}
                  subtitle="All page visits"
                />
                <StatCard
                  title="Unique Visitors"
                  value={stats.uniqueVisitors.toLocaleString()}
                  icon={<FiTrendingUp className="w-6 h-6 text-green-500" />}
                  subtitle="Unique sessions"
                />
                <StatCard
                  title="Page Views"
                  value={stats.pageViews.toLocaleString()}
                  icon={<FiEye className="w-6 h-6 text-purple-500" />}
                  subtitle="Total page views"
                />
                <StatCard
                  title="Avg. Session Duration"
                  value={formatDuration(stats.avgSessionDuration)}
                  icon={<FiClock className="w-6 h-6 text-orange-500" />}
                  subtitle={`${stats.bounceRate}% bounce rate`}
                />
              </div>

              {/* Charts and Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Pages */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
                  <div className="space-y-3">
                    {stats.topPages.slice(0, 5).map((page, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {page.page}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-[#468AD1] h-2 rounded-full"
                              style={{ width: `${page.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-sm text-gray-500">
                          {page.views} ({page.percentage}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Countries */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <FiGlobe className="w-5 h-5 inline mr-2" />
                    Top Countries
                  </h3>
                  <div className="space-y-3">
                    {stats.topCountries.slice(0, 5).map((country, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">{country.country}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${country.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500 w-12 text-right">
                            {country.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device Stats */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <FiSmartphone className="w-5 h-5 inline mr-2" />
                    Device Types
                  </h3>
                  <div className="space-y-3">
                    {stats.deviceStats.map((device, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {device.device === 'Mobile' ? (
                            <FiSmartphone className="w-4 h-4 text-gray-500" />
                          ) : (
                            <FiMonitor className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm text-gray-900">{device.device}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {device.visitors} ({device.percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Browser Stats */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Browsers</h3>
                  <div className="space-y-3">
                    {stats.browserStats.slice(0, 5).map((browser, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">{browser.browser}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${browser.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500 w-12 text-right">
                            {browser.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No analytics data available</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'searchConsole' && (
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Period:</span>
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-3 py-1 text-sm rounded-lg ${
                  period === days
                    ? 'bg-[#468AD1] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days} days
              </button>
            ))}
            <button
              onClick={fetchSearchConsoleData}
              disabled={searchConsoleLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 ml-auto"
            >
              <FiRefreshCw className={`w-4 h-4 ${searchConsoleLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {searchConsoleLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#468AD1]"></div>
            </div>
          ) : searchConsoleData ? (
            <>
              {/* Search Console Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Clicks"
                  value={searchConsoleData.clicks.toLocaleString()}
                  icon={<FiTrendingUp className="w-6 h-6 text-blue-500" />}
                  subtitle="From search results"
                />
                <StatCard
                  title="Total Impressions"
                  value={searchConsoleData.impressions.toLocaleString()}
                  icon={<FiEye className="w-6 h-6 text-green-500" />}
                  subtitle="Search appearances"
                />
                <StatCard
                  title="Avg. CTR"
                  value={`${(searchConsoleData.ctr * 100).toFixed(2)}%`}
                  icon={<FiTarget className="w-6 h-6 text-purple-500" />}
                  subtitle="Click-through rate"
                />
                <StatCard
                  title="Avg. Position"
                  value={searchConsoleData.position.toFixed(1)}
                  icon={<FiBarChart2 className="w-6 h-6 text-orange-500" />}
                  subtitle="Search ranking"
                />
              </div>

              {/* Search Console Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Queries */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Search Queries</h3>
                  <div className="space-y-3">
                    {searchConsoleData.topQueries.slice(0, 5).map((query, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {query.query}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {query.clicks} clicks ({(query.ctr * 100).toFixed(1)}%)
                            </span>
                            <span className="text-xs text-gray-500">
                              Pos: {query.position.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 text-sm text-gray-500">
                          {query.impressions.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Pages */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages in Search</h3>
                  <div className="space-y-3">
                    {searchConsoleData.topPages.slice(0, 5).map((page, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {page.page}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {page.clicks} clicks ({(page.ctr * 100).toFixed(1)}%)
                            </span>
                            <span className="text-xs text-gray-500">
                              Pos: {page.position.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 text-sm text-gray-500">
                          {page.impressions.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No Search Console data available</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              <p className="text-sm text-gray-600">Core Web Vitals and site performance data</p>
            </div>
            <button
              onClick={fetchPerformanceMetrics}
              disabled={performanceLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${performanceLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {performanceLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#468AD1]"></div>
            </div>
          ) : performanceMetrics ? (
            <>
              {/* Performance Score */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Overall Performance Score</h4>
                  <div className={`text-2xl font-bold ${
                    performanceMetrics.overallScore >= 90 ? 'text-green-500' :
                    performanceMetrics.overallScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {performanceMetrics.overallScore}/100
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      performanceMetrics.overallScore >= 90 ? 'bg-green-500' :
                      performanceMetrics.overallScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${performanceMetrics.overallScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Core Web Vitals */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                  title="Largest Contentful Paint"
                  value={`${performanceMetrics.lcp.toFixed(1)}s`}
                  icon={<FiZap className="w-6 h-6 text-blue-500" />}
                  subtitle={performanceMetrics.lcp <= 2.5 ? 'Good' : performanceMetrics.lcp <= 4 ? 'Needs improvement' : 'Poor'}
                />
                <StatCard
                  title="First Input Delay"
                  value={`${performanceMetrics.fid.toFixed(0)}ms`}
                  icon={<FiActivity className="w-6 h-6 text-green-500" />}
                  subtitle={performanceMetrics.fid <= 100 ? 'Good' : performanceMetrics.fid <= 300 ? 'Needs improvement' : 'Poor'}
                />
                <StatCard
                  title="Cumulative Layout Shift"
                  value={performanceMetrics.cls.toFixed(3)}
                  icon={<FiBarChart2 className="w-6 h-6 text-purple-500" />}
                  subtitle={performanceMetrics.cls <= 0.1 ? 'Good' : performanceMetrics.cls <= 0.25 ? 'Needs improvement' : 'Poor'}
                />
                <StatCard
                  title="First Contentful Paint"
                  value={`${performanceMetrics.fcp.toFixed(1)}s`}
                  icon={<FiEye className="w-6 h-6 text-orange-500" />}
                  subtitle={performanceMetrics.fcp <= 1.8 ? 'Good' : performanceMetrics.fcp <= 3 ? 'Needs improvement' : 'Poor'}
                />
                <StatCard
                  title="Time to First Byte"
                  value={`${performanceMetrics.ttfb.toFixed(0)}ms`}
                  icon={<FiClock className="w-6 h-6 text-red-500" />}
                  subtitle={performanceMetrics.ttfb <= 600 ? 'Good' : performanceMetrics.ttfb <= 1500 ? 'Needs improvement' : 'Poor'}
                />
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Recommendations</h4>
                <div className="space-y-3">
                  {performanceMetrics.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <FiInfo className="w-5 h-5 text-blue-500 mt-0.5" />
                      <p className="text-sm text-gray-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No performance data available</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Analytics Configuration</h3>
            
            <div className="space-y-6">
              {/* Google Analytics Settings */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Google Analytics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Measurement ID (GA4)
                    </label>
                    <input
                      type="text"
                      placeholder="G-XXXXXXXXXX"
                      value={config.GOOGLE_ANALYTICS_ID?.value || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        GOOGLE_ANALYTICS_ID: {
                          ...prev.GOOGLE_ANALYTICS_ID,
                          value: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Find this in Google Analytics → Admin → Data Streams
                    </p>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.GOOGLE_ANALYTICS_ENABLED?.value === 'true'}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          GOOGLE_ANALYTICS_ENABLED: {
                            ...prev.GOOGLE_ANALYTICS_ENABLED,
                            value: e.target.checked ? 'true' : 'false'
                          }
                        }))}
                        className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Google Analytics</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Google Search Console Settings */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Google Search Console</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com"
                      value={config.SEARCH_CONSOLE_URL?.value || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        SEARCH_CONSOLE_URL: {
                          ...prev.SEARCH_CONSOLE_URL,
                          value: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Verify ownership in Google Search Console
                    </p>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.SEARCH_CONSOLE_ENABLED?.value === 'true'}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          SEARCH_CONSOLE_ENABLED: {
                            ...prev.SEARCH_CONSOLE_ENABLED,
                            value: e.target.checked ? 'true' : 'false'
                          }
                        }))}
                        className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Search Console Integration</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Enhanced Analytics Settings */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Enhanced Analytics</h4>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.ENHANCED_MEASUREMENT_ENABLED?.value === 'true'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        ENHANCED_MEASUREMENT_ENABLED: {
                          ...prev.ENHANCED_MEASUREMENT_ENABLED,
                          value: e.target.checked ? 'true' : 'false'
                        }
                      }))}
                      className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Enhanced Measurement</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.USER_ID_TRACKING_ENABLED?.value === 'true'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        USER_ID_TRACKING_ENABLED: {
                          ...prev.USER_ID_TRACKING_ENABLED,
                          value: e.target.checked ? 'true' : 'false'
                        }
                      }))}
                      className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable User ID Tracking</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.CROSS_DOMAIN_TRACKING_ENABLED?.value === 'true'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        CROSS_DOMAIN_TRACKING_ENABLED: {
                          ...prev.CROSS_DOMAIN_TRACKING_ENABLED,
                          value: e.target.checked ? 'true' : 'false'
                        }
                      }))}
                      className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Cross-Domain Tracking</span>
                  </label>
                </div>
              </div>

              {/* Visitor Tracking Settings */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Internal Visitor Tracking</h4>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.VISITOR_TRACKING_ENABLED?.value === 'true'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        VISITOR_TRACKING_ENABLED: {
                          ...prev.VISITOR_TRACKING_ENABLED,
                          value: e.target.checked ? 'true' : 'false'
                        }
                      }))}
                      className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable visitor tracking</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.PROPERTY_VIEW_TRACKING_ENABLED?.value === 'true'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        PROPERTY_VIEW_TRACKING_ENABLED: {
                          ...prev.PROPERTY_VIEW_TRACKING_ENABLED,
                          value: e.target.checked ? 'true' : 'false'
                        }
                      }))}
                      className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable property view tracking</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.IP_ANONYMIZATION_ENABLED?.value === 'true'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        IP_ANONYMIZATION_ENABLED: {
                          ...prev.IP_ANONYMIZATION_ENABLED,
                          value: e.target.checked ? 'true' : 'false'
                        }
                      }))}
                      className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable IP anonymization</span>
                  </label>
                </div>
              </div>

              {/* Data Retention */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Data Retention</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retention Period (days)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="1095"
                    value={config.DATA_RETENTION_DAYS?.value || '365'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      DATA_RETENTION_DAYS: {
                        ...prev.DATA_RETENTION_DAYS,
                        value: e.target.value
                      }
                    }))}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How long to keep analytics data (30-1095 days)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={updateConfig}
                disabled={configLoading}
                className="px-6 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] disabled:opacity-50"
              >
                {configLoading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
