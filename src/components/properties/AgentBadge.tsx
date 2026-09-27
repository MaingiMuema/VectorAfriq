"use client";

import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import type { BadgeTier, BadgeTierConfig } from "@/types";

// ---------------------------------------------------------------------------
// Tier visual configuration (fallback defaults)
// ---------------------------------------------------------------------------

interface BadgeVisual {
  label: string;
  tooltip: string;
  bgGradient: string;
  ringColor: string;
  icon: React.ReactNode;
}

const TIER_VISUALS: Record<BadgeTier, BadgeVisual | null> = {
  NONE: null,
  VERIFIED: {
    label: "Verified",
    tooltip: "Basic profile checks completed – contact details and listings verified",
    bgGradient: "from-blue-500 to-blue-600",
    ringColor: "ring-blue-200",
    icon: (
      <svg className="w-3 h 3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  TRUSTED: {
    label: "Trusted",
    tooltip: "License & background verified – identity and credentials confirmed by VectorAfriq",
    bgGradient: "from-emerald-500 to-emerald-600",
    ringColor: "ring-emerald-200",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
        <circle cx="12" cy="12" r="10" strokeDasharray="3 3" strokeWidth="1.5" />
      </svg>
    ),
  },
  ELITE: {
    label: "Elite",
    tooltip: "Full vetting & performance review – comprehensive background check, license validation, and client satisfaction tracking",
    bgGradient: "from-amber-500 to-orange-500",
    ringColor: "ring-amber-200",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
};

// ---------------------------------------------------------------------------
// Global badge tier cache (fetched once per page)
// ---------------------------------------------------------------------------

let cachedTiers: BadgeTierConfig[] | null = null;
let fetchPromise: Promise<BadgeTierConfig[]> | null = null;

async function fetchBadgeTiers(): Promise<BadgeTierConfig[]> {
  if (cachedTiers) return cachedTiers;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/badge-tiers")
    .then((res) => (res.ok ? res.json() : []))
    .then((data: BadgeTierConfig[]) => {
      cachedTiers = data;
      return data;
    })
    .catch(() => {
      cachedTiers = [];
      return [];
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

function getConfigForTier(
  tier: BadgeTier,
  remoteConfigs: BadgeTierConfig[]
): { config: BadgeTierConfig | null; visual: BadgeVisual | null } {
  const remote = remoteConfigs.find((t) => t.tier === tier);
  const visual = TIER_VISUALS[tier];
  return { config: remote ?? null, visual };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AgentBadgeProps {
  /** The badge tier to display. If "NONE" or missing, nothing is rendered. */
  tier?: BadgeTier | null;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show the tooltip on hover */
  showTooltip?: boolean;
  /** Additional class names */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AgentBadge({
  tier = "NONE",
  size = "sm",
  showTooltip = true,
  className = "",
}: AgentBadgeProps) {
  const [showTip, setShowTip] = useState(false);
  const [remoteTiers, setRemoteTiers] = useState<BadgeTierConfig[]>([]);

  useEffect(() => {
    fetchBadgeTiers().then(setRemoteTiers);
  }, []);

  if (!tier || tier === "NONE") return null;

  const { config, visual } = getConfigForTier(tier, remoteTiers);
  if (!visual) return null;

  // Use remote config name if available, fallback to visual default
  const displayName = config?.name || visual.label;
  const tooltipText = config?.description || visual.tooltip;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-0.5",
    md: "text-xs px-2 py-0.5 gap-1",
    lg: "text-sm px-2.5 py-1 gap-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`relative inline-flex items-center font-semibold rounded-full whitespace-nowrap select-none
        bg-gradient-to-r ${visual.bgGradient} text-white shadow-sm
        ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      onFocus={() => setShowTip(true)}
      onBlur={() => setShowTip(false)}
      tabIndex={0}
      role="status"
      aria-label={`${displayName} agent`}
    >
      <span className={`flex-shrink-0 ${iconSizes[size]}`}>
        {visual.icon}
      </span>
      <span>{displayName}</span>

      {/* Tooltip */}
      {showTooltip && showTip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-gray-900 text-white text-[11px] leading-tight font-normal px-3 py-2 shadow-lg z-50 pointer-events-none">
          {tooltipText}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}

export type { BadgeTierConfig };
