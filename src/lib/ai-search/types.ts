import type { Property } from "@/types";

/** Structured intent extracted from the user's natural-language prompt. */
export interface AiSearchCriteria {
  listingType?: "SALE" | "RENT" | "AIRBNB";
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  /** Studio treated as 0 bedrooms */
  isStudio?: boolean;
  category?: string;
  features?: string[];
  keywords?: string[];
}

export interface AiSearchRankedResult {
  id: string;
  relevanceScore: number;
  reason: string;
}

/** Extra advisory content from the model (not just listings). */
export interface AiSearchInsights {
  /** Practical tip for buying/renting given this request. */
  advice?: string;
  /** Brief local/market context for the search. */
  marketInsight?: string;
  /** Short tips the user can use to refine the search. */
  searchTips?: string[];
  /** What matched well / trade-offs in plain language. */
  matchNotes?: string;
}

/** Deterministic stats computed from ranked properties. */
export interface AiSearchStats {
  matchCount: number;
  minPrice?: number;
  maxPrice?: number;
  avgPrice?: number;
  medianPrice?: number;
  bedroomRange?: string;
  topLocations: string[];
  categories: string[];
}

export interface AiSearchResponse {
  /** Human-readable summary of what the AI understood and found. */
  summary: string;
  /** Normalized criteria extracted from the prompt. */
  criteria: AiSearchCriteria;
  /** Advisory content beyond the property list. */
  insights: AiSearchInsights;
  /** Stats derived from the ranked match set. */
  stats: AiSearchStats;
  /** Ranked property ids with relevance + reason (high → low). */
  results: AiSearchRankedResult[];
  /** Full property objects ordered to match `results`. */
  properties: Property[];
  /** Candidate pool size considered before ranking. */
  candidateCount: number;
  /** OpenRouter model id used for ranking. */
  model: string;
  /** True when ranking fell back to filter-only ordering. */
  usedFallback?: boolean;
}

export interface AiSearchRequestOptions {
  /** Optional listing type hint from the UI (sale / rent / airbnb). */
  listingTypeHint?: string;
  /** Soft max results to return after ranking. */
  maxResults?: number;
  /**
   * Prior user prompt when this request is a follow-up refinement.
   * Combined with the new prompt for ranking and filter extraction.
   */
  previousPrompt?: string;
}
