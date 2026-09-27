"use client";

import { useState, useEffect } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiInfo,
  FiArrowRight,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

interface ApprovalStatus {
  role: string;
  approvals: Array<{
    id: string;
    status: string;
    phone: string;
    company: string;
    reviewNotes: string | null;
    reviewedAt: string | null;
    createdAt: string;
  }>;
}

interface ApprovalForm {
  phone: string;
  company: string;
  licenseNumber: string;
  experience: string;
  specialization: string;
  message: string;
}

export default function AgentApprovalStatus() {
  const [status, setStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ApprovalForm>({
    phone: "",
    company: "",
    licenseNumber: "",
    experience: "",
    specialization: "",
    message: "",
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/crm/agent-approval");
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setStatus(data);
    } catch {
      toast.error("Failed to load approval status");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/crm/agent-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");

      toast.success("Application submitted successfully!");
      setShowForm(false);
      fetchStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="h-8 w-8 border-2 border-[#468AD1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const latestApproval = status?.approvals?.[0];
  const hasPendingRequest = latestApproval?.status === "PENDING";
  const isApproved = status?.role === "AGENT";

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className={`rounded-lg p-6 border ${
        isApproved
          ? "bg-green-50 border-green-200"
          : hasPendingRequest
          ? "bg-yellow-50 border-yellow-200"
          : latestApproval?.status === "REJECTED"
          ? "bg-red-50 border-red-200"
          : "bg-blue-50 border-blue-200"
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${
            isApproved ? "bg-green-100" : hasPendingRequest ? "bg-yellow-100" : latestApproval?.status === "REJECTED" ? "bg-red-100" : "bg-blue-100"
          }`}>
            {isApproved ? (
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            ) : hasPendingRequest ? (
              <FiClock className="w-6 h-6 text-yellow-600" />
            ) : latestApproval?.status === "REJECTED" ? (
              <FiXCircle className="w-6 h-6 text-red-600" />
            ) : (
              <FiInfo className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${
              isApproved ? "text-green-900" : hasPendingRequest ? "text-yellow-900" : latestApproval?.status === "REJECTED" ? "text-red-900" : "text-blue-900"
            }`}>
              {isApproved
                ? "You are a Listed Agent"
                : hasPendingRequest
                ? "Application Under Review"
                : latestApproval?.status === "REJECTED"
                ? "Application Not Approved"
                : "Become a VectorAfriq Agent"
              }
            </h3>
            <p className={`mt-1 text-sm ${
              isApproved ? "text-green-700" : hasPendingRequest ? "text-yellow-700" : latestApproval?.status === "REJECTED" ? "text-red-700" : "text-blue-700"
            }`}>
              {isApproved
                ? "You can create property listings and manage your properties."
                : hasPendingRequest
                ? `Your application was submitted on ${new Date(latestApproval.createdAt).toLocaleDateString()}. We will review it and notify you via email.`
                : latestApproval?.status === "REJECTED"
                ? "Your previous application was not approved. You can update your profile and reapply."
                : "Apply to become a listed agent on VectorAfriq. Once approved, you can create property listings."
              }
            </p>
            {!isApproved && !hasPendingRequest && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] font-medium text-sm transition-colors"
              >
                Apply Now <FiArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Agent Application</h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>

              <p className="text-sm text-gray-600">
                Fill out the form below to apply as a VectorAfriq agent. Fields marked with * are required.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1]"
                  placeholder="+254 7XX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company / Agency Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1]"
                  placeholder="e.g. XYZ Real Estate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1]"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="text"
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1]"
                  placeholder="e.g. 5 years"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1]"
                  placeholder="e.g. Residential, Commercial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message to Admin
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#468AD1]"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] font-medium text-sm disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application History */}
      {status?.approvals && status.approvals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application History</h3>
          <div className="space-y-3">
            {status.approvals.map((approval) => (
              <div key={approval.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        approval.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : approval.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {approval.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {approval.company} &bull; {approval.phone}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Submitted {new Date(approval.createdAt).toLocaleString()}
                      {approval.reviewedAt && ` &bull; Reviewed ${new Date(approval.reviewedAt).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                {approval.reviewNotes && (
                  <div className="mt-3 bg-gray-50 rounded p-3">
                    <p className="text-xs font-medium text-gray-500">Review Notes:</p>
                    <p className="text-sm text-gray-700 mt-1">{approval.reviewNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
