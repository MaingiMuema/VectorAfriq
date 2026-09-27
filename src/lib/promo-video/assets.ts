/**
 * Promo Video — asset resolution.
 *
 * For every image a scene needs (listing items, service cards) this module
 * finds and downloads a suitable asset. Sources are tried in order until one
 * succeeds:
 *
 *   1. Admin-uploaded assets (passed at job creation)
 *   2. Pexels free stock (needs PEXELS_API_KEY)
 *   3. Unsplash free stock (needs UNSPLASH_ACCESS_KEY)
 *   4. Real platform property photos (this app's own image service — always
 *      available, and the most relevant for a property marketplace)
 *   5. AI-generated image via OpenRouter (qwen/qwen-image-3-pro)
 *   6. Bundled default image (final fallback so a render never breaks)
 *
 * Every resolved image is normalized (re-encoded JPEG, max 1600px) with
 * `sharp` and written to <jobDir>/assets/images/resolved/<n>.jpg. The script
 * items are updated in place so the renderer can reference them.
 */

import { copyFileSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import sharp from "sharp";
import { query } from "@/lib/db";
import { generateImage } from "./llm";
import type { JobScript, ResolvedAsset } from "./types";

const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || "http://localhost:3001";

const DEFAULT_FALLBACK_IMAGES = [
  "house1.jpg",
  "house2.jpg",
  "house3.jpg",
  "house4.jpg",
  "hero.jpeg",
];

// ─── image requests ───────────────────────────────────────────────────────────

interface ImageRequest {
  /** Stable label used for progress + manifest, e.g. "listing[1]" */
  key: string;
  query: string;
  /** Path into the script object, e.g. ["scenes", 2, "items", 0, "image"] */
  setter: (script: JobScript, file: string) => void;
}

function collectImageRequests(script: JobScript): ImageRequest[] {
  const requests: ImageRequest[] = [];
  script.scenes.forEach((scene, i) => {
    if (scene.type === "listing") {
      (scene.items || []).forEach((item, j) => {
        if (!item || typeof item !== "object") return;
        requests.push({
          key: `listing[${j}]`,
          query: (item as { imageQuery?: string }).imageQuery || "modern home",
          setter: (s, file) => {
            (s.scenes[i].items as { image?: string }[])[j].image = file;
          },
        });
      });
    } else if (scene.type === "services") {
      (scene.items || []).forEach((item, j) => {
        if (!item || typeof item !== "object") return;
        requests.push({
          key: `services[${j}]`,
          query: (item as { imageQuery?: string }).imageQuery || "modern real estate",
          setter: (s, file) => {
            (s.scenes[i].items as { image?: string }[])[j].image = file;
          },
        });
      });
    }
  });
  return requests;
}

// ─── low-level download helpers ───────────────────────────────────────────────

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

/** fetch with a hard timeout so a hung stock API can't stall a job forever. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 15_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function downloadBuffer(url: string, timeoutMs = 20_000): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "VectorAfriq-PromoVideo/1.0" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`download failed (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) {
      throw new Error(`unexpected size ${buf.length}`);
    }
    return buf;
  } finally {
    clearTimeout(timer);
  }
}

/** Validate + normalize an arbitrary image buffer to a max-1600px JPEG. */
async function toJpeg(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer);
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error("not an image");
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(meta.width, meta.height));
  const width = Math.round((meta.width * scale) / 2) * 2;
  const height = Math.round((meta.height * scale) / 2) * 2;
  return sharp(buffer)
    .rotate()
    .resize({ width, height, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
}

async function tryDownloadToFile(
  url: string,
  dest: string
): Promise<boolean> {
  try {
    const buf = await downloadBuffer(url);
    const jpeg = await toJpeg(buf);
    writeFileSync(dest, jpeg);
    return true;
  } catch (err) {
    console.warn(`[PromoVideo] image download failed for ${url}:`, (err as Error).message);
    return false;
  }
}

// ─── sources ──────────────────────────────────────────────────────────────────

let uploadQueue: string[] = [];
export function setUploadedAssets(urls: string[]) {
  uploadQueue = urls.filter((u) => typeof u === "string" && u.length > 0);
}

async function fromUpload(dest: string): Promise<boolean> {
  while (uploadQueue.length > 0) {
    const url = uploadQueue.shift() as string;
    const abs = url.startsWith("/") ? `${IMAGE_SERVICE_URL}${url}` : url;
    if (await tryDownloadToFile(abs, dest)) return true;
  }
  return false;
}

async function fromPexels(dest: string, queryText: string): Promise<boolean> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return false;
  try {
    const res = await fetchWithTimeout(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(queryText)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    if (!res.ok) return false;
    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return false;
    const url = photo.src?.large2x || photo.src?.large || photo.src?.original;
    if (!url) return false;
    return tryDownloadToFile(url, dest);
  } catch {
    return false;
  }
}

async function fromUnsplash(dest: string, queryText: string): Promise<boolean> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return false;
  try {
    const res = await fetchWithTimeout(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(queryText)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return false;
    const data = await res.json();
    const photo = data.results?.[0];
    if (!photo) return false;
    const url = photo.urls?.regular || photo.urls?.full;
    if (!url) return false;
    return tryDownloadToFile(url, dest);
  } catch {
    return false;
  }
}

let platformImageQueue: string[] | null = null;
// Shared cursor so the cached queue is never mutated — every job continues
// where the previous one left off instead of silently disabling the source.
let platformCursor = 0;

/**
 * Stored property image paths look like "/properties/<propertyId>/<filename>"
 * (and older rows may carry "/api/images/..." prefixes). The image service
 * serves files at "/images/<propertyId>/<filename>" — the "properties"
 * segment and API prefixes are NOT part of the service path, so they must be
 * stripped. Returns a fully-qualified URL the service can serve.
 */
function toServiceImageUrl(storedPath: string): string {
  if (storedPath.startsWith("http")) return storedPath;
  // Normalize to a slash-less path so both "/properties/<id>/<file>" and
  // "properties/<id>/<file>" (no leading slash) are handled.
  let path = storedPath.replace(/^\/+/, "");
  for (const prefix of [
    "api/images/serve/",
    "api/images/",
    "images/",
    "properties/",
  ]) {
    if (path.startsWith(prefix)) {
      path = path.slice(prefix.length);
      break;
    }
  }
  return `${IMAGE_SERVICE_URL}/images/${path}`;
}

async function loadPlatformImages(): Promise<string[]> {
  if (platformImageQueue) return platformImageQueue;
  try {
    const rows = await query<{ images: string }>(
      `SELECT images FROM property
       WHERE status = 'AVAILABLE' AND images IS NOT NULL AND images != '[]'
       ORDER BY featured DESC, createdAt DESC LIMIT 120`
    );
    const urls: string[] = [];
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.images);
        if (!Array.isArray(parsed)) continue;
        for (const p of parsed) {
          if (typeof p !== "string" || !p.trim()) continue;
          const trimmed = p.trim();
          urls.push(toServiceImageUrl(trimmed));
        }
      } catch {
        // skip malformed rows
      }
    }
    platformImageQueue = urls;
  } catch (err) {
    console.warn("[PromoVideo] Failed to load platform images:", (err as Error).message);
    platformImageQueue = [];
  }
  return platformImageQueue;
}

async function fromPlatform(dest: string): Promise<boolean> {
  const urls = await loadPlatformImages();
  while (platformCursor < urls.length) {
    const url = urls[platformCursor++];
    if (await tryDownloadToFile(url, dest)) return true;
  }
  return false;
}

async function fromAi(dest: string, queryText: string): Promise<boolean> {
  try {
    const { buffer, mediaType } = await generateImage(queryText, "16:9");
    const jpeg = await toJpeg(buffer);
    writeFileSync(dest, jpeg);
    return true;
  } catch (err) {
    console.warn("[PromoVideo] AI image generation failed:", (err as Error).message);
    return false;
  }
}

async function fromFallback(dest: string, promoRoot: string): Promise<boolean> {
  const pool = DEFAULT_FALLBACK_IMAGES;
  const name = pool[Math.floor(Math.random() * pool.length)];
  const src = join(promoRoot, "assets", "images", name);
  try {
    copyFileSync(src, dest);
    return true;
  } catch {
    return false;
  }
}

// ─── main entry ───────────────────────────────────────────────────────────────

export interface ResolveResult {
  script: JobScript;
  assets: ResolvedAsset[];
}

/**
 * Resolve images for every image request in the script. Mutates a deep copy of
 * the script (setting `.image` filenames) and writes normalized files to the
 * job's assets dir.
 */
export async function resolveAssets(
  script: JobScript,
  jobId: string,
  promoRoot: string,
  onProgress?: (done: number, total: number, key: string) => void
): Promise<ResolveResult> {
  const workScript: JobScript = JSON.parse(JSON.stringify(script));
  const resolvedDir = join(process.cwd(), ".promo-videos", jobId, "assets", "images", "resolved");
  mkdirSync(resolvedDir, { recursive: true });

  const requests = collectImageRequests(workScript);
  const assets: ResolvedAsset[] = [];
  let index = 0;

  const sourceOrder: Array<{ key: string; run: (dest: string, query: string) => Promise<boolean> }> = [
    { key: "upload", run: (dest, _q) => fromUpload(dest) },
    { key: "pexels", run: fromPexels },
    { key: "unsplash", run: fromUnsplash },
    { key: "platform", run: (_dest, _q) => fromPlatform(_dest) },
    { key: "ai", run: fromAi },
    { key: "fallback", run: (_dest, _q) => fromFallback(_dest, promoRoot) },
  ];

  for (const request of requests) {
    const dest = join(resolvedDir, `${index}.jpg`);
    let usedSource: ResolvedAsset["source"] | null = null;

    for (const source of sourceOrder) {
      try {
        if (await source.run(dest, request.query)) {
          usedSource = source.key as ResolvedAsset["source"];
          break;
        }
      } catch {
        // try next source
      }
    }

    // Always set an image so the renderer never hits an undefined staticFile.
    const file = usedSource ? `resolved/${index}.jpg` : "house1.jpg";
    request.setter(workScript, file);
    assets.push({
      source: usedSource ?? "fallback",
      usedFor: request.key,
      file,
    });
    index++;
    onProgress?.(index, requests.length, request.key);
  }

  return { script: workScript, assets };
}
