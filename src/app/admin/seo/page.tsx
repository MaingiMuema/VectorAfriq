"use client";

import { useState, useEffect } from "react";

import {
  FiSearch,
  FiSettings,
  FiFileText,
  FiGlobe,
  FiRefreshCw,
  FiDownload,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiExternalLink,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiSave,
  FiCpu,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

interface SeoConfig {
  [key: string]: {
    value: string;
    description: string;
    isActive: boolean;
    updatedAt: string;
  };
}

interface PageMeta {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType?: string | null;
  twitterCard?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  canonicalUrl?: string | null;
  priority: number;
  changeFreq: string;
  noIndex: boolean;
  noFollow: boolean;
  isActive: boolean;
  updatedAt: string;
}

export default function SeoManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'pages' | 'sitemap' | 'robots'>('overview');
  const [config, setConfig] = useState<SeoConfig>({});
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [robotsContent, setRobotsContent] = useState('');
  const [selectedPage, setSelectedPage] = useState<PageMeta | null>(null);
  const [showPageModal, setShowPageModal] = useState(false);
  const [pageForm, setPageForm] = useState({
    path: '',
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    canonicalUrl: '',
    noIndex: false,
    noFollow: false,
    priority: 0.5,
    changeFreq: 'weekly',
    isActive: true,
  });
  const [pageFormLoading, setPageFormLoading] = useState(false);


  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/seo/config');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.configs);
      } else {
        toast.error("Failed to fetch SEO configuration");
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      toast.error("Error loading SEO configuration");
    }
  };

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/admin/seo/pages');
      const data = await response.json();
      
      if (data.success) {
        setPages(data.pages);
      } else {
        toast.error("Failed to fetch page meta data");
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast.error("Error loading page meta data");
    }
  };

  const fetchRobots = async () => {
    try {
      const response = await fetch('/api/admin/seo/robots');
      const content = await response.text();
      setRobotsContent(content);
    } catch (error) {
      console.error("Error fetching robots.txt:", error);
      toast.error("Error loading robots.txt");
    }
  };

  const updateConfig = async () => {
    try {
      setConfigLoading(true);
      const response = await fetch('/api/admin/seo/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: config }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.configs);
        toast.success("SEO configuration updated successfully");
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

  const updateRobots = async () => {
    try {
      const response = await fetch('/api/admin/seo/robots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: robotsContent }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Robots.txt updated successfully");
      } else {
        toast.error(data.error || "Failed to update robots.txt");
      }
    } catch (error) {
      console.error("Error updating robots.txt:", error);
      toast.error("Error updating robots.txt");
    }
  };

  const generateSitemap = async () => {
    try {
      const response = await fetch('/api/admin/seo/sitemap?download=true');

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sitemap-${new Date().toISOString().split('T')[0]}.xml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Sitemap generated and downloaded successfully");
      } else {
        toast.error("Failed to generate sitemap");
      }
    } catch (error) {
      console.error("Error generating sitemap:", error);
      toast.error("Error generating sitemap");
    }
  };

  const openPageModal = (page?: PageMeta) => {
    if (page) {
      setSelectedPage(page);
      setPageForm({
        path: page.path,
        title: page.title || '',
        description: page.description || '',
        keywords: page.keywords || '',
        ogTitle: page.ogTitle || '',
        ogDescription: page.ogDescription || '',
        ogImage: page.ogImage || '',
        ogType: page.ogType || 'website',
        twitterCard: page.twitterCard || 'summary_large_image',
        twitterTitle: page.twitterTitle || '',
        twitterDescription: page.twitterDescription || '',
        twitterImage: page.twitterImage || '',
        canonicalUrl: page.canonicalUrl || '',
        noIndex: page.noIndex || false,
        noFollow: page.noFollow || false,
        priority: page.priority || 0.5,
        changeFreq: page.changeFreq || 'weekly',
        isActive: page.isActive !== false,
      });
    } else {
      setSelectedPage(null);
      setPageForm({
        path: '',
        title: '',
        description: '',
        keywords: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        ogType: 'website',
        twitterCard: 'summary_large_image',
        twitterTitle: '',
        twitterDescription: '',
        twitterImage: '',
        canonicalUrl: '',
        noIndex: false,
        noFollow: false,
        priority: 0.5,
        changeFreq: 'weekly',
        isActive: true,
      });
    }
    setShowPageModal(true);
  };

  const closePageModal = () => {
    setShowPageModal(false);
    setSelectedPage(null);
  };

  const savePageMeta = async () => {
    if (!pageForm.path.trim()) {
      toast.error("Path is required");
      return;
    }

    try {
      setPageFormLoading(true);
      const response = await fetch('/api/admin/seo/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageForm),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        await fetchPages();
        closePageModal();
      } else {
        toast.error(data.error || "Failed to save page meta");
      }
    } catch (error) {
      console.error("Error saving page meta:", error);
      toast.error("Error saving page meta");
    } finally {
      setPageFormLoading(false);
    }
  };

  const deletePageMeta = async (path: string) => {
    if (!confirm('Are you sure you want to delete this page meta? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/seo/pages?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Page meta deleted successfully");
        await fetchPages();
      } else {
        toast.error(data.error || "Failed to delete page meta");
      }
    } catch (error) {
      console.error("Error deleting page meta:", error);
      toast.error("Error deleting page meta");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConfig(), fetchPages(), fetchRobots()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  const getSeoScore = () => {
    const checks = [
      { name: 'Site Name', passed: !!config.SITE_NAME?.value },
      { name: 'Default Title', passed: !!config.DEFAULT_TITLE?.value },
      { name: 'Default Description', passed: !!config.DEFAULT_DESCRIPTION?.value },
      { name: 'Sitemap Enabled', passed: config.SITEMAP_ENABLED?.value === 'true' },
      { name: 'Structured Data', passed: config.STRUCTURED_DATA_ENABLED?.value === 'true' },
      { name: 'Robots.txt', passed: !!robotsContent },
    ];
    
    const passedChecks = checks.filter(check => check.passed).length;
    return Math.round((passedChecks / checks.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-gray-600">Manage search engine optimization settings and meta tags</p>
        </div>
        
        <div className="flex items-center gap-2">
          <a
            href="/admin/seo/agent"
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
          >
            <FiCpu className="w-4 h-4" />
            SEO Agent Dashboard
          </a>

          <button
            onClick={() => window.open('/sitemap.xml', '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <FiExternalLink className="w-4 h-4" />
            View Sitemap
          </button>
          
          <button
            onClick={generateSitemap}
            className="flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE]"
          >
            <FiDownload className="w-4 h-4" />
            Download Sitemap
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: FiSearch },
            { id: 'config', label: 'Configuration', icon: FiSettings },
            { id: 'pages', label: 'Page Meta Tags', icon: FiFileText },
            { id: 'sitemap', label: 'Sitemap', icon: FiGlobe },
            { id: 'robots', label: 'Robots.txt', icon: FiFileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'config' | 'pages' | 'sitemap' | 'robots')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-[#468AD1] text-[#468AD1]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}

        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#468AD1]"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* SEO Score */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">SEO Health Score</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      getSeoScore() >= 80 ? 'bg-green-500' : getSeoScore() >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {getSeoScore()}%
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Site Name', passed: !!config.SITE_NAME?.value, description: 'Website name configured' },
                    { name: 'Default Title', passed: !!config.DEFAULT_TITLE?.value, description: 'Default page title set' },
                    { name: 'Default Description', passed: !!config.DEFAULT_DESCRIPTION?.value, description: 'Default meta description set' },
                    { name: 'Sitemap Enabled', passed: config.SITEMAP_ENABLED?.value === 'true', description: 'XML sitemap generation enabled' },
                    { name: 'Structured Data', passed: config.STRUCTURED_DATA_ENABLED?.value === 'true', description: 'JSON-LD structured data enabled' },
                    { name: 'Robots.txt', passed: !!robotsContent, description: 'Robots.txt file configured' },
                  ].map((check, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      {check.passed ? (
                        <FiCheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : (
                        <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{check.name}</p>
                        <p className="text-sm text-gray-600">{check.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiFileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{pages.length}</h3>
                      <p className="text-sm text-gray-600">Pages with Meta Tags</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FiGlobe className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {config.SITEMAP_ENABLED?.value === 'true' ? 'Active' : 'Inactive'}
                      </h3>
                      <p className="text-sm text-gray-600">Sitemap Status</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiSearch className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {config.STRUCTURED_DATA_ENABLED?.value === 'true' ? 'Enabled' : 'Disabled'}
                      </h3>
                      <p className="text-sm text-gray-600">Structured Data</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">SEO Configuration</h3>
              
              <div className="space-y-6">
                {/* Basic Settings */}
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Basic Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={config.SITE_NAME?.value || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          SITE_NAME: { ...prev.SITE_NAME, value: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site URL
                      </label>
                      <input
                        type="url"
                        value={config.SITE_URL?.value || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          SITE_URL: { ...prev.SITE_URL, value: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                      />
                    </div>
                  </div>
                </div>

                {/* Default Meta Tags */}
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Default Meta Tags</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Title
                      </label>
                      <input
                        type="text"
                        value={config.DEFAULT_TITLE?.value || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          DEFAULT_TITLE: { ...prev.DEFAULT_TITLE, value: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Description
                      </label>
                      <textarea
                        rows={3}
                        value={config.DEFAULT_DESCRIPTION?.value || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          DEFAULT_DESCRIPTION: { ...prev.DEFAULT_DESCRIPTION, value: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Keywords
                      </label>
                      <input
                        type="text"
                        value={config.DEFAULT_KEYWORDS?.value || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          DEFAULT_KEYWORDS: { ...prev.DEFAULT_KEYWORDS, value: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                      />
                    </div>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Feature Settings</h4>
                  <div className="space-y-4">
                    {[
                      { key: 'SITEMAP_ENABLED', label: 'Enable Sitemap Generation' },
                      { key: 'STRUCTURED_DATA_ENABLED', label: 'Enable Structured Data (JSON-LD)' },
                      { key: 'AUTO_META_ENABLED', label: 'Enable Automatic Meta Tag Generation' },
                      { key: 'CANONICAL_ENABLED', label: 'Enable Canonical URLs' },
                    ].map((setting) => (
                      <label key={setting.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config[setting.key]?.value === 'true'}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            [setting.key]: {
                              ...prev[setting.key],
                              value: e.target.checked ? 'true' : 'false'
                            }
                          }))}
                          className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                        />
                        <span className="ml-2 text-sm text-gray-700">{setting.label}</span>
                      </label>
                    ))}
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
          )}

          {activeTab === 'pages' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Page Meta Tags</h3>
                <button
                  onClick={() => openPageModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE]"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Page Meta
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Path
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pages.map((page) => (
                        <tr key={page.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {page.path}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {page.title || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {page.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {page.priority}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              page.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {page.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openPageModal(page)}
                                className="text-[#468AD1] hover:text-[#2F6FAE]"
                                title="Edit page meta"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deletePageMeta(page.path)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete page meta"
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
            </div>
          )}

          {activeTab === 'sitemap' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Sitemap Management</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open('/api/admin/seo/sitemap', '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <FiExternalLink className="w-4 h-4" />
                    View XML
                  </button>
                  <button
                    onClick={generateSitemap}
                    className="flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE]"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{pages.length}</div>
                    <div className="text-sm text-gray-600">Static Pages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">~1000</div>
                    <div className="text-sm text-gray-600">Property Pages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {config.SITEMAP_ENABLED?.value === 'true' ? 'Enabled' : 'Disabled'}
                    </div>
                    <div className="text-sm text-gray-600">Auto Generation</div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Sitemap URLs</h4>
                  <div className="space-y-2">
                    {pages.slice(0, 10).map((page) => (
                      <div key={page.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">{page.path}</span>
                          <span className="text-xs text-gray-500">Priority: {page.priority}</span>
                          <span className="text-xs text-gray-500">Freq: {page.changeFreq}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            page.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {page.isActive ? 'Included' : 'Excluded'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {pages.length > 10 && (
                      <div className="text-center py-2 text-sm text-gray-500">
                        ... and {pages.length - 10} more pages
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'robots' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Robots.txt Configuration</h3>
                <button
                  onClick={() => window.open('/robots.txt', '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <FiExternalLink className="w-4 h-4" />
                  View Current
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Robots.txt Content
                  </label>
                  <textarea
                    rows={12}
                    value={robotsContent}
                    onChange={(e) => setRobotsContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1] font-mono text-sm"
                    placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /admin/&#10;&#10;Sitemap: https://vectorafriqproperties.co.ke/sitemap.xml"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Configure which parts of your site search engines can crawl
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={updateRobots}
                  className="px-6 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE]"
                >
                  Update Robots.txt
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Page Meta Modal */}
      {showPageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedPage ? 'Edit Page Meta Tags' : 'Add Page Meta Tags'}
              </h3>
              <button
                onClick={closePageModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Path *
                    </label>
                    <input
                      type="text"
                      value={pageForm.path}
                      onChange={(e) => setPageForm(prev => ({ ...prev, path: e.target.value }))}
                      placeholder="/example-page"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                      disabled={!!selectedPage}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The URL path for this page (e.g., /properties, /about)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      value={pageForm.canonicalUrl}
                      onChange={(e) => setPageForm(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                      placeholder="https://vectorafriqproperties.co.ke/example-page"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    />
                  </div>
                </div>
              </div>

              {/* Meta Tags */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Meta Tags</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Title
                    </label>
                    <input
                      type="text"
                      value={pageForm.title}
                      onChange={(e) => setPageForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Page Title | VectorAfriq"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 50-60 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      rows={3}
                      value={pageForm.description}
                      onChange={(e) => setPageForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the page content..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 150-160 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords
                    </label>
                    <input
                      type="text"
                      value={pageForm.keywords}
                      onChange={(e) => setPageForm(prev => ({ ...prev, keywords: e.target.value }))}
                      placeholder="keyword1, keyword2, keyword3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Comma-separated keywords relevant to this page
                    </p>
                  </div>
                </div>
              </div>

              {/* Open Graph Tags */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Open Graph (Social Media)</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG Title
                      </label>
                      <input
                        type="text"
                        value={pageForm.ogTitle}
                        onChange={(e) => setPageForm(prev => ({ ...prev, ogTitle: e.target.value }))}
                        placeholder="Title for social media sharing"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG Type
                      </label>
                      <select
                        value={pageForm.ogType}
                        onChange={(e) => setPageForm(prev => ({ ...prev, ogType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                      >
                        <option value="website">Website</option>
                        <option value="article">Article</option>
                        <option value="product">Product</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG Description
                    </label>
                    <textarea
                      rows={2}
                      value={pageForm.ogDescription}
                      onChange={(e) => setPageForm(prev => ({ ...prev, ogDescription: e.target.value }))}
                      placeholder="Description for social media sharing"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG Image URL
                    </label>
                    <input
                      type="url"
                      value={pageForm.ogImage}
                      onChange={(e) => setPageForm(prev => ({ ...prev, ogImage: e.target.value }))}
                      placeholder="/images/og-image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    />
                  </div>
                </div>
              </div>

              {/* Twitter Cards */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Twitter Cards</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter Card Type
                      </label>
                      <select
                        value={pageForm.twitterCard}
                        onChange={(e) => setPageForm(prev => ({ ...prev, twitterCard: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                      >
                        <option value="summary">Summary</option>
                        <option value="summary_large_image">Summary Large Image</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter Title
                      </label>
                      <input
                        type="text"
                        value={pageForm.twitterTitle}
                        onChange={(e) => setPageForm(prev => ({ ...prev, twitterTitle: e.target.value }))}
                        placeholder="Title for Twitter sharing"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter Description
                    </label>
                    <textarea
                      rows={2}
                      value={pageForm.twitterDescription}
                      onChange={(e) => setPageForm(prev => ({ ...prev, twitterDescription: e.target.value }))}
                      placeholder="Description for Twitter sharing"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter Image URL
                    </label>
                    <input
                      type="url"
                      value={pageForm.twitterImage}
                      onChange={(e) => setPageForm(prev => ({ ...prev, twitterImage: e.target.value }))}
                      placeholder="/images/twitter-image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Settings */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">SEO Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={pageForm.priority}
                      onChange={(e) => setPageForm(prev => ({ ...prev, priority: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    >
                      <option value={1.0}>1.0 (Highest)</option>
                      <option value={0.9}>0.9 (High)</option>
                      <option value={0.8}>0.8 (Above Average)</option>
                      <option value={0.7}>0.7 (Average)</option>
                      <option value={0.6}>0.6 (Below Average)</option>
                      <option value={0.5}>0.5 (Low)</option>
                      <option value={0.4}>0.4 (Lower)</option>
                      <option value={0.3}>0.3 (Lowest)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Change Frequency
                    </label>
                    <select
                      value={pageForm.changeFreq}
                      onChange={(e) => setPageForm(prev => ({ ...prev, changeFreq: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                    >
                      <option value="always">Always</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pageForm.noIndex}
                      onChange={(e) => setPageForm(prev => ({ ...prev, noIndex: e.target.checked }))}
                      className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                    />
                    <span className="ml-2 text-sm text-gray-700">No Index (prevent search engines from indexing this page)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pageForm.noFollow}
                      onChange={(e) => setPageForm(prev => ({ ...prev, noFollow: e.target.checked }))}
                      className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                    />
                    <span className="ml-2 text-sm text-gray-700">No Follow (prevent search engines from following links on this page)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pageForm.isActive}
                      onChange={(e) => setPageForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active (include in sitemap and apply meta tags)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closePageModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={savePageMeta}
                disabled={pageFormLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                {pageFormLoading ? 'Saving...' : 'Save Meta Tags'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
