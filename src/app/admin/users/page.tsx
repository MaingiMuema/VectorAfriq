"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {
  FiSearch,
  FiTrash2,
  FiUserX,
  FiUserCheck,
  FiUsers,
  FiCheckSquare,
} from "react-icons/fi";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

type Role = "USER" | "ADMIN" | "AGENT";
type Tab = "users" | "approvals";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toast } from "react-hot-toast";
import AgentApprovalsPanel from "./AgentApprovalsPanel";

const LISTING_QUOTA_OPTIONS = [5, 15, 30, 60, 100, 150, 200, 400, 1000] as const;

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  isActive: boolean;
  deactivatedAt: string | null;
  rateCardTier?: string;
  listingQuota?: number;
  rateCardExpiresAt?: string | null;
  createdAt: string;
  image: string | null;
  _count: {
    properties: number;
    favorites: number;
  };
}

const getImageUrl = (avatarUrl: string | null): string => {
  if (!avatarUrl) return "/images/placeholder.png";
  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("/api/images/")) {
    return avatarUrl;
  }
  return `/api/images/profiles/${avatarUrl}`;
};

function UsersManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: Tab =
    tabParam === "approvals" ? "approvals" : "users";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  const [defaultQuota, setDefaultQuota] = useState<number | null>(null);
  const [freeTierCount, setFreeTierCount] = useState<number | null>(null);
  const [defaultQuotaLoading, setDefaultQuotaLoading] = useState(true);
  const [savingDefaultQuota, setSavingDefaultQuota] = useState(false);
  const [applyToExisting, setApplyToExisting] = useState(false);

  const setTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "users") {
      params.delete("tab");
    } else {
      params.set("tab", "approvals");
    }
    const qs = params.toString();
    router.replace(qs ? `/admin/users?${qs}` : "/admin/users", {
      scroll: false,
    });
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(roleFilter !== "ALL" && { role: roleFilter }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch (err) {
      setError("Error loading users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/admin/agent-approvals?status=PENDING&limit=1&page=1"
      );
      if (!res.ok) return;
      const data = await res.json();
      setPendingApprovals(Number(data.counts?.pending || 0));
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [fetchUsers, activeTab]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount, activeTab]);

  const fetchDefaultQuota = useCallback(async () => {
    try {
      setDefaultQuotaLoading(true);
      const res = await fetch("/api/admin/users/default-quota");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setDefaultQuota(data.defaultListingQuota);
      setFreeTierCount(data.freeTierUserCount);
    } catch (err) {
      console.error(err);
    } finally {
      setDefaultQuotaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchDefaultQuota();
  }, [fetchDefaultQuota, activeTab]);

  const saveDefaultQuota = async () => {
    if (defaultQuota === null) return;
    try {
      setSavingDefaultQuota(true);
      const res = await fetch("/api/admin/users/default-quota", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultListingQuota: defaultQuota,
          applyToExisting,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save default quota");
      }
      toast.success(
        applyToExisting && typeof data.updatedUsers === "number"
          ? `Default quota saved and applied to ${data.updatedUsers} free-tier user(s)`
          : "Default listing quota saved"
      );
      setApplyToExisting(false);
      fetchDefaultQuota();
      if (data.updatedUsers) fetchUsers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error saving default quota"
      );
    } finally {
      setSavingDefaultQuota(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: Role) => {
    try {
      setActionLoadingId(userId);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update user role");
      }

      const updatedUser = await res.json();
      setUsers(users.map((user) => (user.id === userId ? updatedUser : user)));
      toast.success("User role updated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error updating user role"
      );
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const updateListingQuota = async (userId: string, listingQuota: number) => {
    try {
      setActionLoadingId(userId);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, listingQuota }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update listing quota");
      }
      setUsers(users.map((user) => (user.id === userId ? data : user)));
      toast.success(`Listing quota set to ${listingQuota}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error updating listing quota"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const updateRateCardTier = async (userId: string, rateCardTier: string) => {
    try {
      setActionLoadingId(userId);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, rateCardTier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update rate card tier");
      }
      setUsers(users.map((user) => (user.id === userId ? data : user)));
      toast.success(`Rate card tier set to ${rateCardTier}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error updating rate card tier"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleUserActive = async (user: User) => {
    const nextActive = !user.isActive;
    const actionLabel = nextActive ? "reactivate" : "deactivate";

    if (
      !confirm(
        nextActive
          ? `Reactivate ${user.name || user.email}? They will be able to sign in again.`
          : `Deactivate ${user.name || user.email}? They will be denied login until reactivated.`
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(user.id);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: nextActive }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${actionLabel} user`);
      }

      setUsers(users.map((u) => (u.id === user.id ? data : u)));
      toast.success(
        nextActive
          ? "User account reactivated successfully"
          : "User account deactivated successfully"
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Error trying to ${actionLabel} user`
      );
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      setActionLoadingId(userId);
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete user");
      }

      setUsers(users.filter((user) => user.id !== userId));
      toast.success("User deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting user");
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage accounts, roles, and agent applications in one place.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="User management tabs">
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`inline-flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "border-[#468AD1] text-[#468AD1]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FiUsers className="w-4 h-4" />
            Users &amp; Agents
          </button>
          <button
            type="button"
            onClick={() => setTab("approvals")}
            className={`inline-flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
              activeTab === "approvals"
                ? "border-[#468AD1] text-[#468AD1]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FiCheckSquare className="w-4 h-4" />
            Agent Approvals
            {pendingApprovals > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                {pendingApprovals}
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === "approvals" ? (
        <AgentApprovalsPanel />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Default listing quota
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Applied to new signups and any user without a paid rate card
                tier.
                {freeTierCount !== null &&
                  ` ${freeTierCount} user(s) currently on the free tier.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={String(defaultQuota ?? 5)}
                onValueChange={(value) => setDefaultQuota(Number(value))}
                disabled={defaultQuotaLoading || savingDefaultQuota}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    new Set([...LISTING_QUOTA_OPTIONS, defaultQuota ?? 5])
                  )
                    .sort((a, b) => a - b)
                    .map((q) => (
                      <SelectItem key={q} value={String(q)}>
                        {q}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={applyToExisting}
                  onChange={(e) => setApplyToExisting(e.target.checked)}
                />
                Apply to existing free-tier users
              </label>
              <button
                type="button"
                onClick={saveDefaultQuota}
                disabled={
                  defaultQuotaLoading || savingDefaultQuota || defaultQuota === null
                }
                className="px-3 py-1.5 bg-[#468AD1] text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {savingDefaultQuota ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative">
              <input
                type="search"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={roleFilter}
                onValueChange={(v) => {
                  setPage(1);
                  setRoleFilter(v);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setPage(1);
                  setStatusFilter(v);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Rate tier
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Listing quota
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Properties
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Joined
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className={!user.isActive ? "bg-red-50/40" : undefined}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="relative h-10 w-10">
                              <Image
                                src={getImageUrl(user.image)}
                                alt={user.name || "User avatar"}
                                fill
                                className="rounded-full object-cover"
                                priority={false}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/images/placeholder.png";
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || "No name"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Select
                            value={user.role}
                            onValueChange={(value: Role) =>
                              updateUserRole(user.id, value)
                            }
                            disabled={actionLoadingId === user.id}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="AGENT">Agent</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                                Deactivated
                              </span>
                              {user.deactivatedAt && (
                                <span className="text-xs text-gray-400">
                                  {new Date(
                                    user.deactivatedAt
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Select
                            value={user.rateCardTier || "NONE"}
                            onValueChange={(value) =>
                              updateRateCardTier(user.id, value)
                            }
                            disabled={actionLoadingId === user.id}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE">None</SelectItem>
                              <SelectItem value="SILVER">Silver</SelectItem>
                              <SelectItem value="GOLD">Gold</SelectItem>
                              <SelectItem value="PLATINUM">Platinum</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Select
                            value={String(user.listingQuota ?? 5)}
                            onValueChange={(value) =>
                              updateListingQuota(user.id, Number(value))
                            }
                            disabled={actionLoadingId === user.id}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from(
                                new Set([
                                  ...LISTING_QUOTA_OPTIONS,
                                  user.listingQuota ?? 5,
                                ])
                              )
                                .sort((a, b) => a - b)
                                .map((q) => (
                                  <SelectItem key={q} value={String(q)}>
                                    {q}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-400 mt-1">
                            {user._count.properties} used
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user._count.properties}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => toggleUserActive(user)}
                              disabled={actionLoadingId === user.id}
                              title={
                                user.isActive
                                  ? "Deactivate account"
                                  : "Reactivate account"
                              }
                              className={
                                user.isActive
                                  ? "text-amber-600 hover:text-amber-800 disabled:opacity-50"
                                  : "text-green-600 hover:text-green-800 disabled:opacity-50"
                              }
                            >
                              {user.isActive ? (
                                <FiUserX className="h-5 w-5" />
                              ) : (
                                <FiUserCheck className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteUser(user.id)}
                              disabled={actionLoadingId === user.id}
                              title="Delete user"
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-gray-500">Loading...</div>
      }
    >
      <UsersManagementContent />
    </Suspense>
  );
}
