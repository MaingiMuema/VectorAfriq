"use client";

import { useEffect } from "react";
import { FiMapPin, FiX } from "react-icons/fi";
import { NeighborhoodGuideEditor } from "./NeighborhoodGuideEditor";

export interface GuideModalData {
  id?: string;
  initialData?: {
    title?: string;
    excerpt?: string | null;
    content?: string;
    locationType?: "county" | "city" | "neighborhood";
    countyId?: string;
    cityId?: string | null;
    neighborhoodId?: string | null;
    categories?: string[];
    bedrooms?: string[] | null;
    listingTypes?: string[] | null;
  };
}

interface NeighborhoodGuideModalProps {
  open: boolean;
  guide?: GuideModalData;
  /** Human-readable label of the search location the guide is being created
   *  on (e.g. "Nairobi, Westlands"). Shown only when creating, to make clear
   *  the guide will appear on this page. */
  placementLabel?: string;
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * Modal wrapper that renders the full NeighborhoodGuideEditor inline on a
 * public display page. Only ever rendered for admins — regular users never
 * see this component.
 */
export default function NeighborhoodGuideModal({
  open,
  guide,
  placementLabel,
  onClose,
  onSaved,
}: NeighborhoodGuideModalProps) {
  // Lock body scroll while the modal is open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {guide?.id
                ? "Edit Neighborhood Guide"
                : "Add Neighborhood Guide"}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close guide editor"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Placement context (new guides only) */}
          {!guide?.id && placementLabel && (
            <div className="px-6 py-3 bg-blue-50/80 border-b border-blue-100">
              <p className="text-sm text-blue-900 flex items-start gap-2">
                <FiMapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  This guide will appear on{" "}
                  <strong className="font-semibold">{placementLabel}</strong>{" "}
                  search results.
                </span>
              </p>
            </div>
          )}

          {/* Editor */}
          <div className="p-4 sm:p-6 bg-gray-50 max-h-[calc(100vh-120px)] overflow-y-auto">
            <NeighborhoodGuideEditor
              id={guide?.id || "new"}
              inline
              initialData={guide?.initialData}
              onSaved={onSaved}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
