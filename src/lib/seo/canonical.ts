/**
 * Canonical URL Utility Functions
 * 
 * This module provides utilities for generating proper canonical URLs
 * to prevent duplicate content issues and "parameter bloat" in Google's index.
 * 
 * Rules:
 * 1. Self-referencing canonical for standard pages (e.g., /about-us → /about-us)
 * 2. Primary category URL for search/filter pages (strips query parameters)
 * 3. Location pages point to their clean URL (e.g., /for-sale/nairobi)
 * 4. Property detail pages use their unique identifier
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vectorafriqproperties.co.ke';

/**
 * List of query parameters that should be stripped from canonical URLs
 * These parameters represent filters/sorting but not unique content
 */
const FILTER_PARAMS = [
    'page',
    'sort',
    'order',
    'price_min',
    'price_max',
    'priceMin',
    'priceMax',
    'bedrooms',
    'bathrooms',
    'minBedrooms',
    'maxBedrooms',
    'minBathrooms',
    'maxBathrooms',
    'minPrice',
    'maxPrice',
    'minSize',
    'maxSize',
    'size',
    'amenities',
    'features',
    'furnished',
    'parking',
    'view',
    'floor',
    'propertyAge',
    'sortBy',
    'sortOrder',
    'query',
    'q',
    'search',
    's',
];

/**
 * List of allowed parameters that may define unique content
 * and should be preserved in canonical URLs
 */
const CONTENT_PARAMS = [
    'type',      // Property type (for-sale, for-rent)
    'category',  // Property category (apartments, houses)
    'location',  // Location identifier
];

export interface CanonicalUrlOptions {
    /** The current pathname (e.g., /properties) */
    pathname: string;
    /** Current search parameters */
    searchParams?: URLSearchParams | Record<string, string | string[] | undefined>;
    /** Override the base URL */
    baseUrl?: string;
    /** Force a specific canonical URL */
    forceCanonical?: string;
}

/**
 * Generates a clean canonical URL by removing filter parameters
 * while preserving content-defining parameters
 */
export function generateCanonicalUrl(options: CanonicalUrlOptions): string {
    const { pathname, searchParams, baseUrl = SITE_URL, forceCanonical } = options;

    // If a specific canonical URL is forced, use it
    if (forceCanonical) {
        return forceCanonical.startsWith('http') ? forceCanonical : `${baseUrl}${forceCanonical}`;
    }

    // Normalize pathname - remove trailing slash except for root
    let cleanPathname = pathname.replace(/\/$/, '') || '/';

    // Handle URL-encoded characters
    cleanPathname = decodeURIComponent(cleanPathname);

    // Convert searchParams to URLSearchParams if it's a plain object
    let params: URLSearchParams;
    if (searchParams instanceof URLSearchParams) {
        params = new URLSearchParams(searchParams);
    } else if (searchParams && typeof searchParams === 'object') {
        params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach(v => params.append(key, v));
                } else {
                    params.set(key, value);
                }
            }
        });
    } else {
        params = new URLSearchParams();
    }

    // Special handling for search/filter pages
    // Strip all filter parameters, keep only content-defining ones
    const cleanParams = new URLSearchParams();

    params.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        // Only preserve content-defining parameters
        if (CONTENT_PARAMS.includes(lowerKey) && !FILTER_PARAMS.includes(lowerKey)) {
            cleanParams.set(key, value);
        }
    });

    // Build the canonical URL
    const queryString = cleanParams.toString();
    const canonicalPath = queryString ? `${cleanPathname}?${queryString}` : cleanPathname;

    return `${baseUrl}${canonicalPath}`;
}

/**
 * Gets the primary category URL for search/filter pages
 * This strips all parameters and returns the base category path
 */
export function getPrimaryCategoryUrl(pathname: string, baseUrl: string = SITE_URL): string {
    // For category pages like /properties, /for-sale, /for-rent, /airbnb
    // Just return the clean path without any parameters
    const cleanPathname = pathname.replace(/\/$/, '') || '/';
    return `${baseUrl}${cleanPathname}`;
}

/**
 * Determines if a URL path represents a search/filter page
 */
export function isSearchOrFilterPage(pathname: string): boolean {
    const searchFilterPatterns = [
        /^\/properties/,
        /^\/search/,
        /^\/results/,
    ];

    return searchFilterPatterns.some(pattern => pattern.test(pathname));
}

/**
 * Generates canonical URL metadata for Next.js App Router
 * To be used in generateMetadata functions
 */
export function getCanonicalForMetadata(
    pathname: string,
    searchParams?: Record<string, string | string[] | undefined>,
    baseUrl: string = SITE_URL
): { canonical: string } {
    // For search/filter pages, use the primary category URL (no params)
    if (isSearchOrFilterPage(pathname)) {
        return {
            canonical: getPrimaryCategoryUrl(pathname, baseUrl),
        };
    }

    // For other pages, generate clean canonical URL
    return {
        canonical: generateCanonicalUrl({
            pathname,
            searchParams,
            baseUrl,
        }),
    };
}

/**
 * Get the site URL from environment or fallback
 */
export function getSiteUrl(): string {
    return SITE_URL;
}
