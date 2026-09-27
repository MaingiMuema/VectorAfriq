"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiEdit3,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiMapPin,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  deleteGuide,
  setGuidePublished,
} from "@/lib/neighborhoodGuideAdmin";
import NeighborhoodGuideModal, {
  type GuideModalData,
} from "./NeighborhoodGuideModal";

interface GuideDetailAdminActionsProps {
  guideId: string;
  published: boolean;
}

/**
 * Admin-only inline management bar shown on the public guide detail page.
 * Regular users never see this component.
 */
export default function GuideDetailAdminActions({
  guideId,
  published,
}: GuideDetailAdminActionsProps) {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGuide, setModalGuide] = useState<GuideModalData | undefined>(
    undefined
  );

  if (!isAdmin) return null;

  const handleDelete = async () => {
    if (
      !confirm(
        "Delete this guide? This action cannot be undone and the guide will be removed from all pages."
      )
    ) {
      return;
    }
    try {
      await deleteGuide(guideId);
      toast.success("Guide deleted");
      // replace so the back button does not land on the now-404 guide URL
      router.replace("/neighborhood-guides");
      router.refresh();
    } catch {
      toast.error("Failed to delete guide");
    }
  };

  const handleTogglePublish = async () => {
    try {
      const updated = await setGuidePublished(guideId, !published);
      toast.success(
        updated.published ? "Guide published" : "Guide unpublished"
      );
      if (!updated.published) {
        // Unpublished guides are no longer publicly visible
        router.replace("/neighborhood-guides");
      }
      router.refresh();
    } catch {
      toast.error("Failed to update guide status");
    }
  };

  const handleSaved = () => {
    setModalOpen(false);
    setModalGuide(undefined);
    router.refresh();
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3 bg-white border border-[#468AD1]/20 rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mr-auto">
          <span className="w-8 h-8 rounded-lg bg-[#468AD1]/10 flex items-center justify-center">
            <FiMapPin className="w-4 h-4 text-[#468AD1]" />
          </span>
          <div>
            <div>Manage Guide</div>
            <div className="text-xs text-gray-500 font-normal">
              Admin only — changes apply site-wide
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setModalGuide({ id: guideId });
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors text-sm font-medium"
        >
          <FiEdit3 className="w-4 h-4" />
          Edit Guide
        </button>

        <button
          onClick={handleTogglePublish}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          {published ? (
            <>
              <FiEyeOff className="w-4 h-4" />
              Unpublish
            </>
          ) : (
            <>
              <FiEye className="w-4 h-4" />
              Publish
            </>
          )}
        </button>

        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <FiTrash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

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
