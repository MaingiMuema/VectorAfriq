/**
 * AI Property Search — public entry points.
 *
 * Uses a dedicated OpenRouter client with model `nvidia/nemotron-3-ultra-550b-a55b:free`.
 * Independent of SEO agent model configuration on /admin/seo/agent.
 */

export { AI_SEARCH_MODEL, callAiSearchLLM, sanitizeForLlm } from "./client";
export { extractCriteriaFromPrompt } from "./criteria";
export { runAiPropertySearch } from "./search";
export type {
  AiSearchCriteria,
  AiSearchInsights,
  AiSearchRankedResult,
  AiSearchRequestOptions,
  AiSearchResponse,
  AiSearchStats,
} from "./types";
