"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import NeighborhoodGuideSection, {
  type NeighborhoodGuideItem,
} from "@/components/neighborhood-guides/NeighborhoodGuideSection";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  deleteGuide,
  setGuidePublished,
} from "@/lib/neighborhoodGuideAdmin";
import {
  getBedroomLabel,
  getCategoryLabel,
  normalizeBedroomValue,
  normalizeCategoryValue,
} from "@/lib/search/searchUrl";
import NeighborhoodGuideModal, {
  type GuideModalData,
} from "./NeighborhoodGuideModal";

interface NeighborhoodGuideFetcherProps {
  countyId?: string;
  cityId?: string;
  neighborhoodId?: string;
  category?: string;
  bedrooms?: string;
  listingType?: string;
  locationLabel?: string;
  /** Current search results page – drives guide rotation per page */
  page?: number;
}

/**
 * Client component that fetches neighborhood guides for the current
 * search context and renders the guide section below pagination.
 * Re-fetches when page changes to show different guides per page.
 *
 * For admins it also renders inline management controls (add/edit/delete/
 * publish) directly on the page, pre-filling new guides with the current
 * search context so they appear on exactly this page.
 */
export default function NeighborhoodGuideFetcher({
  countyId,
  cityId,
  neighborhoodId,
  category,
  bedrooms,
  listingType,
  locationLabel,
  page = 1,
}: NeighborhoodGuideFetcherProps) {
  const isAdmin = useIsAdmin();
  const [guides, setGuides] = useState<NeighborhoodGuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGuide, setModalGuide] = useState<GuideModalData | undefined>(
    undefined
  );

  const fetchGuides = useCallback(async () => {
    if (!countyId) {
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ countyId, limit: "4", page: String(page) });
      if (cityId) params.set("cityId", cityId);
      if (neighborhoodId) params.set("neighborhoodId", neighborhoodId);
      if (category) params.set("category", category);
      if (bedrooms) params.set("bedrooms", bedrooms);
      if (listingType) params.set("listingType", listingType);
      if (isAdmin) params.set("admin", "1");

      const res = await fetch(`/api/neighborhood-guides?${params}`);
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides || []);
      }
    } catch (error) {
      console.error("Error fetching neighborhood guides:", error);
    } finally {
      setLoading(false);
    }
  }, [countyId, cityId, neighborhoodId, category, bedrooms, listingType, page, isAdmin]);

  useEffect(() => {
    setLoading(true);
    fetchGuides();
  }, [fetchGuides]);

  // Pre-fill a new guide with the current page's search context. Values are
  // normalized to their canonical form so a guide created from e.g. the
  // "2 Bedroom Apartments in Nairobi" page is tagged with bedrooms ["2"] and
  // will show up on exactly that page (and no other bedroom page).
  const initialData = () => {
    const normalizedCategory = normalizeCategoryValue(category);
    const normalizedBedroom = normalizeBedroomValue(bedrooms);
    const data: GuideModalData["initialData"] = {
      locationType: neighborhoodId
        ? "neighborhood"
        : cityId
          ? "city"
          : "county",
      countyId: countyId || "",
      cityId: cityId || null,
      neighborhoodId: neighborhoodId || null,
      categories: normalizedCategory ? [normalizedCategory] : [],
      bedrooms: normalizedBedroom ? [normalizedBedroom] : null,
      listingTypes: listingType ? [listingType] : null,
    };
    return data;
  };

  // Human-readable filter context for the section title, e.g. "1 Bedroom"
  // or "Bungalows", derived from the same filter values used for matching.
  const normalizedCategoryForLabel = normalizeCategoryValue(category);
  // Align the "5" filter value ("5+ Bedrooms") with the wording shown in the
  // sidebar dropdown; getBedroomLabel alone would render "5 Bedroom".
  const bedroomLabel = bedrooms
    ? normalizeBedroomValue(bedrooms) === "5"
      ? "5+ Bedrooms"
      : getBedroomLabel(bedrooms) || undefined
    : undefined;
  const categoryLabel = normalizedCategoryForLabel
    ? getCategoryLabel(normalizedCategoryForLabel)
    : undefined;

  const openCreate = () => {
    setModalGuide({ initialData: initialData() });
    setModalOpen(true);
  };

  const openEdit = (guide: NeighborhoodGuideItem) => {
    setModalGuide({ id: guide.id });
    setModalOpen(true);
  };

  const handleDelete = async (guide: NeighborhoodGuideItem) => {
    if (!confirm(`Delete guide "${guide.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteGuide(guide.id);
      toast.success("Guide deleted");
      setLoading(true);
      fetchGuides();
    } catch {
      toast.error("Failed to delete guide");
    }
  };

  const handleTogglePublished = async (guide: NeighborhoodGuideItem) => {
    try {
      const updated = await setGuidePublished(guide.id, !guide.published);
      setGuides((prev) =>
        prev.map((g) => (g.id === guide.id ? { ...g, ...updated } : g))
      );
      toast.success(
        updated.published ? "Guide published" : "Guide unpublished"
      );
    } catch {
      toast.error("Failed to update guide status");
    }
  };

  const handleSaved = () => {
    setModalOpen(false);
    setModalGuide(undefined);
    setLoading(true);
    fetchGuides();
  };

  // The guides section is only relevant when a location context exists.
  if (loading || !countyId) {
    return null;
  }

  return (
    <>
      <NeighborhoodGuideSection
        guides={guides}
        locationLabel={locationLabel}
        bedroomLabel={bedroomLabel}
        categoryLabel={categoryLabel}
        isAdmin={isAdmin}
        onAddGuide={openCreate}
        onEditGuide={openEdit}
        onDeleteGuide={handleDelete}
        onTogglePublished={handleTogglePublished}
      />

      <NeighborhoodGuideModal
        open={modalOpen}
        guide={modalGuide}
        placementLabel={locationLabel}
        onClose={() => {
          setModalOpen(false);
          setModalGuide(undefined);
        }}
        onSaved={handleSaved}
      />
    </>
  );
}
