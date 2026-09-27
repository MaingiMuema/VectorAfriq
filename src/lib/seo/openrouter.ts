/**
 * OpenRouter LLM Client for SEO Agents
 * 
 * Centralized client for all SEO agent LLM calls via OpenRouter API.
 * Supports multiple models for different tasks (reasoning vs bulk generation).
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
}

export interface LLMCallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json_object";
}

import { getActiveModel, getModelSnapshot } from "./config";

// Model presets for different agent tasks — resolved dynamically from admin config
export function getMODELS() {
  const active = getActiveModel();
  return {
    // Primary reasoning model
    reasoning: active,
    // Fast model for bulk tasks
    fast: active,
    // Fallback reasoning model
    fallback: active,
  };
}

// Cost per 1M tokens (for tracking) — looked up from the metadata snapshot
// persisted when the admin selected the model, so any OpenRouter model works.
function getCostPer1M(modelId: string): { input: number; output: number } {
  const info = getModelSnapshot(modelId);
  return info
    ? { input: info.inputCostPer1M, output: info.outputCostPer1M }
    : { input: 0, output: 0 };
}

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not set in environment");
  }
  return key;
}

export async function callLLM(
  messages: LLMMessage[],
  options: LLMCallOptions = {}
): Promise<LLMResponse> {
  const apiKey = getApiKey();

  const model = options.model || getMODELS().reasoning;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  };

  if (options.responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke",
      "X-Title": "VectorAfriq SEO Agent",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenRouter API error ${response.status}:`, errorText);

    // If primary model fails, try fallback
    if (model !== getMODELS().fallback) {
      console.log("Retrying with fallback model...");
      return callLLM(messages, { ...options, model: getMODELS().fallback });
    }

    throw new Error(`OpenRouter API error ${response.status}: ${errorText.substring(0, 500)}`);
  }

  const data = await response.json();

  const content = data.choices?.[0]?.message?.content || "";
  if (!content) {
    throw new Error("LLM returned empty content");
  }

  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  const costPer1M = getCostPer1M(model);

  const costUsd =
    (usage.prompt_tokens / 1_000_000) * costPer1M.input +
    (usage.completion_tokens / 1_000_000) * costPer1M.output;

  return {
    content,
    usage: {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    },
    costUsd,
  };
}

/**
 * Attempt to repair truncated/invalid JSON from an LLM.
 * Handles common failure modes:
 * - Truncated array/object (closes open braces/brackets)
 * - Missing closing quotes on strings
 * - Trailing commas before closing brackets
 */
function repairJson(text: string): string {
  let s = text.trim();

  // Strip markdown fences
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  // Remove trailing commas before closing brackets/braces
  s = s.replace(/,\s*([}\]])/g, "$1");

  // Count open vs close brackets
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (const char of s) {
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") braces++;
    else if (char === "}") braces--;
    else if (char === "[") brackets++;
    else if (char === "]") brackets--;
  }

  // If we're inside a string, close it
  if (inString) {
    s += '"';
  }

  // Close open structures
  // If truncated mid-object, we likely need to close current object + array
  while (brackets > 0) {
    // Close any open object inside the array first
    if (braces > 0) {
      s += "}";
      braces--;
    } else {
      s += "]";
      brackets--;
    }
  }
  while (braces > 0) {
    s += "}";
    braces--;
  }

  return s;
}

/**
 * Call LLM with a JSON system instruction and parse the response.
 * Automatically adds "Return valid JSON only" to the system message.
 * Includes automatic retry with higher maxTokens on truncation, plus
 * JSON repair for partial responses.
 */
export async function callLLMForJSON<T = Record<string, unknown>>(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions = {}
): Promise<{ data: T; costUsd: number; raw: string }> {
  const maxTokens = options.maxTokens ?? 2048;

  const response = await callLLM(
    [
      {
        role: "system",
        content: `${systemPrompt}\n\nYou must respond with valid JSON only. No markdown, no code fences, no commentary — just the JSON object.`,
      },
      { role: "user", content: userPrompt },
    ],
    { ...options, responseFormat: "json_object", temperature: options.temperature ?? 0.5, maxTokens }
  );

  let cleaned = response.content.trim();

  // Strip markdown fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  // First attempt: parse as-is
  try {
    const data = JSON.parse(cleaned) as T;
    return { data, costUsd: response.costUsd, raw: response.content };
  } catch {
    // Second attempt: try to repair truncated JSON
    const repaired = repairJson(cleaned);
    try {
      const data = JSON.parse(repaired) as T;
      console.warn("[OpenRouter] JSON was truncated — auto-repaired successfully");
      return { data, costUsd: response.costUsd, raw: response.content };
    } catch {
      // Third attempt: retry with double the tokens
      if (response.usage.completionTokens >= maxTokens * 0.9) {
        console.warn(`[OpenRouter] JSON truncated at ${response.usage.completionTokens}/${maxTokens} tokens — retrying with ${maxTokens * 2} tokens`);
        try {
          return await callLLMForJSON(systemPrompt, userPrompt, { ...options, maxTokens: maxTokens * 2 });
        } catch {
          // fall through to error
        }
      }

      console.error("Failed to parse LLM JSON output after repair attempts");
      console.error("Raw output (last 200 chars):", response.content.substring(response.content.length - 200));
      throw new Error("LLM returned unparseable JSON after truncation repair and retry");
    }
  }
}
