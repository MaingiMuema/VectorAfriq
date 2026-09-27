"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiFlag, FiX, FiLoader } from "react-icons/fi";
import { toast } from "sonner";

import { REPORT_REASONS } from "@/lib/reportConstants";

interface ReportButtonProps {
  propertyId: string;
  propertyTitle: string;
  className?: string;
}

export default function ReportButton({
  propertyId,
  propertyTitle,
  className = "",
}: ReportButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      router.push(
        `/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    if (!reason) {
      toast.error("Please select a reason for your report");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: propertyId,
          reason,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      setIsSubmitted(true);
      toast.success("Report submitted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpen = () => {
    if (status === "unauthenticated") {
      router.push(
        `/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    setIsOpen(true);
    setIsSubmitted(false);
    setReason("");
    setDescription("");
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsSubmitted(false);
    setReason("");
    setDescription("");
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors ${className}`}
        title="Report this listing"
      >
        <FiFlag className="w-4 h-4" />
        <span>Report</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <FiFlag className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Report Listing
                  </h3>
                  <p className="text-xs text-gray-500 truncate max-w-[220px]">
                    {propertyTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 overflow-y-auto min-h-0">
              {isSubmitted ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Report Submitted
                  </h4>
                  <p className="text-sm text-gray-500 mb-1">
                    Thank you for helping us keep VectorAfriq safe.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    A confirmation email has been sent to your inbox. Our team
                    will review your report and notify you of the outcome.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why are you reporting this listing?
                    </label>
                    <div className="space-y-2">
                      {REPORT_REASONS.map((r) => (
                        <label
                          key={r}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            reason === r
                              ? "border-red-500 bg-red-50 ring-1 ring-red-500"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={r}
                            checked={reason === r}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="text-sm text-gray-700">{r}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional details{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Provide any additional context that may help us review this report..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none transition-colors placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {description.length}/1000
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!reason || isSubmitting}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Report"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
