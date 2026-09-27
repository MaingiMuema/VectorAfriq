"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Property } from '@/types';

interface PaginationState {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}

interface UsePropertyFetchOptions {
    type?: string;
    category?: string;
    location?: string;
    county?: string;
    city?: string;
    neighborhood?: string;
    bedrooms?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    limit?: number;
    page?: number;
    featured?: boolean;
    enabled?: boolean;
    initialData?: {
        properties: Property[];
        pagination: PaginationState;
    };
}

interface UsePropertyFetchResult {
    properties: Property[];
    pagination: PaginationState;
    stats: Record<string, number>;
    loading: boolean;
    error: string | null;
    isStale: boolean;
    refetch: () => void;
    isFetching: boolean;
}

const DEFAULT_PAGINATION: PaginationState = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 8,
};

const FETCH_TIMEOUT = 15000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

export function usePropertyFetch(options: UsePropertyFetchOptions = {}): UsePropertyFetchResult {
    const {
        type,
        category,
        location,
        county,
        city,
        neighborhood,
        bedrooms,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        limit = 8,
        page = 1,
        featured,
        enabled = true,
        initialData
    } = options;

    const [properties, setProperties] = useState<Property[]>(initialData?.properties || []);
    const [pagination, setPagination] = useState<PaginationState>(initialData?.pagination || DEFAULT_PAGINATION);
    const [stats, setStats] = useState<Record<string, number>>({});

    // Initial loading state: true only if enabled and no initial data
    const [loading, setLoading] = useState(enabled && !initialData);
    const [isFetching, setIsFetching] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [isStale, setIsStale] = useState(!!initialData); // Initial data is considered stale immediately to trigger revalidation
    const [refreshCounter, setRefreshCounter] = useState(0);

    // Build query string - stable reference
    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', limit.toString());
        params.set('sortBy', sortBy);

        if (type) params.set('type', type);
        if (category) params.set('category', category);
        if (location) params.set('location', location);
        if (county) params.set('county', county);
        if (city) params.set('city', city);
        if (neighborhood) params.set('neighborhood', neighborhood);
        if (bedrooms) params.set('bedrooms', bedrooms);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (featured) params.set('featured', 'true');

        params.sort();
        return params.toString();
    }, [
        type,
        category,
        location,
        county,
        city,
        neighborhood,
        bedrooms,
        minPrice,
        maxPrice,
        sortBy,
        limit,
        page,
        featured,
    ]);

    // Main fetch effect - runs on mount and when queryString changes
    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        let isCancelled = false;
        const controller = new AbortController();
        let retryCount = 0;

        const doFetch = async () => {
            // Only set hard loading if we have no data
            if (properties.length === 0) {
                setLoading(true);
            }
            setIsFetching(true);
            setError(null);

            try {
                console.log('[usePropertyFetch] Fetching:', `/api/properties?${queryString}`);

                // Set up timeout
                const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

                const response = await fetch(`/api/properties?${queryString}`, {
                    signal: controller.signal,
                    cache: 'no-store',
                });

                clearTimeout(timeoutId);

                if (isCancelled) return;

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const data = await response.json();

                if (isCancelled) return;

                console.log('[usePropertyFetch] Received', data.properties?.length || 0, 'properties');

                setProperties(data.properties || []);
                setPagination(data.pagination || DEFAULT_PAGINATION);
                setStats(data.stats || {});
                setError(null);
                setIsStale(false);
                setLoading(false);
                setIsFetching(false);

            } catch (err) {
                if (isCancelled) return;

                // Ignore abort errors
                if (err instanceof Error && err.name === 'AbortError') {
                    console.log('[usePropertyFetch] Request aborted');
                    return;
                }

                console.error('[usePropertyFetch] Fetch error:', err);

                // Retry logic
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    console.log(`[usePropertyFetch] Retrying (${retryCount}/${MAX_RETRIES})...`);
                    setTimeout(() => {
                        if (!isCancelled) {
                            doFetch();
                        }
                    }, RETRY_DELAY * retryCount);
                    return;
                }

                // Set error after all retries failed
                setError(err instanceof Error ? err.message : 'Failed to load properties');
                setLoading(false);
                setIsFetching(false);
            }
        };

        doFetch();

        // Cleanup function
        return () => {
            isCancelled = true;
            controller.abort();
        };
    }, [queryString, enabled, refreshCounter]);

    // Manual refetch function
    const refetch = useCallback(() => {
        setRefreshCounter(c => c + 1);
    }, []);

    return {
        properties,
        pagination,
        stats,
        loading,
        error,
        isStale,
        refetch,
        isFetching,
    };
}

/**
 * Hook for prefetching properties on hover/focus
 */
export function usePrefetchProperties() {
    const prefetch = useCallback((params: Record<string, string>) => {
        const searchParams = new URLSearchParams(params);
        fetch(`/api/properties?${searchParams.toString()}`, {
            priority: 'low' as RequestPriority,
        }).catch(() => { });
    }, []);

    return { prefetch };
}
