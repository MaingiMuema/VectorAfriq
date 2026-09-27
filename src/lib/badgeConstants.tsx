import type { BadgeTier } from "@/types";

/**
 * Shared badge tier visual constants used across admin, CRM, and client components.
 * Centralized here to avoid duplication and ensure consistency.
 */

export const TIER_GRADIENTS: Record<BadgeTier, string> = {
  NONE: "from-gray-400 to-gray-500",
  VERIFIED: "from-blue-500 to-blue-600",
  TRUSTED: "from-emerald-500 to-emerald-600",
  ELITE: "from-amber-500 to-orange-500",
};

export const TIER_COLORS: Record<BadgeTier, { text: string; bg: string; border: string; ring: string }> = {
  NONE: { text: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", ring: "ring-gray-200" },
  VERIFIED: { text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", ring: "ring-blue-200" },
  TRUSTED: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", ring: "ring-emerald-200" },
  ELITE: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", ring: "ring-amber-200" },
};

export const TIER_ICONS: Record<BadgeTier, React.ReactNode> = {
  NONE: null,
  VERIFIED: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  TRUSTED: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
      <circle cx="12" cy="12" r="10" strokeDasharray="3 3" strokeWidth="1.5" />
    </svg>
  ),
  ELITE: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

export const TIER_ORDER: Record<BadgeTier, number> = {
  NONE: 0,
  VERIFIED: 1,
  TRUSTED: 2,
  ELITE: 3,
};
