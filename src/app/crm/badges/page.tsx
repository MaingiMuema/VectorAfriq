"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  FiCheckCircle,
  FiPhone,
  FiInfo,
} from "react-icons/fi";
import { TIER_GRADIENTS, TIER_COLORS, TIER_ICONS, TIER_ORDER } from "@/lib/badgeConstants";
import type { BadgeTier, BadgeTierConfig } from "@/types";

interface BadgeStatus {
  badgeTier: BadgeTier;
  badgeUpdatedAt: string | null;
  eligibleForVerified: boolean;
  listingCount: number;
  profileComplete: boolean;
  trustedPrice: number;
  elitePrice: number;
  minListings: number;
}



export default function BadgesPage() {
  const [status, setStatus] = useState<BadgeStatus | null>(null);
  const [tiers, setTiers] = useState<BadgeTierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"TRUSTED" | "ELITE" | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, tiersRes] = await Promise.all([
        fetch("/api/crm/agent-badges/status"),
        fetch("/api/badge-tiers"),
      ]);

      if (!statusRes.ok) throw new Error("Failed to fetch badge status");
      const statusData = await statusRes.json();
      setStatus(statusData);

      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTiers(tiersData);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load badge status");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedTier || !phoneNumber) return;

    setPaying(true);
    try {
      const res = await fetch("/api/crm/agent-badges/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeTier: selectedTier, phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      toast.success("M-Pesa prompt sent! Please complete the payment on your phone.");
      setShowPayModal(false);
      setPhoneNumber("");
      setSelectedTier(null);

      // Poll for status update after a delay
      setTimeout(fetchData, 5000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate payment");
    } finally {
      setPaying(false);
    }
  };

  const initiateUpgrade = (tier: "TRUSTED" | "ELITE") => {
    setSelectedTier(tier);
    setShowPayModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-2 border-[#468AD1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!status) return null;

  const currentColors = TIER_COLORS[status.badgeTier];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Badges</h1>
        <p className="text-sm text-gray-500 mt-1">
          Build trust with buyers through VectorAfriq&apos;s verification badges
        </p>
      </div>

      {/* Current Badge Card */}
      <div className={`rounded-xl p-6 border-2 ${currentColors.bg} ${currentColors.border}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TIER_GRADIENTS[status.badgeTier]} flex items-center justify-center text-white shadow-lg`}>
            {TIER_ICONS[status.badgeTier]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className={`text-xl font-bold ${currentColors.text}`}>
                {status.badgeTier === "NONE" ? "No Badge" : status.badgeTier} Badge
              </h2>
              {status.badgeUpdatedAt && (
                <span className="text-xs text-gray-500 bg-white/80 px-2 py-0.5 rounded-full">
                  Since{" "}
                  {new Date(status.badgeUpdatedAt).toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {tiers.find((t) => t.tier === status.badgeTier)?.description ||
                "Complete your profile and add listings to get verified"}
            </p>

            {/* Eligibility progress */}
            {status.badgeTier === "NONE" && (
              <div className="mt-4 bg-white/80 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Requirements for Verified Badge
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {status.profileComplete ? (
                      <FiCheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={`text-sm ${status.profileComplete ? "text-green-700" : "text-gray-600"}`}>
                      Complete profile (name, phone, photo)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {status.listingCount >= status.minListings ? (
                      <FiCheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={`text-sm ${status.listingCount >= status.minListings ? "text-green-700" : "text-gray-600"}`}>
                      At least {status.minListings} active listings
                      {status.listingCount > 0 && ` (you have ${status.listingCount})`}
                    </span>
                  </div>
                </div>
                {status.eligibleForVerified && (
                  <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium">
                      🎉 You&apos;re eligible! The Verified badge will be assigned automatically.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badge Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers
          .filter((t) => t.tier !== "NONE" && t.isActive)
          .map((tier) => {
            const isActive = TIER_ORDER[status.badgeTier] >= TIER_ORDER[tier.tier];
            const colors = TIER_COLORS[tier.tier];
            const canUpgrade =
              tier.tier === "TRUSTED"
                ? TIER_ORDER[status.badgeTier] >= TIER_ORDER.VERIFIED
                : tier.tier === "ELITE"
                ? TIER_ORDER[status.badgeTier] >= TIER_ORDER.TRUSTED
                : false;

            return (
              <div
                key={tier.id}
                className={`rounded-xl p-5 border-2 transition-all ${
                  isActive
                    ? `${colors.border} ${colors.bg} ring-2 ${colors.ring}`
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {/* Header with gradient badge */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${TIER_GRADIENTS[tier.tier]} flex items-center justify-center text-white shadow-md`}>
                    <span className="scale-90">{TIER_ICONS[tier.tier]}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{tier.name}</h3>
                    {tier.subtitle && (
                      <p className="text-xs text-gray-500">{tier.subtitle}</p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-1.5 text-xs text-gray-600 mb-4">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className={`w-1 h-1 rounded-full bg-gradient-to-br ${TIER_GRADIENTS[tier.tier]} flex-shrink-0`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Price & Action */}
                <div className="pt-3 border-t">
                  {isActive ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${colors.text}`}>✓ Active</span>
                    </div>
                  ) : tier.price === 0 ? (
                    <span className="text-sm font-bold text-emerald-600">FREE</span>
                  ) : (
                    <button
                      onClick={() => initiateUpgrade(tier.tier as "TRUSTED" | "ELITE")}
                      disabled={!canUpgrade}
                      className={`w-full px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${TIER_GRADIENTS[tier.tier]} hover:shadow-md`}
                    >
                      Upgrade – KES {tier.price.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Info note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiInfo className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-600">
              Badges are a one-time purchase. Once upgraded, your badge remains
              active permanently. Badge prices and features are configured by the site
              administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && selectedTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Upgrade to {tiers.find((t) => t.tier === selectedTier)?.name || selectedTier}
                </h2>
                <button
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedTier(null);
                    setPhoneNumber("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className={`rounded-lg p-4 mb-4 bg-gradient-to-r ${TIER_GRADIENTS[selectedTier]} text-white`}>
                <div className="flex items-center gap-2">
                  <span className="scale-110">{TIER_ICONS[selectedTier]}</span>
                  <div>
                    <p className="font-semibold">
                      {tiers.find((t) => t.tier === selectedTier)?.name || selectedTier} Badge
                    </p>
                    <p className="text-xs opacity-90">
                      {tiers.find((t) => t.tier === selectedTier)?.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">One-time fee</span>
                  <span className="text-lg font-bold text-gray-900">
                    KES{" "}
                    {(
                      selectedTier === "TRUSTED"
                        ? status.trustedPrice
                        : status.elitePrice
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="07XX XXX XXX"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You&apos;ll receive an M-Pesa STK prompt to complete payment
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedTier(null);
                    setPhoneNumber("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={!phoneNumber || paying}
                  className="flex-1 px-4 py-2.5 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paying ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiPhone className="w-4 h-4" />
                      Pay with M-Pesa
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
