"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiMapPin,
  FiChevronRight,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { processImageUrl } from "@/lib/imageUtils";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  deleteGuide,
  setGuidePublished,
  fetchAllGuides,
  type GuideSummary,
} from "@/lib/neighborhoodGuideAdmin";
import NeighborhoodGuideModal, {
  type GuideModalData,
} from "./NeighborhoodGuideModal";

export interface IndexGuideItem extends GuideSummary {}

function getGuideLocationLabel(guide: IndexGuideItem): string {
  if (guide.neighborhoodName && guide.cityName && guide.countyName) {
    return `${guide.neighborhoodName}, ${guide.cityName}`;
  }
  if (guide.cityName && guide.countyName) {
    return `${guide.cityName}, ${guide.countyName}`;
  }
  return guide.countyName || "";
}

export default function NeighborhoodGuidesIndexGrid({
  initialGuides,
}: {
  initialGuides: IndexGuideItem[];
}) {
  const isAdmin = useIsAdmin();
  const [guides, setGuides] = useState<IndexGuideItem[]>(initialGuides);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGuide, setModalGuide] = useState<GuideModalData | undefined>(
    undefined
  );

  const refresh = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const all = await fetchAllGuides();
      setGuides(all);
    } catch (error) {
      console.error("Failed to refresh guides:", error);
    }
  }, [isAdmin]);

  // When an admin is signed in, load all guides (including drafts) so they
  // can manage everything directly from this page.
  useEffect(() => {
    if (isAdmin) {
      refresh();
    }
  }, [isAdmin, refresh]);

  const openEdit = (guide: IndexGuideItem) => {
    setModalGuide({ id: guide.id });
    setModalOpen(true);
  };

  const handleDelete = async (guide: IndexGuideItem) => {
    if (!confirm(`Delete guide "${guide.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteGuide(guide.id);
      toast.success("Guide deleted");
      refresh();
    } catch {
      toast.error("Failed to delete guide");
    }
  };

  const handleTogglePublish = async (guide: IndexGuideItem) => {
    try {
      const updated = await setGuidePublished(guide.id, !guide.published);
      setGuides((prev) =>
        prev.map((g) => (g.id === guide.id ? { ...g, ...updated } : g))
      );
      toast.success(updated.published ? "Guide published" : "Guide unpublished");
    } catch {
      toast.error("Failed to update guide status");
    }
  };

  const handleSaved = () => {
    setModalOpen(false);
    setModalGuide(undefined);
    refresh();
  };

  return (
    <>
      {/* Admin toolbar */}
      {isAdmin && (
        <div className="mb-6 bg-white border border-[#468AD1]/20 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Manage Guides
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Admin only — edit, unpublish or remove guides directly from this
            page. New guides are created from the search results pages where
            they should appear.
          </p>
        </div>
      )}

      {guides.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <FiMapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Guides Available Yet
          </h2>
          <p className="text-gray-600">
            We&apos;re working on creating comprehensive guides for areas across
            Kenya. Check back soon!
          </p>
          {isAdmin && (
            <p className="mt-6 text-sm text-[#468AD1] font-medium">
              Admins: create guides from the search results pages where you
              want them to appear.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <article
              key={guide.id}
              className="bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col group"
            >
              <Link
                href={`/neighborhood-guide/${guide.slug}`}
                className="group block flex-1"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-200">
                  {guide.image ? (
                    <Image
                      src={processImageUrl(guide.image, guide.id)}
                      alt={guide.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                        !guide.published ? "opacity-60 grayscale" : ""
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#468AD1]/5 to-[#468AD1]/10">
                      <FiMapPin className="w-12 h-12 text-[#468AD1]/30" />
                    </div>
                  )}

                  {/* Location Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-medium text-gray-700 shadow-sm">
                      <FiMapPin className="w-3 h-3" />
                      {guide.locationType === "neighborhood"
                        ? "Neighborhood"
                        : guide.locationType === "city"
                          ? "City"
                          : "County"}
                    </span>
                  </div>

                  {/* Draft badge for admins */}
                  {isAdmin && !guide.published && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2.5 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-medium shadow-sm">
                        Draft
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#468AD1] transition-colors mb-2">
                    {guide.title}
                  </h2>

                  {getGuideLocationLabel(guide) && (
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <FiMapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {getGuideLocationLabel(guide)}
                    </p>
                  )}

                  {guide.excerpt && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                      {guide.excerpt}
                    </p>
                  )}

                  <div className="flex items-center text-sm font-medium text-[#468AD1] group-hover:text-[#2F6FAE] mt-auto">
                    Read Guide
                    <FiChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Admin actions */}
              {isAdmin && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      guide.published
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {guide.published ? (
                      <FiEye className="w-3.5 h-3.5" />
                    ) : (
                      <FiEyeOff className="w-3.5 h-3.5" />
                    )}
                    {guide.published ? "Published" : "Draft"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(guide)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      aria-label={`Edit ${guide.title}`}
                      title="Edit guide"
                    >
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTogglePublish(guide)}
                      className="p-2 text-gray-500 hover:text-[#468AD1] hover:bg-[#468AD1]/10 rounded-lg transition-colors"
                      aria-label={
                        guide.published
                          ? `Unpublish ${guide.title}`
                          : `Publish ${guide.title}`
                      }
                      title={guide.published ? "Unpublish" : "Publish"}
                    >
                      {guide.published ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(guide)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={`Delete ${guide.title}`}
                      title="Delete guide"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Inline editor modal (admin only) */}
      <NeighborhoodGuideModal
        open={modalOpen}
        guide={modalGuide}
        onClose={() => {
          setModalOpen(false);
          setModalGuide(undefined);
        }}
        onSaved={handleSaved}
      />
    </>
  );
}
