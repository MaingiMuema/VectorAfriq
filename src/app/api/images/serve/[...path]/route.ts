import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import nodePath from "path";

const IMAGES_DIR = nodePath.join(process.cwd(), "public", "Properties");
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://localhost:3001';

// In-memory cache for frequently accessed images
const imageCache = new Map<string, { buffer: Uint8Array; contentType: string; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour
const MAX_CACHE_SIZE = 50; // Max cached images

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const imagePath = pathSegments.join("/");
    const cacheKey = imagePath;
    
    // Check memory cache first
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(Buffer.from(cached.buffer), {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Cache": "HIT",
        },
      });
    }
    
    // Try image service with timeout
    if (pathSegments.length >= 2) {
      try {
        const propertyId = pathSegments[0];
        const filename = pathSegments.slice(1).join('/');
        const serviceUrl = `${IMAGE_SERVICE_URL}/images/${propertyId}/${filename}`;
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const serviceResponse = await fetch(serviceUrl, {
          signal: controller.signal,
          next: { revalidate: 86400 }
        });
        clearTimeout(timeout);
        
        if (serviceResponse.ok) {
          const arrayBuffer = await serviceResponse.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);
          const contentType = serviceResponse.headers.get('content-type') || 'image/jpeg';
          
          // Cache the image
          if (imageCache.size >= MAX_CACHE_SIZE) {
            const firstKey = imageCache.keys().next().value;
            if (firstKey) imageCache.delete(firstKey);
          }
          imageCache.set(cacheKey, { buffer, contentType, timestamp: Date.now() });
          
          return new Response(Buffer.from(buffer), {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
              "X-Cache": "MISS",
            },
          });
        }
      } catch {
        // Silently fall through to local
      }
    }
    
    // Handle local images
    const fullPath = nodePath.join(IMAGES_DIR, imagePath);

    if (!fullPath.startsWith(IMAGES_DIR)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const fileStats = await stat(fullPath);
    if (!fileStats.isFile()) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    const fileBuffer = await readFile(fullPath);
    const buffer = new Uint8Array(fileBuffer);
    const ext = nodePath.extname(fullPath).toLowerCase();
    
    const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : "image/jpeg";

    // Cache local images too
    if (imageCache.size >= MAX_CACHE_SIZE) {
      const firstKey = imageCache.keys().next().value;
      if (firstKey) imageCache.delete(firstKey);
    }
    imageCache.set(cacheKey, { buffer, contentType, timestamp: Date.now() });

    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": fileStats.size.toString(),
        "X-Cache": "MISS",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}