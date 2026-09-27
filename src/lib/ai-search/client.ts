/**
 * Dedicated OpenRouter client for AI property search.
 *
 * Intentionally separate from the SEO agent client (`lib/seo/openrouter.ts`)
 * so AI search always uses `nvidia/nemotron-3-ultra-550b-a55b:free` and is not affected
 * by model switches on /admin/seo/agent.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Fixed model for AI property search (OpenRouter free tier). */
export const AI_SEARCH_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

export interface AiSearchLLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiSearchLLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

export interface AiSearchLLMOptions {
  temperature?: number;
  maxTokens?: number;
  /** Override only for tests/debugging — production always uses AI_SEARCH_MODEL. */
  model?: string;
}

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not set in environment");
  }
  return key;
}

/**
 * Neutralize characters that break OpenRouter/LLM request parsing.
 *
 * Listing text from the DB often contains backslash sequences (`\x..`, `\u..`,
 * trailing `\`) from scraped HTML/JS. Some models return 400:
 *   "unexpected end of hex escape"
 * when those sequences appear inside messages[n].content.
 */
export function sanitizeForLlm(text: string): string {
  if (!text) return "";

  return (
    text
      .replace(/\r\n/g, "\n")
      .replace(/&#x[0-9a-fA-F]+;?/gi, " ")
      .replace(/&#\d+;?/g, " ")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, " ")
      // Strip escape-like sequences that providers re-parse as hex/unicode
      .replace(/\\x[0-9a-fA-F]{0,2}/gi, " ")
      .replace(/\\u[0-9a-fA-F]{0,4}/gi, " ")
      .replace(/\\[0-7]{1,3}/g, " ")
      // Remaining backslashes are the usual root of "hex escape" 400s
      .replace(/\\/g, "/")
      .replace(/[\uD800-\uDFFF]/g, "")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Pull usable text from an OpenRouter message.
 * Free/reasoning models sometimes put the answer in `reasoning` or
 * leave `content` empty / nested.
 */
function extractMessageText(message: Record<string, unknown> | null | undefined): string {
  if (!message) return "";

  const content = message.content;
  if (typeof content === "string" && content.trim()) {
    return content;
  }

  // Some providers return content as an array of parts
  if (Array.isArray(content)) {
    const joined = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text || "");
        }
        return "";
      })
      .join("")
      .trim();
    if (joined) return joined;
  }

  const reasoning = message.reasoning;
  if (typeof reasoning === "string" && reasoning.trim()) {
    // Prefer a JSON block inside reasoning if present
    const fence = reasoning.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) return fence[1].trim();
    if (reasoning.includes("{") && reasoning.includes("results")) {
      return reasoning;
    }
  }

  return "";
}

/**
 * Call OpenRouter with the AI-search model.
 * Does not use the SEO agent model config.
 */
export async function callAiSearchLLM(
  messages: AiSearchLLMMessage[],
  options: AiSearchLLMOptions = {}
): Promise<AiSearchLLMResponse> {
  const apiKey = getApiKey();
  const model = options.model || AI_SEARCH_MODEL;

  // Sanitize every message — DB property text is the usual source of bad escapes
  const safeMessages = messages.map((m) => ({
    role: m.role,
    content: sanitizeForLlm(m.content),
  }));

  const body = {
    model,
    messages: safeMessages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 2048,
  };

  let serialized: string;
  try {
    serialized = JSON.stringify(body);
    // Confirm our own payload is valid JSON before shipping
    JSON.parse(serialized);
  } catch (err) {
    console.error("[AI Search LLM] Failed to serialize request body:", err);
    throw new Error("Failed to build AI search request payload");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke",
      "X-Title": "VectorAfriq AI Search",
    },
    body: serialized,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[AI Search LLM] OpenRouter ${response.status}:`, errorText.substring(0, 500));
    throw new Error(
      `AI search model error (${response.status}): ${errorText.substring(0, 300)}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `AI search model error: ${data.error.message || JSON.stringify(data.error).slice(0, 200)}`
    );
  }

  const choice = data.choices?.[0];
  const message = choice?.message as Record<string, unknown> | undefined;
  const content = extractMessageText(message);

  if (!content) {
    console.error("[AI Search LLM] Empty content. Choice:", JSON.stringify(choice)?.slice(0, 400));
    throw new Error("AI search model returned empty content");
  }

  const usage = data.usage || {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };

  return {
    content,
    usage: {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    },
    model: data.model || model,
    finishReason: choice?.finish_reason,
  };
}

/**
 * Close truncated JSON by finishing open strings/brackets.
 * Helps when free models hit max_tokens mid-response (finish_reason: length).
 */
function repairTruncatedJson(s: string): string {
  let out = s.trim();
  // Strip trailing incomplete key/value fragments after last complete object/array element
  // Remove trailing commas
  out = out.replace(/,\s*$/, "");

  let inString = false;
  let escape = false;
  let braces = 0;
  let brackets = 0;

  for (const ch of out) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") braces += 1;
    else if (ch === "}") braces -= 1;
    else if (ch === "[") brackets += 1;
    else if (ch === "]") brackets -= 1;
  }

  if (inString) out += '"';

  // Drop incomplete trailing property after a comma inside object/array
  out = out.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}\[\]]*$/, "");
  out = out.replace(/,\s*$/, "");

  while (brackets > 0) {
    out += "]";
    brackets -= 1;
  }
  while (braces > 0) {
    out += "}";
    braces -= 1;
  }

  return out;
}

/**
 * Extract the first balanced JSON object from LLM text.
 * Tolerates markdown fences, surrounding prose, and light truncation.
 */
export function extractJsonObject(text: string): Record<string, unknown> | null {
  let s = text.trim();

  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    s = fence[1].trim();
  }

  const start = s.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;

  for (let i = start; i < s.length; i += 1) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  const slice = end === -1 ? s.slice(start) : s.slice(start, end + 1);

  try {
    return JSON.parse(slice) as Record<string, unknown>;
  } catch {
    // Attempt repair for truncated / trailing-comma JSON
    try {
      const repaired = repairTruncatedJson(slice.replace(/,\s*([}\]])/g, "$1"));
      return JSON.parse(repaired) as Record<string, unknown>;
    } catch {
      // Last resort: extract complete result objects even if outer JSON is broken
      const results = extractPartialResults(s);
      if (results.length > 0) {
        return {
          summary: "Matched listings from your description.",
          criteria: {},
          results,
        };
      }
      return null;
    }
  }
}

/**
 * Recover complete {id, relevanceScore, reason} objects from truncated output.
 */
function extractPartialResults(
  text: string
): Array<{ id: string; relevanceScore: number; reason: string }> {
  const results: Array<{ id: string; relevanceScore: number; reason: string }> = [];
  const re =
    /\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"relevanceScore"\s*:\s*([0-9.]+)\s*,\s*"reason"\s*:\s*"((?:\\.|[^"\\])*)"\s*\}/g;

  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    results.push({
      id: match[1],
      relevanceScore: Number(match[2]),
      reason: match[3].replace(/\\"/g, '"'),
    });
  }

  return results;
}
