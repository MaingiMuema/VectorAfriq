"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiCheck,
  FiUpload,
  FiCreditCard,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface Plan {
  id: string;
  tierId: string;
  name: string;
  listingLimit: number;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  isActive: boolean;
}

interface Tier {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  features: string[];
  visibilityPercent: number;
  bgGradient: string | null;
  plans: Plan[];
}

interface PaymentSettings {
  tillNumber: string;
  tillName: string;
  instructions: string;
}

interface ListingStatus {
  listingQuota: number;
  listingCount: number;
  remaining: number;
  rateCardTier: string;
  rateCardExpiresAt: string | null;
  canCreateListing: boolean;
  isExpired: boolean;
}

interface Subscription {
  id: string;
  planName: string | null;
  tierSlug: string;
  billingCycle: string;
  amount: number;
  listingLimit: number;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  adminNotes: string | null;
}

type BillingCycle = "MONTHLY" | "ANNUAL";

function formatKes(n: number) {
  return `KSh ${Number(n).toLocaleString("en-KE")}`;
}

const tierColors: Record<string, string> = {
  SILVER: "from-slate-600 to-slate-800",
  GOLD: "from-amber-700 to-amber-900",
  PLATINUM: "from-violet-600 to-purple-800",
};

export default function CRMRateCardsPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(
    null
  );
  const [listingStatus, setListingStatus] = useState<ListingStatus | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");

  // Checkout
  const [selectedPlan, setSelectedPlan] = useState<{
    plan: Plan;
    tier: Tier;
  } | null>(null);
  const [mpesaCode, setMpesaCode] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cardsRes, subRes] = await Promise.all([
        fetch("/api/rate-cards"),
        fetch("/api/crm/rate-card-subscription"),
      ]);
      if (cardsRes.ok) {
        const data = await cardsRes.json();
        setTiers(data.tiers || []);
        setPaymentSettings(data.paymentSettings || null);
      }
      if (subRes.ok) {
        const data = await subRes.json();
        setListingStatus(data.listingStatus || null);
        setSubscriptions(data.subscriptions || []);
        if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load rate cards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleProofUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("propertyId", "rate-card-payments");
      const res = await fetch("/api/crm/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const uploaded = data.files?.[0];
      const filename =
        uploaded?.filename ||
        uploaded?.name ||
        (typeof uploaded === "string" ? uploaded : null);
      const directUrl = uploaded?.url || uploaded?.path || data.url || data.path;

      let proof = "";
      if (typeof directUrl === "string" && directUrl.startsWith("http")) {
        proof = directUrl;
      } else if (typeof directUrl === "string" && directUrl.startsWith("/")) {
        proof = directUrl;
      } else if (filename) {
        proof = `/api/images/serve/rate-card-payments/${filename}`;
      }

      if (!proof) throw new Error("No URL returned from upload");
      setProofUrl(proof);
      toast.success("Payment proof uploaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload proof");
    } finally {
      setUploading(false);
    }
  };

  const submitSubscription = async () => {
    if (!selectedPlan) return;
    if (!proofUrl) {
      toast.error("Please upload payment proof");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/crm/rate-card-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.plan.id,
          billingCycle,
          proofUrl,
          mpesaCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      toast.success(data.message || "Submitted for review");
      setSelectedPlan(null);
      setProofUrl("");
      setMpesaCode("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const priceOf = (plan: Plan) =>
    billingCycle === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice;

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading rate cards...</div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rate Cards</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose a Silver, Gold, or Platinum plan. Higher tiers get more search
          visibility and larger listing allowances.
        </p>
      </div>

      {/* Current status */}
      {listingStatus && (
        <div className="bg-white border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Current tier</p>
            <p className="text-lg font-semibold text-gray-900">
              {listingStatus.rateCardTier === "NONE"
                ? "Free / none"
                : listingStatus.rateCardTier}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Listings used</p>
            <p className="text-lg font-semibold text-gray-900">
              {listingStatus.listingCount} / {listingStatus.listingQuota}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Remaining</p>
            <p
              className={`text-lg font-semibold ${
                listingStatus.remaining === 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {listingStatus.remaining}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Plan expires</p>
            <p className="text-lg font-semibold text-gray-900">
              {listingStatus.rateCardExpiresAt
                ? new Date(listingStatus.rateCardExpiresAt).toLocaleDateString()
                : "—"}
            </p>
          </div>
          {!listingStatus.canCreateListing && (
            <div className="sm:col-span-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
              <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                You have reached your listing limit. Subscribe to a higher plan
                below to unlock more listings.{" "}
                <Link href="/crm/create-listing" className="underline font-medium">
                  Create listing
                </Link>{" "}
                will be blocked until you upgrade.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          {(["MONTHLY", "ANNUAL"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setBillingCycle(c)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === c
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600"
              }`}
            >
              {c === "MONTHLY" ? "Monthly" : "Annual"}
              {c === "ANNUAL" && (
                <span className="ml-1 text-xs text-green-600">Save ~2 mo</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="bg-white rounded-xl shadow-lg border overflow-hidden flex flex-col"
          >
            <div
              className={`bg-gradient-to-r ${tierColors[tier.slug]} text-white p-6 text-center`}
            >
              <h2 className="text-2xl font-bold uppercase tracking-wide">
                {tier.name}
              </h2>
              {tier.subtitle && (
                <p className="text-sm mt-1 text-white">{tier.subtitle}</p>
              )}
              <p className="mt-3 text-sm font-medium bg-black/25 inline-block px-3 py-1 rounded-full">
                {tier.visibilityPercent}% search visibility share
              </p>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              {tier.description && (
                <p className="text-sm text-gray-600 mb-3">{tier.description}</p>
              )}
              {tier.features?.length > 0 && (
                <ul className="space-y-1.5 mb-4">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-gray-700">
                      <FiCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto space-y-3">
                {(tier.plans || []).map((plan) => (
                  <div
                    key={plan.id}
                    className="border rounded-lg p-3 hover:border-[#468AD1]/40 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {plan.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Up to {plan.listingLimit} property listings
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatKes(priceOf(plan))}
                        </p>
                        <p className="text-xs text-gray-400">
                          /{billingCycle === "ANNUAL" ? "year" : "month"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan({ plan, tier })}
                      className="mt-3 w-full py-2 rounded-lg bg-[#468AD1] hover:bg-[#2F6FAE] text-white text-sm font-medium"
                    >
                      Subscribe
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* History */}
      {subscriptions.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Your subscriptions</h3>
          </div>
          <div className="divide-y">
            {subscriptions.map((s) => (
              <div
                key={s.id}
                className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {s.planName || s.tierSlug} · {s.billingCycle}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatKes(s.amount)} · {s.listingLimit} listings ·{" "}
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    s.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : s.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {s.status === "PENDING" && <FiClock className="w-3 h-3" />}
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {selectedPlan && paymentSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                Subscribe · {selectedPlan.tier.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedPlan.plan.name} ·{" "}
                {formatKes(priceOf(selectedPlan.plan))} /{" "}
                {billingCycle === "ANNUAL" ? "year" : "month"}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                  <FiCreditCard className="w-5 h-5" />
                  Pay via M-Pesa
                </div>
                <p className="text-sm text-green-900 mb-3">
                  {paymentSettings.instructions}
                </p>
                <div className="bg-white rounded-lg p-4 text-center border border-green-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Till / Paybill
                  </p>
                  <p className="text-3xl font-bold text-gray-900 tracking-wider mt-1">
                    {paymentSettings.tillNumber}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {paymentSettings.tillName}
                  </p>
                  <p className="text-sm font-semibold text-[#468AD1] mt-3">
                    Amount: {formatKes(priceOf(selectedPlan.plan))}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  M-Pesa confirmation code (optional)
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. QJI7XXXX"
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload payment proof *
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-[#468AD1] transition-colors">
                  <FiUpload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {uploading
                      ? "Uploading..."
                      : proofUrl
                        ? "Replace screenshot"
                        : "Click to upload screenshot"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProofUpload(file);
                    }}
                  />
                </label>
                {proofUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={proofUrl}
                    alt="Proof"
                    className="mt-2 max-h-40 rounded-lg border object-contain w-full bg-gray-50"
                  />
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(null);
                    setProofUrl("");
                    setMpesaCode("");
                  }}
                  className="flex-1 py-2.5 border rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || !proofUrl}
                  onClick={submitSubscription}
                  className="flex-1 py-2.5 bg-[#468AD1] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit for approval"}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                An admin will review your payment and activate your plan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
