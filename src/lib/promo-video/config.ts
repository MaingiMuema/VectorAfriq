/**
 * Promo Video — Model Configuration
 *
 * The admin promo-video generator can be switched between two OpenRouter
 * models (per job or persisted globally):
 *   - openai/gpt-5.6-luna            (primary, high quality)
 *   - deepseek/deepseek-v4-flash-0731 (fast, budget)
 *
 * The active model is persisted in a JSON file (same pattern as the SEO
 * agent config) so the admin UI remembers the last selection across restarts.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CONFIG_DIR = join(process.cwd(), ".promo-video");
const CONFIG_FILE = join(CONFIG_DIR, "model.json");

export interface PromoModelOption {
  id: string;
  label: string;
  description: string;
  badge: "Flagship" | "Fast";
}

/** The two models the admin can switch between (per the feature spec). */
export const PROMO_MODELS: PromoModelOption[] = [
  {
    id: "openai/gpt-5.6-luna",
    label: "OpenAI GPT-5.6 Luna",
    description: "Flagship model — richer scripts, sharper creative direction.",
    badge: "Flagship",
  },
  {
    id: "deepseek/deepseek-v4-flash-0731",
    label: "DeepSeek V4 Flash 0731",
    description: "Fast & economical — quick drafts and bulk experimentation.",
    badge: "Fast",
  },
];

export const DEFAULT_PROMO_MODEL = PROMO_MODELS[0].id;

interface ModelConfig {
  activeModelId: string;
  updatedAt: string;
}

let cachedConfig: ModelConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000;

function readConfig(): ModelConfig | null {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }
  try {
    if (existsSync(CONFIG_FILE)) {
      const raw = readFileSync(CONFIG_FILE, "utf-8");
      cachedConfig = JSON.parse(raw) as ModelConfig;
      cacheTimestamp = now;
      return cachedConfig;
    }
  } catch {
    // fall through
  }
  return null;
}

export function getActivePromoModel(): string {
  const config = readConfig();
  if (
    config &&
    typeof config.activeModelId === "string" &&
    config.activeModelId.trim().length > 0
  ) {
    return config.activeModelId;
  }
  return DEFAULT_PROMO_MODEL;
}

export function setActivePromoModel(
  modelId: string
): { success: boolean; error?: string } {
  if (!PROMO_MODELS.some((m) => m.id === modelId)) {
    return { success: false, error: `Unknown model: ${modelId}` };
  }
  try {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(
      CONFIG_FILE,
      JSON.stringify({ activeModelId: modelId, updatedAt: new Date().toISOString() }, null, 2),
      "utf-8"
    );
    cachedConfig = null;
    cacheTimestamp = 0;
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save config",
    };
  }
}

/** Resolve a model id (falls back to the persisted active model / default). */
export function resolvePromoModel(modelId?: string | null): string {
  if (modelId && PROMO_MODELS.some((m) => m.id === modelId)) return modelId;
  return getActivePromoModel();
}
