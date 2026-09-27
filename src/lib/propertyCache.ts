/**
 * Property Cache - In-memory caching layer for property data
 * Implements stale-while-revalidate pattern for fast loading
 */

import { generateSlug as canonicalGenerateSlug } from "@/lib/seo/routes";

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    staleAt: number;
    expiresAt: number;
}

interface PropertyCacheOptions {
    staleTime?: number;  // Time before data is considered stale (default: 30s)
    maxAge?: number;     // Time before data expires completely (default: 5min)
}

const DEFAULT_STALE_TIME = 30 * 1000; // 30 seconds
const DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

class PropertyCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private pendingRequests = new Map<string, Promise<unknown>>();

    /**
     * Generate cache key from URL or parameters
     */
    private getCacheKey(url: string, params?: Record<string, string>): string {
        if (params) {
            const searchParams = new URLSearchParams(params);
            searchParams.sort();
            return `${url}?${searchParams.toString()}`;
        }
        return url;
    }

    /**
     * Get cached data if available and not expired
     */
    get<T>(key: string): { data: T | null; isStale: boolean } {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;

        if (!entry) {
            return { data: null, isStale: true };
        }

        const now = Date.now();

        // Completely expired
        if (now > entry.expiresAt) {
            this.cache.delete(key);
            return { data: null, isStale: true };
        }

        // Available but stale
        const isStale = now > entry.staleAt;
        return { data: entry.data, isStale };
    }

    /**
     * Set cached data
     */
    set<T>(key: string, data: T, options: PropertyCacheOptions = {}): void {
        const now = Date.now();
        const staleTime = options.staleTime ?? DEFAULT_STALE_TIME;
        const maxAge = options.maxAge ?? DEFAULT_MAX_AGE;

        this.cache.set(key, {
            data,
            timestamp: now,
            staleAt: now + staleTime,
            expiresAt: now + maxAge,
        });
    }

    /**
     * Fetch with deduplication - prevents multiple simultaneous requests for same data
     */
    async fetchWithDedup<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: PropertyCacheOptions = {}
    ): Promise<T> {
        // Check if there's already a pending request for this key
        const pending = this.pendingRequests.get(key);
        if (pending) {
            return pending as Promise<T>;
        }

        // Create the fetch promise
        const fetchPromise = (async () => {
            try {
                const data = await fetcher();
                this.set(key, data, options);
                return data;
            } finally {
                this.pendingRequests.delete(key);
            }
        })();

        this.pendingRequests.set(key, fetchPromise);
        return fetchPromise;
    }

    /**
     * Invalidate specific cache entry
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalidate all entries matching a pattern
     */
    invalidatePattern(pattern: RegExp): void {
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Prefetch data in background
     */
    prefetch<T>(key: string, fetcher: () => Promise<T>, options: PropertyCacheOptions = {}): void {
        const { data, isStale } = this.get<T>(key);

        // Only prefetch if no data or stale
        if (!data || isStale) {
            this.fetchWithDedup(key, fetcher, options).catch(() => {
                // Silently ignore prefetch errors
            });
        }
    }
}

// Singleton instance
export const propertyCache = new PropertyCache();

/**
 * Fetch properties with caching, timeout and abort support
 */
export async function fetchPropertiesWithCache(
    params: Record<string, string>,
    options: {
        timeout?: number;
        signal?: AbortSignal;
        forceRefresh?: boolean;
    } = {}
): Promise<{
    properties: unknown[];
    pagination: unknown;
    stats?: unknown;
    fromCache: boolean;
}> {
    const { timeout = 15000, signal, forceRefresh = false } = options;

    const searchParams = new URLSearchParams(params);
    searchParams.sort();
    const cacheKey = `/api/properties?${searchParams.toString()}`;

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
        const { data, isStale } = propertyCache.get<{
            properties: unknown[];
            pagination: unknown;
            stats?: unknown;
        }>(cacheKey);

        if (data && !isStale) {
            return { ...data, fromCache: true };
        }

        // Return stale data immediately but trigger background refresh
        if (data) {
            // Background revalidation
            propertyCache.prefetch(cacheKey, () => fetchFromAPI(params, timeout, signal));
            return { ...data, fromCache: true };
        }
    }

    // Fetch fresh data
    const freshData = await propertyCache.fetchWithDedup(
        cacheKey,
        () => fetchFromAPI(params, timeout, signal),
        { staleTime: 30000, maxAge: 300000 }
    );

    return { ...freshData, fromCache: false };
}

/**
 * Internal function to fetch from API with timeout
 */
async function fetchFromAPI(
    params: Record<string, string>,
    timeout: number,
    externalSignal?: AbortSignal
): Promise<{
    properties: unknown[];
    pagination: unknown;
    stats?: unknown;
}> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Combine with external signal if provided
    const signal = externalSignal
        ? combineAbortSignals(controller.signal, externalSignal)
        : controller.signal;

    try {
        const searchParams = new URLSearchParams(params);
        const response = await fetch(`/api/properties?${searchParams.toString()}`, {
            signal,
            headers: {
                'Cache-Control': 'no-cache',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch properties: ${response.status}`);
        }

        const data = await response.json();
        return {
            properties: data.properties || [],
            pagination: data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 },
            stats: data.stats,
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Combine multiple abort signals
 */
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
        if (signal.aborted) {
            controller.abort();
            return controller.signal;
        }
        signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    return controller.signal;
}

/**
 * Prefetch single property page data
 */
export function prefetchPropertyPage(propertyId: string, title: string): void {
    const slug = generateSlug(title);
    const url = `/listings/${slug}/${propertyId}`;

    // Use link prefetching if available
    if (typeof window !== 'undefined') {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document';
        document.head.appendChild(link);

        // Clean up after 30 seconds
        setTimeout(() => {
            link.remove();
        }, 30000);
    }
}

/**
 * Generate URL-friendly slug from title (centralized utility)
 * @deprecated import generateSlug from "@/lib/seo/routes" directly — kept here as a
 * re-export so existing call sites don't need to change their import path.
 */
export function generateSlug(title: string): string {
    return canonicalGenerateSlug(title);
}

/**
 * Build property URL
 */
export function getPropertyUrl(propertyId: string, title: string): string {
    return `/listings/${generateSlug(title)}/${propertyId}`;
}
