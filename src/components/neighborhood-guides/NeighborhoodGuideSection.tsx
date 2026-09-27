"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FiMapPin,
  FiChevronDown,
  FiChevronUp,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiPlus,
} from "react-icons/fi";
import { processImageUrl } from "@/lib/imageUtils";

export interface NeighborhoodGuideItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  locationType: "county" | "city" | "neighborhood";
  countyName: string;
  cityName: string | null;
  neighborhoodName: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  published?: boolean;
}

interface NeighborhoodGuideSectionProps {
  guides: NeighborhoodGuideItem[];
  title?: string;
  locationLabel?: string;
  /** e.g. "1 Bedroom", "Studio" — included in the section title when the
   *  search results are filtered by bedrooms */
  bedroomLabel?: string;
  /** e.g. "Bungalows", "Apartments" — included in the section title when the
   *  search results are filtered by category */
  categoryLabel?: string;
  /** Admin-only inline management handlers (rendered only when isAdmin) */
  isAdmin?: boolean;
  onAddGuide?: () => void;
  onEditGuide?: (guide: NeighborhoodGuideItem) => void;
  onDeleteGuide?: (guide: NeighborhoodGuideItem) => void;
  onTogglePublished?: (guide: NeighborhoodGuideItem) => void;
}

function getGuideLocationLabel(guide: NeighborhoodGuideItem): string {
  if (guide.neighborhoodName && guide.cityName && guide.countyName) {
    return `${guide.neighborhoodName}, ${guide.cityName}`;
  }
  if (guide.cityName && guide.countyName) {
    return `${guide.cityName}, ${guide.countyName}`;
  }
  return guide.countyName || "";
}

function GuideAccordionItem({
  guide,
  isOpen,
  onToggle,
  isAdmin,
  onEditGuide,
  onDeleteGuide,
  onTogglePublished,
}: {
  guide: NeighborhoodGuideItem;
  isOpen: boolean;
  onToggle: () => void;
  isAdmin?: boolean;
  onEditGuide?: (guide: NeighborhoodGuideItem) => void;
  onDeleteGuide?: (guide: NeighborhoodGuideItem) => void;
  onTogglePublished?: (guide: NeighborhoodGuideItem) => void;
}) {
  return (
    <article className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
      {/* Collapsed Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-4 sm:p-5 text-left bg-white hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
        aria-controls={`guide-content-${guide.id}`}
      >
        {/* Thumbnail */}
        <div className="relative w-20 h-16 sm:w-28 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
          {guide.image ? (
            <Image
              src={processImageUrl(guide.image, guide.id)}
              alt={guide.title}
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#468AD1]/5 to-[#468AD1]/10">
              <FiMapPin className="w-6 h-6 text-[#468AD1]/30" />
            </div>
          )}
        </div>

        {/* Title + Excerpt + Location */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#468AD1]/10 rounded text-xs font-medium text-[#468AD1]">
              <FiMapPin className="w-3 h-3" />
              {guide.locationType === "neighborhood"
                ? "Neighborhood"
                : guide.locationType === "city"
                  ? "City"
                  : "County"}
            </span>
            {getGuideLocationLabel(guide) && (
              <span className="text-xs text-gray-500 truncate">
                {getGuideLocationLabel(guide)}
              </span>
            )}
          </div>

          <h3 id={`guide-title-${guide.id}`} className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1 mb-1">
            {guide.title}
          </h3>

          {guide.excerpt && (
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 hidden sm:block">
              {guide.excerpt}
            </p>
          )}
        </div>

        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0 mt-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isOpen
                ? "bg-[#468AD1]/10 text-[#468AD1]"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {isOpen ? (
              <FiChevronUp className="w-4 h-4" />
            ) : (
              <FiChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* Draft badge for admins */}
      {isAdmin && !guide.published && (
        <div className="px-4 sm:px-5 pt-3 flex justify-end">
          <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
            Draft — not visible to visitors
          </span>
        </div>
      )}

      {/* Expanded Content */}
      {isOpen && (
        <div id={`guide-content-${guide.id}`} role="region" aria-labelledby={`guide-title-${guide.id}`} className="border-t border-gray-100 bg-gray-50">
          {/* Featured Image (large) */}
          {guide.image && (
            <div className="relative w-full aspect-[21/9] bg-gray-200">
              <Image
                src={processImageUrl(guide.image, guide.id)}
                alt={guide.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          {/* Guide Content */}
          <div className="p-4 sm:p-6">
            {guide.excerpt && (
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4 italic">
                {guide.excerpt}
              </p>
            )}
            <div
              className="blog-content blog-content-compact"
              dangerouslySetInnerHTML={{ __html: guide.content }}
            />

            {/* Admin actions (only rendered for admins) */}
            {isAdmin && (
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  Manage this guide
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditGuide?.(guide)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    <FiEdit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => onTogglePublished?.(guide)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      guide.published
                        ? "bg-white border-gray-300 text-gray-700 hover:border-[#468AD1] hover:text-[#468AD1]"
                        : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {guide.published ? (
                      <>
                        <FiEyeOff className="w-3.5 h-3.5" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <FiEye className="w-3.5 h-3.5" />
                        Publish
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteGuide?.(guide)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default function NeighborhoodGuideSection({
  guides,
  title = "Neighborhood Guides",
  locationLabel,
  bedroomLabel,
  categoryLabel,
  isAdmin = false,
  onAddGuide,
  onEditGuide,
  onDeleteGuide,
  onTogglePublished,
}: NeighborhoodGuideSectionProps) {
  const [openGuideId, setOpenGuideId] = useState<string | null>(null);

  // Build a context-aware section title, e.g. "1 Bedroom Guides in Nairobi"
  // or "Bungalows Guides in Nairobi", so the section clearly matches the
  // filters applied to the current search results page. When no filter
  // context is present it keeps the original "Neighborhood Guides ..." title.
  const buildDisplayTitle = (fallback: string): string => {
    const context = [bedroomLabel, categoryLabel]
      .filter((part) => Boolean(part))
      .join(" ");
    if (!context) {
      return fallback;
    }
    const contextPrefix = `${context} `;
    if (locationLabel) {
      return `${contextPrefix}Guides in ${locationLabel}`;
    }
    return `${contextPrefix}Guides`;
  };

  // Admins can add guides even when none exist yet for this page
  if (!guides || guides.length === 0) {
    if (!isAdmin) return null;
    return (
      <section className="mt-10 mb-8" aria-label="Neighborhood Guides">
        <div className="bg-white rounded-xl border border-dashed border-[#468AD1]/40 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#468AD1]/10 flex items-center justify-center">
                <FiMapPin className="w-5 h-5 text-[#468AD1]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {buildDisplayTitle(
                    locationLabel
                      ? `Neighborhood Guides in ${locationLabel}`
                      : title
                  )}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  No guides for this page yet (admin view)
                </p>
              </div>
            </div>
            <button
              onClick={onAddGuide}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors text-sm font-medium self-start sm:self-auto"
            >
              <FiPlus className="w-4 h-4" />
              Add Guide for this Page
            </button>
          </div>
        </div>
      </section>
    );
  }

  const displayTitle = buildDisplayTitle(
    locationLabel ? `Neighborhood Guides in ${locationLabel}` : title
  );

  const handleToggle = (id: string) => {
    setOpenGuideId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="mt-10 mb-8" aria-label="Neighborhood Guides">
      <div className="bg-white rounded-xl border p-5 lg:p-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#468AD1]/10 flex items-center justify-center">
              <FiMapPin className="w-5 h-5 text-[#468AD1]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {displayTitle}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Discover what makes this area special
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={onAddGuide}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors text-sm font-medium whitespace-nowrap"
            >
              <FiPlus className="w-4 h-4" />
              Add Guide
            </button>
          )}
        </div>

        {/* Guide Accordion */}
        <div className="space-y-3">
          {guides.map((guide) => (
            <GuideAccordionItem
              key={guide.id}
              guide={guide}
              isOpen={openGuideId === guide.id}
              onToggle={() => handleToggle(guide.id)}
              isAdmin={isAdmin}
              onEditGuide={onEditGuide}
              onDeleteGuide={onDeleteGuide}
              onTogglePublished={onTogglePublished}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
