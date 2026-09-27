'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiEdit3,
  FiCheckCircle,
  FiXCircle,
  FiExternalLink,
  FiGlobe,
  FiTag,
  FiFileText,
  FiArrowRight,
  FiLoader,
  FiChevronDown,
  FiChevronUp,
  FiLink,
  FiAlertTriangle,
} from 'react-icons/fi';

/* ──────────── Types ──────────── */

interface ServicePage {
  id: string;
  configKey: string;
  slug: string;
  previousSlugs: string[];
  title: string;
  shortTitle: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string | null;
  ogDescription: string | null;
  canonicalUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/* ──────────── Page Component ──────────── */

export default function AdminServicePagesPage() {
  const [servicePages, setServicePages] = useState<ServicePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServicePage>>({});
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchServicePages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/service-pages');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setServicePages(data.servicePages || []);
    } catch (err) {
      toast.error('Failed to load service pages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicePages();
  }, [fetchServicePages]);

  const startEdit = (sp: ServicePage) => {
    setEditingId(sp.id);
    setEditForm({ ...sp });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/service-pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const updated = await res.json();
      setServicePages((prev) =>
        prev.map((sp) => (sp.id === editingId ? updated : sp))
      );
      setEditingId(null);
      setEditForm({});
      toast.success('Service page updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (sp: ServicePage) => {
    try {
      const res = await fetch('/api/admin/service-pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sp.id, isActive: !sp.isActive }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setServicePages((prev) =>
        prev.map((s) => (s.id === sp.id ? { ...s, isActive: !s.isActive } : s))
      );
      toast.success(`Service page ${sp.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error('Failed to toggle service page status');
      console.error(err);
    }
  };

  const filteredPages = servicePages.filter(
    (sp) =>
      sp.title.toLowerCase().includes(search.toLowerCase()) ||
      sp.slug.toLowerCase().includes(search.toLowerCase()) ||
      sp.configKey.toLowerCase().includes(search.toLowerCase())
  );

  const getSeoScore = (sp: ServicePage) => {
    let score = 0;
    if (sp.metaTitle && sp.metaTitle.length >= 30 && sp.metaTitle.length <= 60) score += 25;
    else if (sp.metaTitle) score += 10;
    if (sp.metaDescription && sp.metaDescription.length >= 120 && sp.metaDescription.length <= 160) score += 25;
    else if (sp.metaDescription) score += 10;
    if (sp.slug && sp.slug.length <= 40) score += 25;
    else if (sp.slug) score += 10;
    if (sp.ogTitle || sp.ogDescription) score += 25;
    return score;
  };

  const getSeoColor = (score: number) => {
    if (score >= 75) return 'text-green-700 bg-green-100';
    if (score >= 50) return 'text-amber-700 bg-amber-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiGlobe className="w-6 h-6 text-[#468AD1]" />
              Service Page URLs
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage service page URLs, meta titles, descriptions, and SEO settings.
              Changing a slug automatically creates a 301 redirect from the old URL.
            </p>
          </div>
        </div>

        {/* SEO Tips */}
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">SEO Best Practices for Service URLs:</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                <li><strong>Meta Title:</strong> 30–60 characters. Include primary keyword + brand.</li>
                <li><strong>Meta Description:</strong> 120–160 characters. Compelling summary with a call to action.</li>
                <li><strong>Slug:</strong> Keep it short, lowercase, hyphen-separated. Include target keyword.</li>
                <li><strong>301 Redirects:</strong> Old slugs are preserved and will redirect automatically to maintain SEO equity.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service pages by title, slug, or config key..."
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
          />
        </div>
      </div>

      {/* Service Pages List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-200" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <FiGlobe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No service pages found</h3>
          <p className="text-gray-500 text-sm">
            {search ? 'Try adjusting your search.' : 'No service pages are configured.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPages.map((sp) => {
            const isEditing = editingId === sp.id;
            const isExpanded = expandedId === sp.id;
            const seoScore = getSeoScore(sp);

            return (
              <div
                key={sp.id}
                className={`bg-white rounded-xl shadow-sm border transition-all ${
                  !sp.isActive ? 'border-gray-200 opacity-70' : 'border-gray-100'
                } ${isEditing ? 'ring-2 ring-[#468AD1]/30' : ''}`}
              >
                {/* Header Row */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {/* URL Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      sp.isActive ? 'bg-[#514f63]/10 text-[#514f63]' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <FiLink className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {sp.title}
                        </h3>
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                          sp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {sp.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${getSeoColor(seoScore)}`}>
                          SEO: {seoScore}%
                        </span>
                        {sp.previousSlugs.length > 0 && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                            {sp.previousSlugs.length} redirect{sp.previousSlugs.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="font-mono text-[#468AD1]">/services/{sp.slug}</span>
                        <span className="text-gray-300">|</span>
                        <span>Config: {sp.configKey}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <FiFileText className="w-3 h-3" />
                        <span className="truncate max-w-md">{sp.metaTitle}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(sp)}
                        className={`p-2 rounded-lg transition-colors ${
                          sp.isActive
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={sp.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {sp.isActive ? <FiCheckCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
                      </button>
                      <a
                        href={`/services/${sp.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-[#468AD1] hover:bg-red-50 rounded-lg transition-colors"
                        title="Preview page"
                      >
                        <FiExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => {
                          if (isEditing) {
                            cancelEdit();
                          } else {
                            startEdit(sp);
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isEditing ? 'text-gray-600 bg-gray-100' : 'text-[#514f63] hover:bg-gray-100'
                        }`}
                        title={isEditing ? 'Cancel edit' : 'Edit'}
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : sp.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                {isEditing && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Slug */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          URL Slug *
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 whitespace-nowrap">/services/</span>
                          <input
                            type="text"
                            value={editForm.slug || ''}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
                            })}
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1] font-mono"
                            placeholder="property-valuation"
                          />
                        </div>
                        {editForm.slug !== sp.slug && (
                          <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                            <FiAlertTriangle className="w-3 h-3" />
                            Changing slug will create a 301 redirect from &quot;{sp.slug}&quot;
                          </p>
                        )}
                      </div>

                      {/* Config Key */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Config Key *
                        </label>
                        <input
                          type="text"
                          value={editForm.configKey || ''}
                          onChange={(e) => setEditForm({ ...editForm, configKey: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                          placeholder="property-valuation"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          Must match the key in services-config.ts
                        </p>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Page Title *
                        </label>
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                        />
                      </div>

                      {/* Short Title */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Short Title
                        </label>
                        <input
                          type="text"
                          value={editForm.shortTitle || ''}
                          onChange={(e) => setEditForm({ ...editForm, shortTitle: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                        />
                      </div>

                      {/* Meta Title */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          <FiTag className="w-3 h-3 inline mr-1" />
                          SEO Meta Title * ({(editForm.metaTitle || '').length}/60 chars)
                        </label>
                        <input
                          type="text"
                          value={editForm.metaTitle || ''}
                          onChange={(e) => setEditForm({ ...editForm, metaTitle: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                          maxLength={200}
                        />
                        <div className="flex items-center gap-2 mt-1">
                          {(editForm.metaTitle || '').length > 60 && (
                            <span className="text-xs text-amber-600">Consider keeping under 60 characters</span>
                          )}
                        </div>
                      </div>

                      {/* Meta Description */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          <FiFileText className="w-3 h-3 inline mr-1" />
                          SEO Meta Description * ({(editForm.metaDescription || '').length}/160 chars)
                        </label>
                        <textarea
                          value={editForm.metaDescription || ''}
                          onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                          rows={3}
                          maxLength={320}
                        />
                        <div className="flex items-center gap-2 mt-1">
                          {(editForm.metaDescription || '').length > 160 && (
                            <span className="text-xs text-amber-600">Consider keeping under 160 characters</span>
                          )}
                        </div>
                      </div>

                      {/* OG Title */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Open Graph Title (optional)
                        </label>
                        <input
                          type="text"
                          value={editForm.ogTitle || ''}
                          onChange={(e) => setEditForm({ ...editForm, ogTitle: e.target.value || null })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                          placeholder="Defaults to meta title if empty"
                        />
                      </div>

                      {/* OG Description */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Open Graph Description (optional)
                        </label>
                        <input
                          type="text"
                          value={editForm.ogDescription || ''}
                          onChange={(e) => setEditForm({ ...editForm, ogDescription: e.target.value || null })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                          placeholder="Defaults to meta description if empty"
                        />
                      </div>

                      {/* Canonical URL */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          <FiLink className="w-3 h-3 inline mr-1" />
                          Custom Canonical URL (optional)
                        </label>
                        <input
                          type="url"
                          value={editForm.canonicalUrl || ''}
                          onChange={(e) => setEditForm({ ...editForm, canonicalUrl: e.target.value || null })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                          placeholder="Leave empty to use page URL as canonical"
                        />
                      </div>

                      {/* Sort Order */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          value={editForm.sortOrder ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, sortOrder: Number(e.target.value) })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                        />
                      </div>
                    </div>

                    {/* Save/Cancel Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors font-semibold text-sm disabled:opacity-60"
                      >
                        {saving ? (
                          <><FiLoader className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                          <><FiCheckCircle className="w-4 h-4" /> Save Changes</>
                        )}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && !isEditing && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Current URL</p>
                        <p className="text-sm font-mono text-[#468AD1] break-all">
                          /services/{sp.slug}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Config Key</p>
                        <p className="text-sm font-semibold text-gray-900">{sp.configKey}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Sort Order</p>
                        <p className="text-sm font-semibold text-gray-900">{sp.sortOrder}</p>
                      </div>
                      {sp.canonicalUrl && (
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Canonical URL</p>
                          <a href={sp.canonicalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#468AD1] hover:underline break-all">
                            {sp.canonicalUrl}
                          </a>
                        </div>
                      )}
                      {sp.previousSlugs.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-amber-200 sm:col-span-2 lg:col-span-3">
                          <p className="text-xs text-amber-700 font-semibold mb-2">
                            Previous Slugs (301 Redirects)
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {sp.previousSlugs.map((oldSlug, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-200">
                                <FiArrowRight className="w-3 h-3" />
                                <span className="font-mono line-through">{oldSlug}</span>
                                <span className="text-amber-400">→</span>
                                <span className="font-mono font-semibold">{sp.slug}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                        <p className="text-sm text-gray-700">{new Date(sp.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
