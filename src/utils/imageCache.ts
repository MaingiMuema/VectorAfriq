"use client";

// Image caching utility

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
}

class ImageCache {
  private static instance: ImageCache;
  private cache: Map<string, CachedImage>;
  private readonly maxAge: number = 24 * 60 * 60 * 1000; // 24 hours
  private readonly maxSize: number = 50 * 1024 * 1024; // 50MB
  private currentSize: number = 0;

  private constructor() {
    this.cache = new Map();
    this.loadFromLocalStorage();
  }

  public static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  private async loadFromLocalStorage() {
    try {
      if (typeof window === "undefined") return;

      const cached = window.localStorage.getItem("imageCache");
      if (cached) {
        const data = JSON.parse(cached);
        interface CachedData {
          url: string;
          timestamp: number;
        }

        for (const [key, value] of Object.entries<CachedData>(data)) {
          if (Date.now() - value.timestamp < this.maxAge) {
            try {
              const response = await fetch(value.url);
              const blob = await response.blob();
              this.cache.set(key, {
                url: value.url,
                blob,
                timestamp: value.timestamp,
              });
              this.currentSize += blob.size;
            } catch (error) {
              console.warn("Failed to load cached image:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading image cache:", error);
    }
  }

  private saveToLocalStorage() {
    try {
      const data: Record<string, { url: string; timestamp: number }> = {};
      this.cache.forEach((value, key) => {
        data[key] = {
          url: value.url,
          timestamp: value.timestamp,
        };
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem("imageCache", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error saving image cache:", error);
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.maxAge) {
        this.currentSize -= value.blob.size;
        this.cache.delete(key);
      }
    }
    this.saveToLocalStorage();
  }

  private makeRoom(requiredSize: number) {
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    while (
      this.currentSize + requiredSize > this.maxSize &&
      entries.length > 0
    ) {
      const [key, value] = entries.shift()!;
      this.currentSize -= value.blob.size;
      this.cache.delete(key);
    }
  }

  public async set(key: string, blob: Blob, url: string): Promise<void> {
    this.cleanup();
    this.makeRoom(blob.size);

    this.cache.set(key, {
      url,
      blob,
      timestamp: Date.now(),
    });
    this.currentSize += blob.size;
    this.saveToLocalStorage();
  }

  public async get(key: string): Promise<Blob | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.maxAge) {
      this.currentSize -= cached.blob.size;
      this.cache.delete(key);
      this.saveToLocalStorage();
      return null;
    }

    return cached.blob;
  }

  public async getUrl(key: string): Promise<string | null> {
    const blob = await this.get(key);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.forEach((value) => {
      URL.revokeObjectURL(value.url);
    });
    this.cache.clear();
    this.currentSize = 0;
    this.saveToLocalStorage();
  }
}

export const imageCache = ImageCache.getInstance();
