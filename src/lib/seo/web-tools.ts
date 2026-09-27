/**
 * SEO Web Tools
 * 
 * Real web data collection for SEO agents:
 * 1. Google Autocomplete suggestions (keyword expansion from live search data)
 * 2. SERP scraping (DuckDuckGo + Bing) — find who ranks + what they rank with
 * 3. Competitor page analysis — extract titles, headings, keyword density
 * 4. Related searches extraction ("people also search for")
 * 
 * No API keys required — uses free public endpoints.
 */

const TIMEOUT_MS = 10000;
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AutocompleteSuggestion {
  keyword: string;
  source: "google" | "bing";
}

export interface SerpResult {
  position: number;
  url: string;
  title: string;
  domain: string;
  snippet?: string;
}

export interface CompetitorPageData {
  url: string;
  title: string;
  metaDescription: string;
  h1Tags: string[];
  h2Tags: string[];
  wordCount: number;
  topKeywords: { word: string; count: number }[];
  internalLinks: string[];
  hasStructuredData: boolean;
}

export interface SerpInsights {
  results: SerpResult[];
  relatedSearches: string[];
  ourPosition: number | null;
  ourUrl: string | null;
  competitors: { domain: string; position: number; url: string; title: string }[];
}

// ─── 1. Google Autocomplete ──────────────────────────────────────────────────

/**
 * Fetch Google Autocomplete suggestions for a seed keyword.
 * Uses Google's public suggest API (returns JSONP-like data).
 */
export async function getGoogleAutocomplete(
  seedKeyword: string,
  maxResults = 15
): Promise<AutocompleteSuggestion[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(
    seedKeyword + " kenya"
  )}`;

  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const suggestions: string[] = Array.isArray(data[1]) ? data[1] : [];

    return suggestions
      .slice(0, maxResults)
      .map(s => ({ keyword: s.trim(), source: "google" as const }));
  } catch {
    return [];
  }
}

/**
 * Fetch Bing autocomplete suggestions as a secondary source.
 */
export async function getBingAutocomplete(
  seedKeyword: string,
  maxResults = 10
): Promise<AutocompleteSuggestion[]> {
  const url = `https://www.bing.com/AS/Suggestions?q=${encodeURIComponent(
    seedKeyword + " kenya"
  )}&mkt=en-US&it=A`;

  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return [];

    const html = await response.text();
    const suggestions: string[] = [];

    // Bing returns <li> elements with suggestion text
    const regex = /<li[^>]*>(.*?)<\/li>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]*>/g, "").trim();
      if (text.length > 5) suggestions.push(text);
    }

    return suggestions.slice(0, maxResults).map(s => ({ keyword: s, source: "bing" as const }));
  } catch {
    return [];
  }
}

/**
 * Batch autocomplete: expand a seed keyword across multiple modifier prefixes.
 * This generates comprehensive long-tail variations from real search data.
 */
export async function getExpandedAutocomplete(
  seedKeyword: string
): Promise<AutocompleteSuggestion[]> {
  const modifiers = [
    "", // base
    "best ",
    "affordable ",
    "cheap ",
    "luxury ",
    "2 bedroom ",
    "3 bedroom ",
    "furnished ",
    "prices ",
  ];

  const allPromises = modifiers.map(mod =>
    getGoogleAutocomplete(`${mod}${seedKeyword}`, 10)
  );

  // Also get Bing base suggestions
  allPromises.push(getBingAutocomplete(seedKeyword, 8));

  const results = await Promise.allSettled(allPromises);

  const suggestions: AutocompleteSuggestion[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const s of result.value) {
        const lower = s.keyword.toLowerCase();
        if (!seen.has(lower) && s.keyword.length > 5) {
          seen.add(lower);
          suggestions.push(s);
        }
      }
    }
  }

  return suggestions;
}

// ─── 2. SERP Scraping ────────────────────────────────────────────────────────

/**
 * Fetch SERP results for a keyword from DuckDuckGo HTML endpoint.
 * Returns parsed results with positions, titles, and domains.
 */
export async function getSerpResults(keyword: string, maxResults = 50): Promise<SerpResult[]> {
  const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`;

  try {
    const response = await fetch(ddgUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return [];

    const html = await response.text();
    return parseDdgResults(html, maxResults);
  } catch {
    return [];
  }
}

/**
 * Get full SERP insights: results + related searches + our position + competitor list.
 */
export async function getSerpInsights(
  keyword: string,
  ourDomain = "vectorafriqproperties.co.ke"
): Promise<SerpInsights> {
  const results = await getSerpResults(keyword, 50);

  // Find our position
  const ourResult = results.find(r => r.domain.includes(ourDomain));

  // Extract competitor domains (top 10 excluding ourselves)
  const competitors = results
    .filter(r => !r.domain.includes(ourDomain))
    .slice(0, 10)
    .map(r => ({ domain: r.domain, position: r.position, url: r.url, title: r.title }));

  // Extract related searches from DDG
  const relatedSearches = await getRelatedSearches(keyword);

  return {
    results,
    relatedSearches,
    ourPosition: ourResult?.position || null,
    ourUrl: ourResult?.url || null,
    competitors,
  };
}

/**
 * Parse DuckDuckGo HTML results.
 */
function parseDdgResults(html: string, maxResults: number): SerpResult[] {
  const results: SerpResult[] = [];
  const linkRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
  let match;
  let position = 1;

  while ((match = linkRegex.exec(html)) !== null && position <= maxResults) {
    const rawUrl = match[1];
    const titleHtml = match[2];
    const title = titleHtml.replace(/<[^>]*>/g, "").trim();

    let actualUrl = rawUrl;
    try {
      if (rawUrl.includes("uddg=")) {
        const url = new URL(rawUrl, "https://duckduckgo.com");
        const uddg = url.searchParams.get("uddg");
        if (uddg) actualUrl = decodeURIComponent(uddg);
      }
    } catch {
      // keep raw
    }

    let domain = "";
    try {
      domain = new URL(actualUrl).hostname;
    } catch {
      domain = actualUrl;
    }

    // Extract snippet from adjacent result__snippet
    const snippetRegex = new RegExp(
      `class="[^"]*result__snippet[^"]*"[^>]*>(.*?)</(?:a|div|span)>`,
      "is"
    );
    let snippet: string | undefined;
    const remainingHtml = html.substring(match.index + match[0].length);
    const snippetMatch = remainingHtml.match(snippetRegex);
    if (snippetMatch) {
      snippet = snippetMatch[1].replace(/<[^>]*>/g, "").trim();
    }

    results.push({ position, url: actualUrl, title, domain, snippet });
    position++;
  }

  return results;
}

// ─── 3. Related Searches ─────────────────────────────────────────────────────

/**
 * Extract "related searches" / "people also search for" from DuckDuckGo.
 */
export async function getRelatedSearches(keyword: string): Promise<string[]> {
  const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`;

  try {
    const response = await fetch(ddgUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return [];

    const html = await response.text();

    // DDG related searches are in elements with class "related_search"
    const related: string[] = [];
    const regex = /<a[^>]*class="[^"]*related_search[^"]*"[^>]*>(.*?)<\/a>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]*>/g, "").trim();
      if (text.length > 3) related.push(text);
    }

    return related;
  } catch {
    return [];
  }
}

// ─── 4. Competitor Page Analysis ─────────────────────────────────────────────

/**
 * Analyze a competitor's page: extract titles, headings, keyword density, word count.
 * This tells us what content format and keywords are working for them.
 */
export async function analyzeCompetitorPage(url: string): Promise<CompetitorPageData | null> {
  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "follow",
    });

    if (!response.ok) return null;

    const html = await response.text();

    return {
      url,
      title: extractTag(html, "title") || "",
      metaDescription: extractMetaContent(html, "description") || "",
      h1Tags: extractHeadings(html, "h1"),
      h2Tags: extractHeadings(html, "h2"),
      wordCount: countWords(html),
      topKeywords: extractTopKeywords(html),
      internalLinks: extractInternalLinks(html, url),
      hasStructuredData: html.includes("application/ld+json"),
    };
  } catch {
    return null;
  }
}

/**
 * Analyze multiple competitor pages in parallel.
 */
export async function analyzeCompetitors(
  competitorUrls: string[],
  maxConcurrent = 3
): Promise<CompetitorPageData[]> {
  const results: CompetitorPageData[] = [];

  // Process in batches to avoid rate limiting
  for (let i = 0; i < competitorUrls.length; i += maxConcurrent) {
    const batch = competitorUrls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.allSettled(batch.map(url => analyzeCompetitorPage(url)));

    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    }

    // Small delay between batches
    if (i + maxConcurrent < competitorUrls.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}

// ─── HTML Parsing Helpers ────────────────────────────────────────────────────

function extractTag(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "is");
  const match = html.match(regex);
  return match ? match[1].replace(/<[^>]*>/g, "").trim() : null;
}

function extractMetaContent(html: string, name: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:name|property)=["'](?:og:)?${name}["'][^>]*content=["']([^"']*)["']`,
    "is"
  );
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractHeadings(html: string, level: string): string[] {
  const headings: string[] = [];
  const regex = new RegExp(`<${level}[^>]*>(.*?)</${level}>`, "gis");
  let match;

  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, "").trim();
    if (text.length > 2) headings.push(text);
  }

  return headings;
}

function countWords(html: string): number {
  // Strip scripts, styles, and tags
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .trim();

  return text.split(/\s+/).filter(w => w.length > 2).length;
}

function extractTopKeywords(html: string): { word: string; count: number }[] {
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .toLowerCase();

  const stopWords = new Set([
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was",
    "one", "our", "out", "day", "get", "has", "him", "his", "how", "man", "new",
    "now", "old", "see", "two", "way", "who", "boy", "did", "its", "let", "put",
    "say", "she", "too", "use", "with", "this", "that", "from", "they", "will",
    "would", "there", "their", "what", "about", "which", "when", "your", "have",
    "more", "been", "want", "into", "them", "than", "then", "any", "these",
    "may", "each", "such", "very", "also", "just", "like", "make", "were",
  ]);

  const wordCount = new Map<string, number>();
  const words = text.match(/[a-z]{4,}/g) || [];

  for (const word of words) {
    if (stopWords.has(word)) continue;
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  return Array.from(wordCount.entries())
    .map(([word, count]) => ({ word, count }))
    .filter(k => k.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  let domain = "";
  try {
    domain = new URL(baseUrl).hostname;
  } catch {
    return [];
  }

  const regex = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith("http") && href.includes(domain)) {
      links.add(href);
    } else if (href.startsWith("/") && !href.startsWith("//")) {
      links.add(href);
    }
  }

  return Array.from(links).slice(0, 30);
}
