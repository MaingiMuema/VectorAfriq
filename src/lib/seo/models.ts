/**
 * OpenRouter Model Catalog
 *
 * Fetches the full, current list of models from the public OpenRouter API
 * (GET https://openrouter.ai/api/v1/models) and normalizes it into the
 * ModelOption shape used across the SEO agent configuration.
 *
 * The catalog is cached in memory to avoid hammering the OpenRouter API on
 * every dashboard load. If a refresh fails we keep the last known good list
 * (stale-while-revalidate); before any successful fetch, a small hardcoded
 * fallback list keeps the admin page functional.
 */

import { FALLBACK_MODELS, type ModelOption } from "./config";

const MODELS_URL = "https://openrouter.ai/api/v1/models";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let cachedModels: ModelOption[] | null = null;
let cachedAt = 0;
let lastKnownGood: ModelOption[] | null = null;
let inflight: Promise<ModelOption[]> | null = null;

interface OpenRouterApiModel {
  id: string;
  name?: string;
  description?: string;
  context_length?: number | null;
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
    image?: string;
  };
}

/** OpenRouter pricing is a per-token USD string (e.g. "0.000002"). */
function toCostPer1M(value: string | undefined): number {
  const n = Number.parseFloat(value ?? "0");
  return Number.isFinite(n) ? n * 1_000_000 : 0;
}

function normalizeModel(raw: OpenRouterApiModel): ModelOption {
  const inputCostPer1M = toCostPer1M(raw.pricing?.prompt);
  const outputCostPer1M = toCostPer1M(raw.pricing?.completion);
  const isFree =
    raw.id.endsWith(":free") || (inputCostPer1M === 0 && outputCostPer1M === 0);

  return {
    id: raw.id,
    label: raw.name || raw.id,
    description: (raw.description || "").trim(),
    contextLength: raw.context_length ?? null,
    inputCostPer1M,
    outputCostPer1M,
    isFree,
  };
}

/**
 * Returns the full list of models available on OpenRouter.
 *
 * The result is cached for `CACHE_TTL_MS`; pass `{ refresh: true }` to force
 * a re-fetch (used by the "Refresh" button in the admin UI). On failure the
 * last known good list is returned, falling back to `FALLBACK_MODELS` when
 * nothing has been fetched yet.
 */
export async function getOpenRouterModels(
  options: { refresh?: boolean } = {}
): Promise<ModelOption[]> {
  const now = Date.now();

  if (!options.refresh && cachedModels && now - cachedAt < CACHE_TTL_MS) {
    return cachedModels;
  }

  // Reuse an in-flight fetch so concurrent requests (e.g. several admins on
  // the dashboard) don't stampede the OpenRouter API.
  if (inflight) {
    return inflight;
  }

  const run = (async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke",
        "X-Title": "VectorAfriq SEO Agent",
      };
      // Optional — the endpoint is public, but the key raises the rate limit.
      if (process.env.OPENROUTER_API_KEY) {
        headers.Authorization = `Bearer ${process.env.OPENROUTER_API_KEY}`;
      }

      const res = await fetch(MODELS_URL, { headers, cache: "no-store" });
      if (!res.ok) {
        throw new Error(`OpenRouter models API error ${res.status}`);
      }

      const data = await res.json();
      const models: ModelOption[] = Array.isArray(data.data)
        ? data.data.map(normalizeModel)
        : [];

      if (models.length === 0) {
        throw new Error("OpenRouter models API returned an empty list");
      }

      cachedModels = models;
      lastKnownGood = models;
      cachedAt = Date.now();
      return models;
    } catch (error) {
      console.error("[OpenRouter] Failed to fetch model catalog:", error);
      if (lastKnownGood) {
        return lastKnownGood;
      }
      return FALLBACK_MODELS;
    } finally {
      inflight = null;
    }
  })();

  inflight = run;
  return run;
}
