"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiSave,
  FiX,
  FiCreditCard,
  FiSettings,
  FiCheck,
  FiEye,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

interface Plan {
  id: string;
  tierId: string;
  name: string;
  listingLimit: number;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  sortOrder: number;
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
  sortOrder: number;
  isActive: boolean;
  bgGradient: string | null;
  accentColor: string | null;
  plans: Plan[];
}

interface PaymentSettings {
  tillNumber: string;
  tillName: string;
  instructions: string;
}

interface PaymentRow {
  id: string;
  userName: string | null;
  userEmail: string | null;
  planName: string | null;
  tierSlug: string;
  billingCycle: string;
  amount: number;
  listingLimit: number;
  proofUrl: string | null;
  mpesaCode: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

type Tab = "cards" | "payments" | "settings";

function formatKes(n: number) {
  return `KSh ${Number(n).toLocaleString("en-KE")}`;
}

export default function AgentRateCardsPage() {
  const [tab, setTab] = useState<Tab>("cards");
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    tillNumber: "",
    tillName: "",
    instructions: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Plan editor
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> & { tierId: string } | null>(null);
  // Tier editor
  const [editingTier, setEditingTier] = useState<Partial<Tier> | null>(null);

  // Payments
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [paymentCounts, setPaymentCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/rate-cards");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTiers(data.tiers || []);
      if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load rate cards");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        status: paymentStatus,
        limit: "30",
      });
      const res = await fetch(`/api/admin/rate-card-payments?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPayments(data.payments || []);
      setPaymentCounts(data.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch {
      toast.error("Failed to load payments");
    }
  }, [paymentStatus]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    if (tab === "payments") fetchPayments();
  }, [tab, fetchPayments]);

  const saveTier = async () => {
    if (!editingTier) return;
    setSaving(true);
    try {
      const isNew = !editingTier.id;
      const res = await fetch("/api/admin/rate-cards", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "tier",
          ...editingTier,
          features: editingTier.features || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(isNew ? "Tier created" : "Tier updated");
      setEditingTier(null);
      fetchCards();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save tier");
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async () => {
    if (!editingPlan?.tierId) return;
    setSaving(true);
    try {
      const isNew = !editingPlan.id;
      const res = await fetch("/api/admin/rate-cards", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "plan",
          ...editingPlan,
          features: editingPlan.features || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(isNew ? "Plan created" : "Plan updated");
      setEditingPlan(null);
      fetchCards();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    const res = await fetch(`/api/admin/rate-cards?kind=plan&id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to delete plan");
      return;
    }
    toast.success("Plan deleted");
    fetchCards();
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/rate-cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "settings", ...paymentSettings }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Payment settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentAction = async (action: "APPROVE" | "REJECT") => {
    if (!selectedPayment) return;
    setProcessingId(selectedPayment.id);
    try {
      const res = await fetch("/api/admin/rate-card-payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPayment.id,
          action,
          adminNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(data.message || "Updated");
      setSelectedPayment(null);
      setAdminNotes("");
      fetchPayments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setProcessingId(null);
    }
  };

  const tierColors: Record<string, string> = {
    SILVER: "from-slate-600 to-slate-800",
    GOLD: "from-amber-700 to-amber-900",
    PLATINUM: "from-violet-600 to-purple-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rate Cards</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure Silver / Gold / Platinum tiers, pricing plans, search
          visibility share, and review agent payment proofs.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {(
            [
              { id: "cards" as const, label: "Tiers & Plans", icon: FiCreditCard },
              {
                id: "payments" as const,
                label: "Payment Reviews",
                icon: FiCheck,
                badge: paymentCounts.pending,
              },
              { id: "settings" as const, label: "Till & Settings", icon: FiSettings },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium ${
                tab === t.id
                  ? "border-[#468AD1] text-[#468AD1]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {"badge" in t && t.badge > 0 && (
                <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 inline-flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {loading && tab === "cards" ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : null}

      {/* ============ CARDS TAB ============ */}
      {tab === "cards" && !loading && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`bg-white rounded-xl shadow border overflow-hidden ${
                  !tier.isActive ? "opacity-60" : ""
                }`}
              >
                <div
                  className={`bg-gradient-to-r ${tierColors[tier.slug] || "from-gray-600 to-gray-800"} text-white p-5`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold">{tier.name}</h3>
                      {tier.subtitle && (
                        <p className="text-sm text-white mt-0.5">{tier.subtitle}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingTier({ ...tier })}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
                      title="Edit tier"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <span className="bg-black/25 text-white font-medium px-2 py-0.5 rounded">
                      Visibility {tier.visibilityPercent}%
                    </span>
                    <span className="bg-black/25 text-white font-medium px-2 py-0.5 rounded">
                      {tier.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {tier.description && (
                    <p className="text-sm text-gray-600">{tier.description}</p>
                  )}
                  {tier.features?.length > 0 && (
                    <ul className="text-xs text-gray-500 space-y-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex gap-1.5">
                          <FiCheck className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-gray-800">Plans</h4>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingPlan({
                            tierId: tier.id,
                            name: "",
                            listingLimit: 10,
                            monthlyPrice: 0,
                            annualPrice: 0,
                            features: [],
                            sortOrder: (tier.plans?.length || 0) + 1,
                            isActive: true,
                          })
                        }
                        className="text-xs text-[#468AD1] font-medium flex items-center gap-1"
                      >
                        <FiPlus className="w-3.5 h-3.5" /> Add plan
                      </button>
                    </div>
                    {(tier.plans || []).map((plan) => (
                      <div
                        key={plan.id}
                        className="border rounded-lg p-3 flex justify-between gap-2 hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {plan.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Up to {plan.listingLimit} listings
                          </p>
                          <p className="text-sm text-gray-800 mt-1">
                            {formatKes(plan.monthlyPrice)}
                            <span className="text-xs text-gray-400">/mo</span>
                            {" · "}
                            {formatKes(plan.annualPrice)}
                            <span className="text-xs text-gray-400">/yr</span>
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingPlan({ ...plan })}
                            className="p-1.5 text-gray-500 hover:text-[#468AD1]"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePlan(plan.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(tier.plans || []).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        No plans yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ PAYMENTS TAB ============ */}
      {tab === "payments" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pending", key: "pending", color: "text-yellow-600", bg: "bg-yellow-50" },
              { label: "Approved", key: "approved", color: "text-green-600", bg: "bg-green-50" },
              { label: "Rejected", key: "rejected", color: "text-red-600", bg: "bg-red-50" },
            ].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setPaymentStatus(c.key.toUpperCase())}
                className={`${c.bg} rounded-lg p-4 border text-left ${
                  paymentStatus === c.key.toUpperCase()
                    ? "ring-2 ring-[#468AD1]"
                    : ""
                }`}
              >
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>
                  {paymentCounts[c.key as keyof typeof paymentCounts]}
                </p>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPaymentStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  paymentStatus === s
                    ? "bg-[#468AD1] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{p.userName || "—"}</div>
                        <div className="text-xs text-gray-500">{p.userEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{p.planName || p.tierSlug}</div>
                        <div className="text-xs text-gray-500">
                          {p.billingCycle} · {p.listingLimit} listings
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatKes(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : p.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPayment(p);
                            setAdminNotes(p.adminNotes || "");
                          }}
                          className="text-[#468AD1] text-sm font-medium inline-flex items-center gap-1"
                        >
                          <FiEye className="w-4 h-4" /> Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ SETTINGS TAB ============ */}
      {tab === "settings" && (
        <div className="max-w-xl bg-white rounded-xl shadow border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Manual payment (Till)</h2>
          <p className="text-sm text-gray-500">
            Agents will see this till number when subscribing to a rate card plan.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Till / Paybill number
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={paymentSettings.tillNumber}
              onChange={(e) =>
                setPaymentSettings((s) => ({ ...s, tillNumber: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account name
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={paymentSettings.tillName}
              onChange={(e) =>
                setPaymentSettings((s) => ({ ...s, tillName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment instructions
            </label>
            <textarea
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={paymentSettings.instructions}
              onChange={(e) =>
                setPaymentSettings((s) => ({
                  ...s,
                  instructions: e.target.value,
                }))
              }
            />
          </div>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      )}

      {/* Tier edit modal */}
      {editingTier && (
        <Modal title={editingTier.id ? "Edit tier" : "New tier"} onClose={() => setEditingTier(null)}>
          <div className="space-y-3">
            <Field label="Name">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editingTier.name || ""}
                onChange={(e) =>
                  setEditingTier((t) => ({ ...t!, name: e.target.value }))
                }
              />
            </Field>
            <Field label="Subtitle">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editingTier.subtitle || ""}
                onChange={(e) =>
                  setEditingTier((t) => ({ ...t!, subtitle: e.target.value }))
                }
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editingTier.description || ""}
                onChange={(e) =>
                  setEditingTier((t) => ({
                    ...t!,
                    description: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Visibility % (search results share)">
              <input
                type="number"
                min={0}
                max={100}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editingTier.visibilityPercent ?? 0}
                onChange={(e) =>
                  setEditingTier((t) => ({
                    ...t!,
                    visibilityPercent: Number(e.target.value),
                  }))
                }
              />
            </Field>
            <Field label="Features (one per line)">
              <textarea
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={(editingTier.features || []).join("\n")}
                onChange={(e) =>
                  setEditingTier((t) => ({
                    ...t!,
                    features: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editingTier.isActive !== false}
                onChange={(e) =>
                  setEditingTier((t) => ({ ...t!, isActive: e.target.checked }))
                }
              />
              Active
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={saveTier}
                disabled={saving}
                className="flex-1 bg-[#468AD1] text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save tier"}
              </button>
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Plan edit modal */}
      {editingPlan && (
        <Modal title={editingPlan.id ? "Edit plan" : "New plan"} onClose={() => setEditingPlan(null)}>
          <div className="space-y-3">
            <Field label="Name">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editingPlan.name || ""}
                onChange={(e) =>
                  setEditingPlan((p) => ({ ...p!, name: e.target.value }))
                }
              />
            </Field>
            <Field label="Listing limit">
              <input
                type="number"
                min={1}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editingPlan.listingLimit ?? 10}
                onChange={(e) =>
                  setEditingPlan((p) => ({
                    ...p!,
                    listingLimit: Number(e.target.value),
                  }))
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monthly price (KES)">
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={editingPlan.monthlyPrice ?? 0}
                  onChange={(e) => {
                    const monthlyPrice = Number(e.target.value);
                    setEditingPlan((p) => ({
                      ...p!,
                      monthlyPrice,
                      annualPrice:
                        p?.annualPrice && p.annualPrice !== (p.monthlyPrice || 0) * 10
                          ? p.annualPrice
                          : monthlyPrice * 10,
                    }));
                  }}
                />
              </Field>
              <Field label="Annual price (KES)">
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={editingPlan.annualPrice ?? 0}
                  onChange={(e) =>
                    setEditingPlan((p) => ({
                      ...p!,
                      annualPrice: Number(e.target.value),
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="Features (one per line)">
              <textarea
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={(editingPlan.features || []).join("\n")}
                onChange={(e) =>
                  setEditingPlan((p) => ({
                    ...p!,
                    features: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editingPlan.isActive !== false}
                onChange={(e) =>
                  setEditingPlan((p) => ({ ...p!, isActive: e.target.checked }))
                }
              />
              Active
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={savePlan}
                disabled={saving}
                className="flex-1 bg-[#468AD1] text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save plan"}
              </button>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payment review modal */}
      {selectedPayment && (
        <Modal
          title="Review payment"
          onClose={() => {
            setSelectedPayment(null);
            setAdminNotes("");
          }}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <p>
                <strong>Agent:</strong> {selectedPayment.userName} (
                {selectedPayment.userEmail})
              </p>
              <p>
                <strong>Plan:</strong> {selectedPayment.planName} (
                {selectedPayment.tierSlug})
              </p>
              <p>
                <strong>Cycle:</strong> {selectedPayment.billingCycle}
              </p>
              <p>
                <strong>Amount:</strong> {formatKes(selectedPayment.amount)}
              </p>
              <p>
                <strong>Listings:</strong> {selectedPayment.listingLimit}
              </p>
              {selectedPayment.mpesaCode && (
                <p>
                  <strong>M-Pesa code:</strong> {selectedPayment.mpesaCode}
                </p>
              )}
              <p>
                <strong>Status:</strong> {selectedPayment.status}
              </p>
            </div>

            {selectedPayment.proofUrl && (
              <div>
                <p className="text-sm font-medium mb-2">Payment proof</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPayment.proofUrl}
                  alt="Payment proof"
                  className="max-h-64 rounded-lg border object-contain bg-gray-50 w-full"
                />
                <a
                  href={selectedPayment.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#468AD1] mt-1 inline-block"
                >
                  Open full size
                </a>
              </div>
            )}

            {selectedPayment.status === "PENDING" && (
              <>
                <Field label="Admin notes (optional)">
                  <textarea
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </Field>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={processingId === selectedPayment.id}
                    onClick={() => handlePaymentAction("REJECT")}
                    className="flex-1 py-2.5 rounded-lg bg-red-50 text-red-600 font-medium text-sm disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={processingId === selectedPayment.id}
                    onClick={() => handlePaymentAction("APPROVE")}
                    className="flex-1 py-2.5 rounded-lg bg-green-50 text-green-700 font-medium text-sm disabled:opacity-50"
                  >
                    Approve &amp; grant access
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
