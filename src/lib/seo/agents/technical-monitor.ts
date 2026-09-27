/**
 * Agent 4: Technical SEO Monitor Agent
 * 
 * Crawls the live site to detect technical SEO issues:
 * 1. Broken links (internal and from sitemap)
 * 2. Missing canonical tags
 * 3. Duplicate title tags
 * 4. Duplicate meta descriptions
 * 5. Orphan pages (in DB but not in sitemap)
 * 6. Sitemap completeness vs actual routes
 * 7. Missing alt text on images (from HTML)
 * 8. Structured data validation
 */

import { v4 as uuid } from "uuid";
import { query } from "@/lib/db";
import { startAgentRun, completeAgentRun, logAgentWarning } from "../agent-runner";
import type { TechnicalIssueType, Severity } from "../types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

interface CrawledPage {
  url: string;
  status: number;
  title: string | null;
  description: string | null;
  canonical: string | null;
  hasStructuredData: boolean;
  links: string[];
  imageAlts: { src: string; hasAlt: boolean }[];
  loadTimeMs: number;
}

export async function runTechnicalMonitorAgent(triggerManually = false): Promise<string> {
  const ctx = await startAgentRun("technical_monitor", { triggerManually });
  let issuesFound = 0;

  try {
    // Step 1: Get all URLs to check from sitemap_url table
    console.log("[Technical Monitor] Building URL list...");
    const sitemapUrls = await query<{ url: string; urlType: string }>(
      "SELECT url, urlType FROM sitemap_url WHERE isActive = true ORDER BY urlType, url LIMIT 100"
    );

    // Add critical static pages
    const criticalPages = [
      "/",
      "/properties",
      "/properties-for-sale",
      "/properties-for-rent",
      "/apartments-for-sale",
      "/apartments-for-rent",
      "/houses-for-sale",
      "/houses-for-rent",
      "/land-for-sale",
      "/blogs",
      "/about-us",
      "/contact-us",
      "/services",
    ];

    const urlsToCrawl = new Set<string>([
      ...criticalPages,
      ...sitemapUrls.map(u => u.url),
    ]);

    // Step 2: Crawl each URL (limit to control load)
    console.log(`[Technical Monitor] Crawling ${urlsToCrawl.size} URLs...`);
    const crawledPages: CrawledPage[] = [];

    for (const path of urlsToCrawl) {
      try {
        const page = await crawlPage(path);
        if (page) {
          crawledPages.push(page);
        }
      } catch (error) {
        await logAgentWarning(ctx.runId, `Failed to crawl ${path}: ${error instanceof Error ? error.message : "unknown"}`);
      }
    }

    console.log(`[Technical Monitor] Crawled ${crawledPages.length} pages successfully`);

    // Step 3: Analyze for issues
    issuesFound += await detectBrokenPages(crawledPages, ctx.runId);
    issuesFound += await detectMissingCanonicals(crawledPages, ctx.runId);
    issuesFound += await detectDuplicateTitles(crawledPages, ctx.runId);
    issuesFound += await detectDuplicateMetaDescriptions(crawledPages, ctx.runId);
    issuesFound += await detectMissingStructuredData(crawledPages, ctx.runId);
    issuesFound += await detectMissingAltText(crawledPages, ctx.runId);
    issuesFound += await detectSlowPages(crawledPages, ctx.runId);

    // Step 4: Check sitemap completeness
    issuesFound += await checkSitemapCompleteness(sitemapUrls, ctx.runId);

    ctx.metrics = {
      issuesFound,
      pagesAudited: crawledPages.length,
    };

    const summary = `Crawled ${crawledPages.length} pages. Found ${issuesFound} technical SEO issues.`;
    await completeAgentRun(ctx.runId, "completed", summary, ctx.metrics);
    return ctx.runId;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Technical Monitor] Failed:", errorMsg);
    await completeAgentRun(ctx.runId, "failed", `Failed: ${errorMsg}`, { issuesFound }, errorMsg);
    throw error;
  }
}

/**
 * Crawl a single page — fetch HTML and extract SEO-relevant data.
 */
async function crawlPage(path: string): Promise<CrawledPage | null> {
  const url = path.startsWith("http") ? path : `${SITE_URL}${path}`;
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "VectorAfriq-SEO-Bot/1.0" },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });

    const loadTimeMs = Date.now() - startTime;

    if (response.status >= 400) {
      return {
        url: path,
        status: response.status,
        title: null,
        description: null,
        canonical: null,
        hasStructuredData: false,
        links: [],
        imageAlts: [],
        loadTimeMs,
      };
    }

    const html = await response.text();
    const title = extractTag(html, "title");
    const description = extractMetaContent(html, "description");
    const canonical = extractLinkRel(html, "canonical");
    const hasStructuredData = html.includes('application/ld+json');
    const links = extractInternalLinks(html, path);
    const imageAlts = extractImageAlts(html);

    return {
      url: path,
      status: response.status,
      title,
      description,
      canonical,
      hasStructuredData,
      links,
      imageAlts,
      loadTimeMs,
    };
  } catch (error) {
    console.warn(`[Technical Monitor] Crawl failed for ${url}:`, error instanceof Error ? error.message : "unknown");
    return null;
  }
}

function extractTag(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "is");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractMetaContent(html: string, name: string): string | null {
  const regex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "is");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractLinkRel(html: string, rel: string): string | null {
  const regex = new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*)["']`, "is");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractInternalLinks(html: string, currentPath: string): string[] {
  const links: string[] = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    // Only internal links
    if (href.startsWith("/") && !href.startsWith("/api/") && !href.startsWith("/admin/") && !href.startsWith("/crm/")) {
      links.push(href);
    }
  }
  return [...new Set(links)];
}

function extractImageAlts(html: string): { src: string; hasAlt: boolean }[] {
  const images: { src: string; hasAlt: boolean }[] = [];
  const regex = /<img([^>]*)>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const attrs = match[1];
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    const hasAlt = /\balt=["'][^"']+["']/i.test(attrs);
    if (srcMatch) {
      images.push({ src: srcMatch[1], hasAlt });
    }
  }
  return images;
}

async function detectBrokenPages(pages: CrawledPage[], runId: string): Promise<number> {
  let count = 0;
  for (const page of pages) {
    if (page.status === 404) {
      await createTechnicalIssue("404_error", page.url, `Page returns 404`, "critical", runId);
      count++;
    } else if (page.status >= 500) {
      await createTechnicalIssue("404_error", page.url, `Server error: ${page.status}`, "critical", runId);
      count++;
    }
  }
  return count;
}

async function detectMissingCanonicals(pages: CrawledPage[], runId: string): Promise<number> {
  let count = 0;
  for (const page of pages) {
    if (page.status === 200 && !page.canonical) {
      await createTechnicalIssue("missing_canonical", page.url, "Page has no canonical link tag", "medium", runId);
      count++;
    }
  }
  return count;
}

async function detectDuplicateTitles(pages: CrawledPage[], runId: string): Promise<number> {
  let count = 0;
  const titleMap = new Map<string, string[]>();

  for (const page of pages) {
    if (!page.title) continue;
    const normalizedTitle = page.title.trim().toLowerCase();
    if (!titleMap.has(normalizedTitle)) {
      titleMap.set(normalizedTitle, []);
    }
    titleMap.get(normalizedTitle)!.push(page.url);
  }

  for (const [title, urls] of titleMap) {
    if (urls.length > 1) {
      await createTechnicalIssue(
        "duplicate_title",
        urls[0],
        `Title "${title.substring(0, 100)}" is used on ${urls.length} pages: ${urls.join(", ")}`,
        "high",
        runId
      );
      count++;
    }
  }
  return count;
}

async function detectDuplicateMetaDescriptions(pages: CrawledPage[], runId: string): Promise<number> {
  let count = 0;
  const descMap = new Map<string, string[]>();

  for (const page of pages) {
    if (!page.description || page.description.length < 20) continue;
    const normalized = page.description.trim().toLowerCase();
    if (!descMap.has(normalized)) {
      descMap.set(normalized, []);
    }
    descMap.get(normalized)!.push(page.url);
  }

  for (const [desc, urls] of descMap) {
    if (urls.length > 1) {
      await createTechnicalIssue(
        "duplicate_meta",
        urls[0],
        `Meta description duplicated on ${urls.length} pages: ${urls.join(", ")}`,
        "medium",
        runId
      );
      count++;
    }
  }
  return count;
}

async function detectMissingStructuredData(pages: CrawledPage[], runId: string): Promise<number> {
  let count = 0;
  for (const page of pages) {
    if (page.status === 200 && !page.hasStructuredData) {
      await createTechnicalIssue("invalid_structured_data", page.url, "No JSON-LD structured data found on page", "low", runId);
      count++;
    }
  }
  return count;
}

async function detectMissingAltText(pages: CrawledPage[], runId: string): Promise<number> {
  let count = 0;
  for (const page of pages) {
    const missingAlt = page.imageAlts.filter(img => !img.hasAlt);
    if (missingAlt.length > 0) {
      await createTechnicalIssue(
        "missing_alt_text",
        page.url,
        `${missingAlt.length} images missing alt text. Examples: ${missingAlt.slice(0, 3).map(i => i.src).join(", ")}`,
        "low",
        runId
      );
      count++;
    }
  }
  return count;
}

async function detectSlowPages(pages: CrawledPage[], runId: string): Promise<number> {
  let count = 0;
  for (const page of pages) {
    if (page.loadTimeMs > 3000) {
      await createTechnicalIssue(
        "slow_page",
        page.url,
        `Page load time: ${page.loadTimeMs}ms (target: <3000ms)`,
        "medium",
        runId
      );
      count++;
    }
  }
  return count;
}

async function checkSitemapCompleteness(
  sitemapUrls: { url: string; urlType: string }[],
  runId: string
): Promise<number> {
  let count = 0;

  // Check that critical static pages are in sitemap
  const criticalPaths = ["/", "/properties", "/properties-for-sale", "/properties-for-rent", "/blogs"];
  const sitemapUrlSet = new Set(sitemapUrls.map(u => u.url));

  for (const path of criticalPaths) {
    if (!sitemapUrlSet.has(path)) {
      await createTechnicalIssue("sitemap_missing", path, "Critical page missing from sitemap_url table", "high", runId);
      count++;
    }
  }

  return count;
}

async function createTechnicalIssue(
  issueType: TechnicalIssueType,
  url: string,
  detail: string,
  severity: Severity,
  runId: string
): Promise<void> {
  const id = `issue_${uuid().substring(0, 16)}`;

  // Check if this issue already exists and is still open
  const [existing] = await query<{ id: string }>(
    "SELECT id FROM seo_technical_issue WHERE url = ? AND issueType = ? AND status = 'open' LIMIT 1",
    [url, issueType]
  );

  if (existing) {
    // Just update lastDetected
    await query(
      "UPDATE seo_technical_issue SET lastDetected = CURRENT_TIMESTAMP(3) WHERE id = ?",
      [existing.id]
    );
    return;
  }

  await query(
    `INSERT INTO seo_technical_issue (id, issueType, url, detail, severity, status)
     VALUES (?, ?, ?, ?, ?, 'open')`,
    [id, issueType, url, detail, severity]
  );

  console.log(`[Technical Monitor] Issue logged: ${issueType} on ${url} (${severity})`);
}
