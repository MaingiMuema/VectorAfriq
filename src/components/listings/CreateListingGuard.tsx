"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiClock, FiCheckCircle, FiAlertTriangle, FiArrowRight } from "react-icons/fi";

interface CreateListingGuardProps {
  // Component fetches approval status internally
}

export default function CreateListingGuard(_props: CreateListingGuardProps) {
  const [approvalStatus, setApprovalStatus] = useState<{
    hasPending: boolean;
    hasRejected: boolean;
    latestNotes: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/agent-approval")
      .then((res) => res.json())
      .then((data) => {
        const approvals = data.approvals || [];
        const pending = approvals.find((a: { status: string }) => a.status === "PENDING");
        const rejected = approvals.find((a: { status: string }) => a.status === "REJECTED");
        setApprovalStatus({
          hasPending: !!pending,
          hasRejected: !!rejected,
          latestNotes: rejected?.reviewNotes || null,
        });
      })
      .catch(() => {
        // Default to showing apply UI on error
        setApprovalStatus({ hasPending: false, hasRejected: false, latestNotes: null });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex justify-center items-center h-64">
        <div className="h-8 w-8 border-2 border-[#468AD1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {approvalStatus?.hasPending ? (
        /* Pending Application */
        <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiClock className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Application Under Review
          </h2>
          <p className="text-gray-600 mb-6">
            Your agent application is currently being reviewed by our admin team.
            You will receive an email notification once a decision has been made.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>What happens next?</strong><br />
              Our team will review your profile and credentials. This typically takes 1-2 business days.
            </p>
          </div>
          <Link
            href="/crm/user-profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
          >
            View Application Status <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* No Application / Rejected */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            approvalStatus?.hasRejected ? "bg-red-100" : "bg-blue-100"
          }`}>
            {approvalStatus?.hasRejected ? (
              <FiAlertTriangle className="w-8 h-8 text-red-600" />
            ) : (
              <FiCheckCircle className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {approvalStatus?.hasRejected
              ? "Application Not Approved"
              : "Become a VectorAfriq Agent"
            }
          </h2>
          <p className="text-gray-600 mb-4">
            {approvalStatus?.hasRejected
              ? "Your previous agent application was not approved. You can update your profile and submit a new application."
              : "To create property listings, you need to become an approved VectorAfriq agent. It only takes a minute to apply."
            }
          </p>
          {approvalStatus?.hasRejected && approvalStatus.latestNotes && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-red-800 mb-1">Admin Notes:</p>
              <p className="text-sm text-red-700">{approvalStatus.latestNotes}</p>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong>Becoming an agent gives you:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              <li className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-blue-500" /> Create and manage property listings
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-blue-500" /> Appear in agent directories
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-blue-500" /> Get matched with potential clients
              </li>
            </ul>
          </div>
          <Link
            href="/crm/user-profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] font-medium transition-colors"
          >
            Apply Now <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
