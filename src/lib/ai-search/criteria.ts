/**
 * Heuristic criteria extraction from natural-language property prompts.
 * Used to pre-filter the DB before LLM ranking so the candidate pool is relevant.
 */

import type { AiSearchCriteria } from "./types";

const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\b(apartment|apartments|flat|flats)\b/i, category: "APARTMENTS" },
  { pattern: /\b(bungalow|bungalows)\b/i, category: "BUNGALOWS" },
  { pattern: /\b(townhouse|townhouses|town\s*house)\b/i, category: "TOWNHOUSES" },
  { pattern: /\b(villa|villas)\b/i, category: "VILLAS" },
  { pattern: /\b(penthouse|penthouses)\b/i, category: "PENTHOUSES" },
  { pattern: /\b(maisonette|maisonettes)\b/i, category: "MAISONETTES" },
  { pattern: /\b(duplex|duplexes)\b/i, category: "DUPLEX" },
  { pattern: /\b(studio|studios)\b/i, category: "STUDIOS" },
  { pattern: /\b(office|offices)\b/i, category: "OFFICES" },
  {
    pattern: /\b(commercial\s*(plot|plots|land|property|properties)|warehouse|shop|shops)\b/i,
    category: "COMMERCIAL_PROPERTIES",
  },
  {
    pattern: /\b(residential\s*(plot|plots|land)|plot|plots|land for sale)\b/i,
    category: "RESIDENTIAL_PLOTS",
  },
  { pattern: /\b(house|houses|home|homes)\b/i, category: "HOUSES" },
];

const FEATURE_PATTERNS: Array<{ pattern: RegExp; feature: string }> = [
  { pattern: /\bparking|garage|car\s*park\b/i, feature: "parking" },
  { pattern: /\bgarden|yard\b/i, feature: "garden" },
  { pattern: /\bpool|swimming\b/i, feature: "pool" },
  { pattern: /\bbalcony|terrace\b/i, feature: "balcony" },
  { pattern: /\bfurnished\b/i, feature: "furnished" },
  { pattern: /\bunfurnished\b/i, feature: "unfurnished" },
  { pattern: /\bsecurity|gated\b/i, feature: "security" },
  { pattern: /\bgenerator|backup power\b/i, feature: "generator" },
  { pattern: /\bwater\s*(borehole|tank)\b/i, feature: "water" },
  { pattern: /\bcity\s*view|view\b/i, feature: "view" },
  { pattern: /\bgym|fitness\b/i, feature: "gym" },
  { pattern: /\bpet[\s-]?friendly\b/i, feature: "pet-friendly" },
];

function parseMoneyToken(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, "").toLowerCase();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)(m|million|k|thousand)?$/i);
  if (!match) {
    const digits = parseInt(raw.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(digits) && digits > 0 ? digits : null;
  }

  const num = parseFloat(match[1]);
  if (!Number.isFinite(num) || num <= 0) return null;

  const unit = (match[2] || "").toLowerCase();
  if (unit === "m" || unit === "million") return Math.round(num * 1_000_000);
  if (unit === "k" || unit === "thousand") return Math.round(num * 1_000);
  // Bare numbers under 1000 are ambiguous; treat as millions if context says so elsewhere
  if (num < 1000) return Math.round(num); // likely already full KES if small, or handled by caller
  return Math.round(num);
}

/**
 * Extract structured search criteria from a free-text prompt using rules only.
 * Fast and deterministic — used for SQL pre-filtering.
 */
export function extractCriteriaFromPrompt(
  prompt: string,
  listingTypeHint?: string
): AiSearchCriteria {
  const lower = prompt.toLowerCase();
  const criteria: AiSearchCriteria = {};

  // Listing type
  if (/\b(airbnb|short[\s-]?stay|holiday\s*home|vacation)\b/i.test(prompt)) {
    criteria.listingType = "AIRBNB";
  } else if (
    /\b(for\s*rent|to\s*rent|rental|renting|lease|leasing)\b/i.test(prompt) ||
    /\brent\b/i.test(prompt)
  ) {
    criteria.listingType = "RENT";
  } else if (/\b(for\s*sale|to\s*buy|buying|purchase|purchasing)\b/i.test(prompt)) {
    criteria.listingType = "SALE";
  } else if (listingTypeHint) {
    const hint = listingTypeHint.toLowerCase();
    if (hint === "rent") criteria.listingType = "RENT";
    else if (hint === "airbnb") criteria.listingType = "AIRBNB";
    else if (hint === "sale") criteria.listingType = "SALE";
  }

  // Studio
  if (/\bstudio\b/i.test(prompt)) {
    criteria.isStudio = true;
    criteria.bedrooms = 0;
  }

  // Bedrooms (supports "2 bedroom", "2-bed", "2br", "3+ bedrooms")
  if (!criteria.isStudio) {
    const bedMatch =
      lower.match(/(\d+)\s*[\+\-]?\s*(?:bed(?:room)?s?|br\b)/i) ||
      lower.match(/(\d+)[\-](?:bed(?:room)?s?|br)\b/i) ||
      lower.match(/(?:bed(?:room)?s?|br)\s*[:=]?\s*(\d+)/i);
    if (bedMatch) {
      const n = parseInt(bedMatch[1], 10);
      if (Number.isFinite(n) && n >= 0 && n <= 20) {
        criteria.bedrooms = n;
      }
    }
  }

  // Category
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(prompt)) {
      criteria.category = category;
      break;
    }
  }

  // Price bands
  const underMatch = lower.match(
    /(?:under|below|less than|max(?:imum)?|upto|up to|budget(?: of)?|not more than)\s*(?:kes|ksh|kshs|shillings?)?\s*([\d,.]+)\s*(m|million|k|thousand)?/i
  );
  const overMatch = lower.match(
    /(?:over|above|more than|min(?:imum)?|at least|from)\s*(?:kes|ksh|kshs|shillings?)?\s*([\d,.]+)\s*(m|million|k|thousand)?/i
  );
  const betweenMatch = lower.match(
    /(?:between|from)\s*(?:kes|ksh)?\s*([\d,.]+)\s*(m|million|k|thousand)?\s*(?:and|to|-)\s*(?:kes|ksh)?\s*([\d,.]+)\s*(m|million|k|thousand)?/i
  );
  const barePrice = lower.match(
    /(?:kes|ksh|kshs)\s*([\d,.]+)\s*(m|million|k|thousand)?/i
  );

  if (betweenMatch) {
    const a = parseMoneyToken(`${betweenMatch[1]}${betweenMatch[2] || ""}`);
    const b = parseMoneyToken(`${betweenMatch[3]}${betweenMatch[4] || ""}`);
    if (a && b) {
      criteria.minPrice = Math.min(a, b);
      criteria.maxPrice = Math.max(a, b);
    }
  } else {
    if (underMatch) {
      const v = parseMoneyToken(`${underMatch[1]}${underMatch[2] || ""}`);
      if (v) {
        // "under 30" without unit in Kenyan real-estate context usually means 30M
        criteria.maxPrice = v < 1000 && !underMatch[2] ? v * 1_000_000 : v;
      }
    }
    if (overMatch) {
      const v = parseMoneyToken(`${overMatch[1]}${overMatch[2] || ""}`);
      if (v) {
        if (v < 1000 && !overMatch[2]) {
          criteria.minPrice = v * 1_000_000;
        } else {
          criteria.minPrice = v;
        }
      }
    }
    if (!criteria.maxPrice && !criteria.minPrice && barePrice) {
      const v = parseMoneyToken(`${barePrice[1]}${barePrice[2] || ""}`);
      if (v) {
        const center = v < 1000 && !barePrice[2] ? v * 1_000_000 : v;
        criteria.minPrice = Math.round(center * 0.5);
        criteria.maxPrice = Math.round(center * 1.5);
      }
    }
  }

  // Location: "in X", "near X", "around X", "at X"
  const locationMatch = prompt.match(
    /\b(?:in|near|around|at|within)\s+([A-Za-z][A-Za-z\s\-']{1,40}?)(?:\s+(?:under|below|with|for|that|which|having|and|,|\.|$)|$)/i
  );
  if (locationMatch) {
    let loc = locationMatch[1]
      .replace(/\b(kenya|nairobi county)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    // Drop trailing noise words
    loc = loc
      .replace(
        /\b(with|under|below|for|a|an|the|apartment|house|bungalow|villa|flat|studio|property|properties)\b.*$/i,
        ""
      )
      .trim();
    if (loc.length >= 2 && loc.length <= 48) {
      criteria.location = loc;
    }
  }

  // Features
  const features: string[] = [];
  for (const { pattern, feature } of FEATURE_PATTERNS) {
    if (pattern.test(prompt)) features.push(feature);
  }
  if (features.length) criteria.features = features;

  // Residual keywords for soft matching
  const stop = new Set([
    "a", "an", "the", "in", "on", "at", "for", "to", "of", "and", "or", "with",
    "want", "looking", "need", "find", "search", "property", "properties",
    "bedroom", "bedrooms", "bed", "bath", "bathroom", "bathrooms", "near",
    "under", "below", "above", "over", "from", "between", "please", "me",
    "my", "i", "am", "is", "are", "that", "this", "has", "have", "having",
  ]);
  const keywords = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stop.has(w) && !/^\d+$/.test(w));
  if (keywords.length) {
    criteria.keywords = Array.from(new Set(keywords)).slice(0, 12);
  }

  return criteria;
}

/** Merge AI-returned criteria over heuristic criteria (AI wins when present). */
export function mergeCriteria(
  base: AiSearchCriteria,
  fromAi?: Partial<AiSearchCriteria> | null
): AiSearchCriteria {
  if (!fromAi) return base;

  const merged: AiSearchCriteria = { ...base };

  if (fromAi.listingType) merged.listingType = fromAi.listingType;
  if (fromAi.location) merged.location = fromAi.location;
  if (typeof fromAi.minPrice === "number") merged.minPrice = fromAi.minPrice;
  if (typeof fromAi.maxPrice === "number") merged.maxPrice = fromAi.maxPrice;
  if (typeof fromAi.bedrooms === "number") merged.bedrooms = fromAi.bedrooms;
  if (typeof fromAi.isStudio === "boolean") merged.isStudio = fromAi.isStudio;
  if (fromAi.category) merged.category = fromAi.category;
  if (fromAi.features?.length) {
    merged.features = Array.from(
      new Set([...(base.features || []), ...fromAi.features])
    );
  }
  if (fromAi.keywords?.length) {
    merged.keywords = Array.from(
      new Set([...(base.keywords || []), ...fromAi.keywords])
    ).slice(0, 16);
  }

  return merged;
}
