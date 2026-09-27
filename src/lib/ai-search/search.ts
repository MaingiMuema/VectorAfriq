/**
 * AI Property Search orchestration.
 *
 * Flow:
 * 1. Heuristically extract filters from the user prompt
 * 2. Query the property DB for a focused candidate pool
 * 3. Rank candidates with nvidia/nemotron-3-ultra-550b-a55b:free via the dedicated AI search client
 * 4. Return summary, criteria chips, relevance scores, and full property objects
 */

import { query, type DatabaseValue } from "@/lib/db";
import type { BadgeTier, Property } from "@/types";
import {
  AI_SEARCH_MODEL,
  callAiSearchLLM,
  extractJsonObject,
  sanitizeForLlm,
  type AiSearchLLMMessage,
} from "./client";
import { extractCriteriaFromPrompt, mergeCriteria } from "./criteria";
import type {
  AiSearchCriteria,
  AiSearchInsights,
  AiSearchRankedResult,
  AiSearchRequestOptions,
  AiSearchResponse,
  AiSearchStats,
} from "./types";

/**
 * Keep the candidate payload moderate — free models truncate when given
 * 50–80 long listings, but ~28 compact rows + 4k max_tokens works well.
 */
const CANDIDATE_POOL = 28;
const DEFAULT_MAX_RESULTS = 12;
const MAX_PROMPT_CHARS = 1000;
const DESC_SNIPPET = 100;
/** Verified via OpenRouter: model finishes cleanly well under this budget. */
const LLM_MAX_TOKENS = 4000;
const LLM_RETRY_MAX_TOKENS = 3000;

interface DbPropertyRow {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: string;
  category: string;
  bedrooms: number;
  bathrooms: number;
  floorSize: number | null;
  plotSize: number | null;
  images: string;
  features: string;
  user: string;
  company: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  featured?: boolean | number;
  status?: string;
}

function parseFeatures(value: string | null | undefined): string[] {
  try {
    if (!value) return [];
    const parsed = JSON.parse(value);
    if (parsed?.features && Array.isArray(parsed.features)) {
      return parsed.features.filter((f: unknown): f is string => typeof f === "string");
    }
    if (Array.isArray(parsed)) {
      return parsed.map((f) => (typeof f === "string" ? f : String(f))).filter(Boolean);
    }
    if (typeof parsed === "object" && parsed !== null) {
      const copy = { ...parsed } as Record<string, unknown>;
      delete copy.metadata;
      return Object.values(copy)
        .map((v) => (typeof v === "string" ? v : String(v)))
        .filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

function parseImages(value: string | null | undefined): string[] {
  try {
    if (!value) return [];
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((img) => (typeof img === "string" ? img : ""))
      .filter(Boolean)
      .map((img) => (img.startsWith("/") ? img : `/${img}`));
  } catch {
    return [];
  }
}

function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function rowToProperty(row: DbPropertyRow): Property {
  const parsedUser = safeJsonParse<{
    name?: string;
    avatar?: string | null;
    phone?: string;
    badgeTier?: string;
  }>(row.user);
  const parsedCompany = safeJsonParse<{
    id?: string;
    name?: string;
    logo?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  }>(row.company);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    location: row.location,
    type: (row.type || "SALE").toUpperCase() as Property["type"],
    category: (row.category || "apartments").toLowerCase() as Property["category"],
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    size: row.floorSize ?? 0,
    images: parseImages(row.images),
    features: parseFeatures(row.features),
    userId: "",
    status: row.status || "AVAILABLE",
    agent: parsedUser
      ? {
          name: parsedUser.name || "Unknown Agent",
          image: parsedUser.avatar || null,
          company: parsedCompany?.name || undefined,
          phone: parsedUser.phone,
          whatsapp: parsedUser.phone,
          badgeTier: (parsedUser.badgeTier as BadgeTier) || "NONE",
        }
      : undefined,
    company: parsedCompany?.id
      ? {
          id: parsedCompany.id,
          name: parsedCompany.name || "",
          logo: parsedCompany.logo || "",
          email: parsedCompany.email || "",
          phone: parsedCompany.phone || "",
          website: parsedCompany.website,
        }
      : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function toCandidateSummary(row: DbPropertyRow): string {
  const description = sanitizeForLlm(
    (row.description || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  ).slice(0, DESC_SNIPPET);
  const features = sanitizeForLlm(
    parseFeatures(row.features).slice(0, 3).join(",")
  );
  // Compact one-liner — large free-model prompts cause truncated rankings
  return [
    sanitizeForLlm(row.title || "").slice(0, 60),
    sanitizeForLlm(row.location || ""),
    sanitizeForLlm(`${row.category || ""}/${row.type || ""}`),
    `${row.bedrooms}bd/${row.bathrooms}ba`,
    `KES ${Number(row.price).toLocaleString()}`,
    features,
    description,
  ]
    .filter(Boolean)
    .join(" | ");
}

/** Normalize model scores: some return 0–1 floats, we want 0–100 integers. */
function normalizeScore(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 0 && n <= 1) return Math.round(n * 100);
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Build a focused candidate pool using extracted criteria.
 * Soft keyword scoring is applied in SQL so loosely matching listings still appear.
 *
 * Placeholder params must follow the order they appear in the SQL string:
 * SELECT score expressions first, then WHERE, then LIMIT.
 */
async function fetchCandidates(criteria: AiSearchCriteria): Promise<DbPropertyRow[]> {
  const where: string[] = ["p.status = 'AVAILABLE'"];
  const whereParams: DatabaseValue[] = [];
  const scoreParts: string[] = ["0"];
  const scoreParams: DatabaseValue[] = [];

  if (criteria.listingType) {
    where.push("(UPPER(p.type) = ? OR LOWER(p.type) = ?)");
    whereParams.push(criteria.listingType, criteria.listingType.toLowerCase());
  }

  if (criteria.category) {
    // Soft preference: boost exact category, but still allow others
    scoreParts.push("CASE WHEN UPPER(p.category) = ? THEN 30 ELSE 0 END");
    scoreParams.push(criteria.category.toUpperCase());
  }

  if (criteria.isStudio || criteria.bedrooms === 0) {
    where.push("p.bedrooms = 0");
  } else if (typeof criteria.bedrooms === "number") {
    // Prefer exact, allow nearby (±1) via score
    if (criteria.bedrooms >= 5) {
      where.push("p.bedrooms >= ?");
      whereParams.push(5);
    } else {
      where.push("p.bedrooms BETWEEN ? AND ?");
      whereParams.push(Math.max(0, criteria.bedrooms - 1), criteria.bedrooms + 1);
      scoreParts.push("CASE WHEN p.bedrooms = ? THEN 20 ELSE 5 END");
      scoreParams.push(criteria.bedrooms);
    }
  }

  if (typeof criteria.minPrice === "number" && criteria.minPrice > 0) {
    where.push("p.price >= ?");
    whereParams.push(Math.floor(criteria.minPrice * 0.85));
  }
  if (typeof criteria.maxPrice === "number" && criteria.maxPrice < 999_999_999) {
    where.push("p.price <= ?");
    whereParams.push(Math.ceil(criteria.maxPrice * 1.15));
  }

  if (criteria.location) {
    const loc = criteria.location.trim();
    where.push("(p.location LIKE ? OR p.title LIKE ? OR p.description LIKE ?)");
    whereParams.push(`%${loc}%`, `%${loc}%`, `%${loc}%`);
    scoreParts.push(
      "CASE WHEN p.location LIKE ? THEN 40 WHEN p.title LIKE ? THEN 15 ELSE 5 END"
    );
    scoreParams.push(`%${loc}%`, `%${loc}%`);
  }

  // Soft keyword boosts (do not hard-filter — AI ranks relevance)
  const keywords = (criteria.keywords || []).slice(0, 8);
  for (const kw of keywords) {
    scoreParts.push(
      "CASE WHEN p.title LIKE ? OR p.location LIKE ? OR p.description LIKE ? THEN 4 ELSE 0 END"
    );
    scoreParams.push(`%${kw}%`, `%${kw}%`, `%${kw}%`);
  }

  if (criteria.features?.length) {
    for (const feature of criteria.features.slice(0, 5)) {
      scoreParts.push(
        "CASE WHEN p.features LIKE ? OR p.description LIKE ? THEN 6 ELSE 0 END"
      );
      scoreParams.push(`%${feature}%`, `%${feature}%`);
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const scoreSql = scoreParts.join(" + ");

  // Primary query with filters — params order: score SELECT, WHERE, LIMIT
  let rows = await query<DbPropertyRow>(
    `
      SELECT
        p.*,
        (${scoreSql}) AS relevance_hint,
        JSON_OBJECT(
          'id', u.id, 'name', u.name, 'email', u.email, 'phone', u.phone,
          'role', u.role, 'avatar', u.avatar, 'bio', u.bio, 'badgeTier', u.badgeTier
        ) AS user,
        IF(
          c.id IS NOT NULL,
          JSON_OBJECT(
            'id', c.id, 'name', c.name, 'logo', c.logo, 'email', c.email,
            'phone', c.phone, 'website', c.website, 'address', c.address
          ),
          NULL
        ) AS company
      FROM property p
      LEFT JOIN \`user\` u ON p.userId = u.id
      LEFT JOIN company c ON p.userId = c.userId
      ${whereSql}
      ORDER BY relevance_hint DESC, p.featured DESC, p.createdAt DESC
      LIMIT ?
    `,
    [...scoreParams, ...whereParams, CANDIDATE_POOL]
  );

  // If filters were too tight, broaden (drop location hard filter / price slack already applied)
  if (rows.length < 5 && (criteria.location || criteria.category || criteria.bedrooms !== undefined)) {
    const broadWhere = ["p.status = 'AVAILABLE'"];
    const broadParams: DatabaseValue[] = [];

    if (criteria.listingType) {
      broadWhere.push("(UPPER(p.type) = ? OR LOWER(p.type) = ?)");
      broadParams.push(criteria.listingType, criteria.listingType.toLowerCase());
    }

    if (criteria.maxPrice) {
      broadWhere.push("p.price <= ?");
      broadParams.push(Math.ceil(criteria.maxPrice * 1.5));
    }

    // Soft location in ORDER BY only
    let orderExtra = "";
    if (criteria.location) {
      orderExtra = "CASE WHEN p.location LIKE ? THEN 0 WHEN p.title LIKE ? THEN 1 ELSE 2 END, ";
      broadParams.push(`%${criteria.location}%`, `%${criteria.location}%`);
    }

    rows = await query<DbPropertyRow>(
      `
        SELECT
          p.*,
          JSON_OBJECT(
            'id', u.id, 'name', u.name, 'email', u.email, 'phone', u.phone,
            'role', u.role, 'avatar', u.avatar, 'bio', u.bio, 'badgeTier', u.badgeTier
          ) AS user,
          IF(
            c.id IS NOT NULL,
            JSON_OBJECT(
              'id', c.id, 'name', c.name, 'logo', c.logo, 'email', c.email,
              'phone', c.phone, 'website', c.website, 'address', c.address
            ),
            NULL
          ) AS company
        FROM property p
        LEFT JOIN \`user\` u ON p.userId = u.id
        LEFT JOIN company c ON p.userId = c.userId
        WHERE ${broadWhere.join(" AND ")}
        ORDER BY ${orderExtra}p.featured DESC, p.createdAt DESC
        LIMIT ?
      `,
      [...broadParams, CANDIDATE_POOL]
    );
  }

  // Last resort: recent available listings
  if (rows.length === 0) {
    rows = await query<DbPropertyRow>(
      `
        SELECT
          p.*,
          JSON_OBJECT(
            'id', u.id, 'name', u.name, 'email', u.email, 'phone', u.phone,
            'role', u.role, 'avatar', u.avatar, 'bio', u.bio, 'badgeTier', u.badgeTier
          ) AS user,
          IF(
            c.id IS NOT NULL,
            JSON_OBJECT(
              'id', c.id, 'name', c.name, 'logo', c.logo, 'email', c.email,
              'phone', c.phone, 'website', c.website, 'address', c.address
            ),
            NULL
          ) AS company
        FROM property p
        LEFT JOIN \`user\` u ON p.userId = u.id
        LEFT JOIN company c ON p.userId = c.userId
        WHERE p.status = 'AVAILABLE'
        ORDER BY p.featured DESC, p.createdAt DESC
        LIMIT ?
      `,
      [CANDIDATE_POOL]
    );
  }

  return rows;
}

const SYSTEM_PROMPT = `You are a Kenyan real-estate advisor for VectorAfriq.
Rank listings AND give useful guidance (not only a property list).

Return ONLY one JSON object (no markdown, no prose outside JSON):
{
  "summary": "1-2 sentences on what you found (max 280 chars)",
  "advice": "practical tip for this buyer/renter (max 240 chars)",
  "marketInsight": "brief area/market context for Kenya if relevant (max 240 chars)",
  "matchNotes": "what matched well or trade-offs (max 220 chars)",
  "searchTips": ["up to 3 short refine tips"],
  "criteria": {
    "listingType"?: "SALE"|"RENT"|"AIRBNB",
    "location"?: string,
    "minPrice"?: number,
    "maxPrice"?: number,
    "bedrooms"?: number,
    "category"?: string,
    "features"?: string[]
  },
  "results": [
    { "id": "exact-candidate-id", "relevanceScore": 0-100, "reason": "max 80 chars" }
  ]
}

Rules:
- Use only candidate ids given. Never invent ids or prices.
- Return at most 12 results, best first. Empty results is OK if nothing fits.
- relevanceScore must be an integer 0-100 (not 0-1).
- advice/marketInsight/searchTips should be specific to the user request and Kenya.
- Prefer complete valid JSON over very long text.`;

function buildStats(properties: Property[]): AiSearchStats {
  if (properties.length === 0) {
    return {
      matchCount: 0,
      topLocations: [],
      categories: [],
    };
  }

  const prices = properties
    .map((p) => Number(p.price))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  const beds = properties
    .map((p) => p.bedrooms)
    .filter((n) => typeof n === "number" && Number.isFinite(n));

  const locCounts = new Map<string, number>();
  const catSet = new Set<string>();
  for (const p of properties) {
    const loc = (p.location || "").split(",")[0]?.trim();
    if (loc) locCounts.set(loc, (locCounts.get(loc) || 0) + 1);
    if (p.category) catSet.add(String(p.category));
  }

  const topLocations = [...locCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);

  let bedroomRange: string | undefined;
  if (beds.length) {
    const minB = Math.min(...beds);
    const maxB = Math.max(...beds);
    bedroomRange = minB === maxB ? `${minB}` : `${minB}–${maxB}`;
  }

  const avgPrice =
    prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : undefined;
  const medianPrice =
    prices.length > 0
      ? prices[Math.floor((prices.length - 1) / 2)]
      : undefined;

  return {
    matchCount: properties.length,
    minPrice: prices[0],
    maxPrice: prices[prices.length - 1],
    avgPrice,
    medianPrice,
    bedroomRange,
    topLocations,
    categories: [...catSet].slice(0, 6),
  };
}

function sanitizeStringList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v : String(v || "")))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((s) => s.slice(0, maxLen));
}

function parseInsights(raw: Record<string, unknown>): AiSearchInsights {
  const advice =
    typeof raw.advice === "string" ? raw.advice.trim().slice(0, 320) : undefined;
  const marketInsight =
    typeof raw.marketInsight === "string"
      ? raw.marketInsight.trim().slice(0, 320)
      : undefined;
  const matchNotes =
    typeof raw.matchNotes === "string"
      ? raw.matchNotes.trim().slice(0, 280)
      : undefined;
  const searchTips = sanitizeStringList(raw.searchTips, 3, 120);

  return {
    advice: advice || undefined,
    marketInsight: marketInsight || undefined,
    matchNotes: matchNotes || undefined,
    searchTips: searchTips.length ? searchTips : undefined,
  };
}

function emptyInsights(): AiSearchInsights {
  return {};
}

function fallbackRanking(
  candidates: DbPropertyRow[],
  criteria: AiSearchCriteria,
  maxResults: number,
  summary: string,
  insights: AiSearchInsights = {}
): AiSearchResponse {
  const ranked: AiSearchRankedResult[] = candidates.slice(0, maxResults).map((c) => ({
    id: c.id,
    relevanceScore: 50,
    reason: criteria.location
      ? `Available listing near ${criteria.location}.`
      : "Matched your search filters.",
  }));
  const properties = candidates.slice(0, maxResults).map(rowToProperty);

  return {
    summary,
    criteria,
    insights: {
      advice:
        insights.advice ||
        "Try refining location, budget, or bedrooms for a tighter AI match.",
      marketInsight: insights.marketInsight,
      searchTips: insights.searchTips || [
        "Name a neighbourhood (e.g. Westlands, Kilimani)",
        "Add a budget like under 30M",
        "Mention must-haves such as parking or garden",
      ],
      matchNotes: insights.matchNotes,
    },
    stats: buildStats(properties),
    results: ranked,
    properties,
    candidateCount: candidates.length,
    model: AI_SEARCH_MODEL,
    usedFallback: true,
  };
}

/**
 * Run AI property search against the system database.
 */
export async function runAiPropertySearch(
  rawPrompt: string,
  options: AiSearchRequestOptions = {}
): Promise<AiSearchResponse> {
  const prompt = rawPrompt.trim().slice(0, MAX_PROMPT_CHARS);
  const previousPrompt = options.previousPrompt?.trim().slice(0, MAX_PROMPT_CHARS);
  const maxResults = Math.min(
    Math.max(1, options.maxResults ?? DEFAULT_MAX_RESULTS),
    48
  );

  // Combine follow-up refinements with the original request for better matching
  const combinedPrompt = previousPrompt
    ? `${previousPrompt}\n\nAdditional preferences / refinement: ${prompt}`.slice(
        0,
        MAX_PROMPT_CHARS * 2
      )
    : prompt;

  const heuristic = extractCriteriaFromPrompt(
    combinedPrompt,
    options.listingTypeHint
  );
  const candidates = await fetchCandidates(heuristic);
  const candidateCount = candidates.length;

  if (candidateCount === 0) {
    return {
      summary:
        "No available properties were found in the database for your request. Try broadening the location or price range.",
      criteria: heuristic,
      insights: {
        advice:
          "Widen the area, raise the budget slightly, or drop a must-have feature and search again.",
        searchTips: [
          "Try a nearby neighbourhood",
          "Increase max budget by 10–20%",
          "Search without bedrooms filter first",
        ],
      },
      stats: buildStats([]),
      results: [],
      properties: [],
      candidateCount: 0,
      model: AI_SEARCH_MODEL,
    };
  }

  const buildUserPrompt = (pool: DbPropertyRow[]) => `USER REQUEST:
"""
${combinedPrompt}
"""
${previousPrompt ? "(Includes original request + follow-up refinement.)\n" : ""}
FILTERS: ${JSON.stringify(heuristic)}

CANDIDATES (id | details) — rank best matches (max ${maxResults}) and give advice/market insight:
${pool.map((c) => `${c.id} | ${toCandidateSummary(c)}`).join("\n")}`;

  const parseRanking = (
    raw: string,
    pool: DbPropertyRow[]
  ): {
    summary: string;
    criteria: AiSearchCriteria;
    insights: AiSearchInsights;
    ranked: AiSearchRankedResult[];
  } | null => {
    const parsed = extractJsonObject(raw);
    if (!parsed) return null;

    const data = parsed as {
      summary?: string;
      criteria?: AiSearchCriteria;
      results?: Array<{ id: string; relevanceScore?: number; reason?: string }>;
    };

    const criteria = mergeCriteria(heuristic, data.criteria);
    const insights = parseInsights(parsed);
    const validIds = new Set(pool.map((c) => c.id));
    const seen = new Set<string>();
    const ranked = (data.results || [])
      .filter((r) => r && typeof r.id === "string" && validIds.has(r.id))
      .map((r) => ({
        id: r.id,
        relevanceScore: normalizeScore(r.relevanceScore),
        reason: (r.reason || "").toString().slice(0, 120),
      }))
      .filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    return {
      summary: (data.summary || "").toString().slice(0, 320),
      criteria,
      insights,
      ranked,
    };
  };

  try {
    // First attempt: full candidate pool with higher output budget
    let pool = candidates;
    let messages: AiSearchLLMMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(pool) },
    ];

    let response = await callAiSearchLLM(messages, {
      temperature: 0.25,
      maxTokens: LLM_MAX_TOKENS,
    });

    console.info(
      `[AI SEARCH] LLM ok finish=${response.finishReason} tokens=${response.usage.completionTokens} contentChars=${response.content.length}`
    );

    let parsed = parseRanking(response.content, pool);

    // Retry once with a smaller pool if JSON truncated / unusable
    if (
      !parsed ||
      parsed.ranked.length === 0 ||
      response.finishReason === "length"
    ) {
      console.warn(
        `[AI SEARCH] Retrying with smaller pool (finish=${response.finishReason}, parsed=${Boolean(parsed)}, ranked=${parsed?.ranked.length ?? 0})`
      );
      pool = candidates.slice(0, 16);
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(pool) },
      ];
      response = await callAiSearchLLM(messages, {
        temperature: 0.2,
        maxTokens: LLM_RETRY_MAX_TOKENS,
      });
      const retryParsed = parseRanking(response.content, pool);
      if (retryParsed && (retryParsed.ranked.length > 0 || !parsed)) {
        parsed = retryParsed;
      }
    }

    if (!parsed) {
      throw new Error("Model did not return parseable JSON after retry");
    }

    if (parsed.ranked.length === 0) {
      return fallbackRanking(
        candidates,
        parsed.criteria,
        maxResults,
        parsed.summary ||
          "I understood your request but could not confidently rank matches. Showing the closest listings from our database.",
        parsed.insights
      );
    }

    const byId = new Map(candidates.map((c) => [c.id, c]));
    const properties = parsed.ranked
      .map((r) => byId.get(r.id))
      .filter((c): c is DbPropertyRow => Boolean(c))
      .map(rowToProperty);

    return {
      summary:
        parsed.summary ||
        `Found ${parsed.ranked.length} relevant ${
          parsed.ranked.length === 1 ? "property" : "properties"
        } for your request.`,
      criteria: parsed.criteria,
      insights: {
        ...emptyInsights(),
        ...parsed.insights,
      },
      stats: buildStats(properties),
      results: parsed.ranked,
      properties,
      candidateCount,
      model: response.model || AI_SEARCH_MODEL,
      usedFallback: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[AI SEARCH] LLM ranking failed:", message);
    return fallbackRanking(
      candidates,
      heuristic,
      maxResults,
      "We found properties matching your filters, but AI ranking could not complete. Showing the closest database matches — try a shorter or more specific description."
    );
  }
}
