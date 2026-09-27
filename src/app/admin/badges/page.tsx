"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  FiSave,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiEdit2,
  FiSettings,
  FiX,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import { TIER_GRADIENTS, TIER_ICONS } from "@/lib/badgeConstants";
import type { BadgeTier } from "@/types";

/** Safely parse features from DB — may arrive as string or array */
function safeParseFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BadgeTierConfig {
  id: string;
  tier: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  features: string[];
  price: number;
  sortOrder: number;
  isActive: boolean;
  autoAssignEnabled: boolean;
  minListings: number;
  bgGradient: string | null;
  iconColor: string | null;
  accentColor: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Badge Preview Card
// ---------------------------------------------------------------------------

function BadgePreviewCard({ tier }: { tier: BadgeTierConfig }) {
  const gradient = TIER_GRADIENTS[tier.tier as BadgeTier] || "from-gray-500 to-gray-600";
  const icon = TIER_ICONS[tier.tier as BadgeTier];

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} p-[1px]`}>
      <div className="bg-white rounded-2xl p-6 h-full">
        {/* Badge visual */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
            {tier.subtitle && (
              <p className="text-xs text-gray-500">{tier.subtitle}</p>
            )}
          </div>
          {!tier.isActive && (
            <span className="ml-auto px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
              Disabled
            </span>
          )}
        </div>

        {/* Description */}
        {tier.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{tier.description}</p>
        )}

        {/* Features */}
        {tier.features.length > 0 && (
          <ul className="space-y-1.5 mb-4">
            {tier.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${gradient} flex-shrink-0`} />
                {feature}
              </li>
            ))}
          </ul>
        )}

        {/* Price */}
        <div className="pt-3 border-t border-gray-100">
          {tier.price === 0 ? (
            <span className="text-sm font-bold text-emerald-600">FREE</span>
          ) : (
            <span className="text-sm font-bold text-gray-900">
              KES {tier.price.toLocaleString()}
            </span>
          )}
          {tier.autoAssignEnabled && (
            <span className="ml-2 text-xs text-blue-600 font-medium">Auto-assigned</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Edit Form
// ---------------------------------------------------------------------------

function BadgeEditForm({
  tier,
  onSave,
  onCancel,
}: {
  tier: BadgeTierConfig;
  onSave: (id: string, updates: Partial<BadgeTierConfig>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(tier.name);
  const [subtitle, setSubtitle] = useState(tier.subtitle || "");
  const [description, setDescription] = useState(tier.description || "");
  const [features, setFeatures] = useState<string[]>(tier.features);
  const [price, setPrice] = useState(tier.price);
  const [isActive, setIsActive] = useState(tier.isActive);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(tier.autoAssignEnabled);
  const [minListings, setMinListings] = useState(tier.minListings);
  const [newFeature, setNewFeature] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(tier.id, {
        name,
        subtitle: subtitle || null,
        description: description || null,
        features,
        price,
        isActive,
        autoAssignEnabled,
        minListings,
      });
      toast.success(`${name} badge updated successfully`);
    } catch {
      toast.error("Failed to update badge tier");
    } finally {
      setSaving(false);
    }
  };

  const gradient = TIER_GRADIENTS[tier.tier as BadgeTier] || "from-gray-500 to-gray-600";
  const icon = TIER_ICONS[tier.tier as BadgeTier];

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit {tier.tier} Badge</h3>
            <p className="text-xs text-gray-500">Configure this badge tier's settings</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Name & Subtitle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Badge Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Basic Checks"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:border-transparent"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:border-transparent resize-none"
        />
      </div>

      {/* Features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Included Features</label>
        <div className="space-y-2">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${gradient} flex-shrink-0`} />
              <span className="flex-1 text-sm text-gray-700">{feature}</span>
              <button
                onClick={() => handleRemoveFeature(i)}
                className="text-gray-400 hover:text-red-500 p-0.5"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFeature()}
              placeholder="Add a feature..."
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:border-transparent"
            />
            <button
              onClick={handleAddFeature}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Price & Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (KES)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:border-transparent"
          />
          {price === 0 && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">Free badge</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Listings
          </label>
          <input
            type="number"
            value={minListings}
            onChange={(e) => setMinListings(Number(e.target.value))}
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:border-transparent"
          />
          {autoAssignEnabled && (
            <p className="text-xs text-blue-600 mt-1 font-medium">Auto-assign threshold</p>
          )}
        </div>
        <div className="flex flex-col gap-3 justify-center">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              onClick={() => setIsActive(!isActive)}
              className="text-lg"
            >
              {isActive ? (
                <FiToggleRight className="w-8 h-8 text-emerald-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-700">Active</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              onClick={() => setAutoAssignEnabled(!autoAssignEnabled)}
              className="text-lg"
            >
              {autoAssignEnabled ? (
                <FiToggleRight className="w-8 h-8 text-blue-500" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-700">Auto-assign</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#468AD1] text-white rounded-lg text-sm font-medium hover:bg-[#2F6FAE] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminBadgesPage() {
  const [tiers, setTiers] = useState<BadgeTierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/badge-tiers");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTiers(data.map((t: any) => ({ ...t, features: safeParseFeatures(t.features) })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load badge tiers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const handleSave = async (id: string, updates: Partial<BadgeTierConfig>) => {
    const res = await fetch("/api/admin/badge-tiers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error("Failed to update");
    await fetchTiers();
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-2 border-[#468AD1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Badge Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure agent verification badge tiers, prices, features, and auto-assignment rules.
        </p>
      </div>

      {/* Quick Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <FiSettings className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">How badges work</p>
          <p className="text-blue-700 mt-1">
            <strong>Verified</strong> badges are free and auto-assigned when agents meet the minimum listing threshold.
            <strong> Trusted</strong> and <strong>Elite</strong> badges require M-Pesa payment from agents.
            Toggle &quot;Auto-assign&quot; to control which tier gets automatically assigned.
          </p>
        </div>
      </div>

      {/* Badge Tier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiers
          .filter((t) => t.tier !== "NONE")
          .map((tier) => (
            <div key={tier.id}>
              {editingId === tier.id ? (
                <BadgeEditForm
                  tier={tier}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="relative">
                  <BadgePreviewCard tier={tier} />
                  <button
                    onClick={() => setEditingId(tier.id)}
                    className="absolute top-4 right-4 p-2 bg-white/90 rounded-lg shadow-sm hover:bg-white transition-colors text-gray-600 hover:text-[#468AD1]"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Badge Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Tier</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Price</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Features</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Auto-assign</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tiers
                .filter((t) => t.tier !== "NONE")
                .map((tier) => {
                  const gradient = TIER_GRADIENTS[tier.tier as BadgeTier] || "from-gray-500 to-gray-600";
                  const icon = TIER_ICONS[tier.tier as BadgeTier];
                  return (
                    <tr key={tier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
                            <span className="scale-75">{icon}</span>
                          </div>
                          <span className="font-medium text-gray-900">{tier.tier}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{tier.name}</td>
                      <td className="px-6 py-4">
                        {tier.price === 0 ? (
                          <span className="text-emerald-600 font-semibold">FREE</span>
                        ) : (
                          <span className="text-gray-900 font-medium">KES {tier.price.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{tier.features.length} features</td>
                      <td className="px-6 py-4">
                        {tier.autoAssignEnabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            <FiCheckCircle className="w-3 h-3" />
                            Yes ({tier.minListings}+ listings)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tier.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingId(tier.id)}
                          className="text-gray-400 hover:text-[#468AD1] transition-colors"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
