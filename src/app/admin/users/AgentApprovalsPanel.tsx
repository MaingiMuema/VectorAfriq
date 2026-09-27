"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiCheck,
  FiX,
  FiUser,
  FiPhone,
  FiBriefcase,
  FiClock,
  FiEye,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

interface Approval {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  phone: string;
  company: string;
  licenseNumber: string | null;
  experience: string | null;
  specialization: string | null;
  message: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface Counts {
  pending: number;
  approved: number;
  rejected: number;
}

export default function AgentApprovalsPanel() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(
    null
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: statusFilter,
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/agent-approvals?${params}`);
      if (!res.ok) throw new Error("Failed to fetch approvals");

      const data = await res.json();
      setApprovals(data.approvals || []);
      setTotalPages(data.pagination?.pages || 1);
      setCounts(data.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load agent approvals");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      const res = await fetch("/api/admin/agent-approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "APPROVED", reviewNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }

      toast.success("Agent application approved successfully");
      setSelectedApproval(null);
      setReviewNotes("");
      fetchApprovals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      const res = await fetch("/api/admin/agent-approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "REJECTED", reviewNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject");
      }

      toast.success("Agent application rejected");
      setSelectedApproval(null);
      setReviewNotes("");
      fetchApprovals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    APPROVED: "bg-green-100 text-green-800 border-green-300",
    REJECTED: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Pending",
            count: counts.pending,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
            filter: "PENDING",
          },
          {
            label: "Approved",
            count: counts.approved,
            color: "text-green-600",
            bg: "bg-green-50",
            filter: "APPROVED",
          },
          {
            label: "Rejected",
            count: counts.rejected,
            color: "text-red-600",
            bg: "bg-red-50",
            filter: "REJECTED",
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              setStatusFilter(item.filter);
              setPage(1);
            }}
            className={`${item.bg} rounded-lg p-4 border text-left transition-shadow hover:shadow-sm ${
              statusFilter === item.filter ? "ring-2 ring-[#468AD1]" : ""
            }`}
          >
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name, email, or company..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-[#468AD1] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Applicant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Applied
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="h-8 w-8 border-2 border-[#468AD1] border-t-transparent rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : approvals.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No agent applications found
                </td>
              </tr>
            ) : (
              approvals.map((approval) => (
                <tr key={approval.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {approval.userName || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {approval.userEmail}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <FiPhone className="w-3 h-3" /> {approval.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {approval.company}
                    </div>
                    {approval.licenseNumber && (
                      <div className="text-xs text-gray-400">
                        License: {approval.licenseNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[approval.status]}`}
                    >
                      {approval.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(approval.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      type="button"
                      onClick={() => setSelectedApproval(approval)}
                      className="text-[#468AD1] hover:text-[#2F6FAE] font-medium flex items-center gap-1 ml-auto"
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

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
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

      {/* Review Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Review Application
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedApproval(null);
                    setReviewNotes("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiUser className="w-4 h-4" /> Applicant Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium">{selectedApproval.userName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">
                        {selectedApproval.userEmail}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{selectedApproval.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Applied:</span>
                      <p className="font-medium">
                        {new Date(
                          selectedApproval.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiBriefcase className="w-4 h-4" /> Professional Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Company:</span>
                      <p className="font-medium">{selectedApproval.company}</p>
                    </div>
                    {selectedApproval.licenseNumber && (
                      <div>
                        <span className="text-gray-500">License #:</span>
                        <p className="font-medium">
                          {selectedApproval.licenseNumber}
                        </p>
                      </div>
                    )}
                    {selectedApproval.experience && (
                      <div>
                        <span className="text-gray-500">Experience:</span>
                        <p className="font-medium">
                          {selectedApproval.experience}
                        </p>
                      </div>
                    )}
                    {selectedApproval.specialization && (
                      <div>
                        <span className="text-gray-500">Specialization:</span>
                        <p className="font-medium">
                          {selectedApproval.specialization}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedApproval.message && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Applicant Message
                    </h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedApproval.message}
                    </p>
                  </div>
                )}

                {selectedApproval.reviewNotes && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <FiClock className="w-4 h-4" /> Previous Review Notes
                    </h3>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">
                      {selectedApproval.reviewNotes}
                    </p>
                    {selectedApproval.reviewedAt && (
                      <p className="text-xs text-blue-600 mt-2">
                        Reviewed on{" "}
                        {new Date(
                          selectedApproval.reviewedAt
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {selectedApproval.status === "PENDING" && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1]"
                      placeholder="Add notes for the applicant..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleReject(selectedApproval.id)}
                      disabled={processing === selectedApproval.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors disabled:opacity-50"
                    >
                      <FiX className="w-4 h-4" />
                      {processing === selectedApproval.id
                        ? "Processing..."
                        : "Reject"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedApproval.id)}
                      disabled={processing === selectedApproval.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition-colors disabled:opacity-50"
                    >
                      <FiCheck className="w-4 h-4" />
                      {processing === selectedApproval.id
                        ? "Processing..."
                        : "Approve"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
