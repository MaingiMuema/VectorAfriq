/**
 * SEO Agent Model Configuration
 *
 * Manages which OpenRouter model the SEO agents use.
 * Stored in a JSON config file for persistence across server restarts.
 *
 * Any model from the OpenRouter catalog can be selected — not just a fixed
 * preset. When a model is chosen we persist a snapshot of its metadata
 * (label, pricing) so cost tracking keeps working even if the model
 * disappears from the catalog later.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CONFIG_DIR = join(process.cwd(), ".seo-agent");
const CONFIG_FILE = join(CONFIG_DIR, "model.json");

// ─── Model Option ─────────────────────────────────────────────────────────────

export interface ModelOption {
  id: string;
  label: string;
  description: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  isFree: boolean;
  contextLength: number | null;
}

/**
 * Hardcoded fallback list, used only when the live OpenRouter catalog cannot
 * be fetched (see lib/seo/models.ts). The admin UI normally shows the full
 * catalog.
 */
export const FALLBACK_MODELS: ModelOption[] = [
  {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    description: "Fast reasoning model — strong analysis and content evaluation",
    inputCostPer1M: 0.5,
    outputCostPer1M: 2.0,
    isFree: false,
    contextLength: null,
  },
  {
    id: "tencent/hy3:free",
    label: "Tencent Hy3 (Free)",
    description: "Free tier — good for bulk tasks, subject to rate limits",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: null,
  },
];

export const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";

// ─── Config Persistence ───────────────────────────────────────────────────────

interface ModelConfig {
  activeModelId: string;
  /** Snapshot of the selected model's metadata, used for cost tracking. */
  activeModel?: ModelOption;
  updatedAt: string;
}

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

// In-memory cache to avoid disk reads on every agent invocation
let cachedConfig: ModelConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

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
    // Fall through to null
  }
  return null;
}

export function getActiveModel(): string {
  const config = readConfig();
  if (
    config &&
    typeof config.activeModelId === "string" &&
    config.activeModelId.trim().length > 0
  ) {
    return config.activeModelId;
  }
  return DEFAULT_MODEL;
}

/**
 * Snapshot metadata (label, pricing, …) for a specific model id, used by the
 * OpenRouter client to compute per-run costs.
 *
 * Falls back to the hardcoded fallback list so configs written before the
 * snapshot feature existed (which only stored `activeModelId`) keep their
 * known pricing instead of silently reporting $0 costs.
 */
export function getModelSnapshot(modelId: string): ModelOption | undefined {
  const config = readConfig();
  if (config?.activeModel && config.activeModel.id === modelId) {
    return config.activeModel;
  }
  return FALLBACK_MODELS.find((m) => m.id === modelId);
}

export function setActiveModel(
  modelId: string,
  model?: ModelOption
): { success: boolean; error?: string } {
  if (!modelId || typeof modelId !== "string" || modelId.trim().length === 0) {
    return { success: false, error: "Missing or invalid model ID" };
  }

  try {
    ensureConfigDir();
    const config: ModelConfig = {
      activeModelId: modelId,
      ...(model ? { activeModel: model } : {}),
      updatedAt: new Date().toISOString(),
    };
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    // Invalidate cache so the next read picks up the fresh value
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


