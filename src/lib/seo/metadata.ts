import type { Metadata, ResolvingMetadata } from 'next';
import { generateCanonicalUrl, getSiteUrl, isSearchOrFilterPage, getPrimaryCategoryUrl } from './canonical';
import { resolvePageMeta } from './overrides';

/**
 * SEO Metadata Generator
 * 
 * Provides functions to generate consistent SEO metadata across all pages
 * with automatic canonical URL generation
 */

const DEFAULT_SITE_NAME = 'VectorAfriq';
const DEFAULT_TITLE = 'VectorAfriq | Find Your Dream Property in Kenya';
const DEFAULT_DESCRIPTION = 'Browse through a wide selection of properties for sale and rent in Kenya. Find houses, apartments, land, and commercial properties.';
const DEFAULT_KEYWORDS = 'real estate, property, Kenya, houses for sale, apartments for rent, land for sale';
const DEFAULT_OG_IMAGE = '/images/og-default.jpg';

export interface SeoMetadataOptions {
    /** Page title */
    title?: string;
    /** Page description */
    description?: string;
    /** Keywords for the page */
    keywords?: string | string[];
    /** OG image URL */
    ogImage?: string;
    /** Current pathname */
    pathname: string;
    /** Search params (for canonical URL generation) */
    searchParams?: Record<string, string | string[] | undefined>;
    /** Force a specific canonical URL */
    forceCanonical?: string;
    /** Should page be indexed */
    noIndex?: boolean;
    /** Should links be followed */
    noFollow?: boolean;
    /** Page type for OpenGraph */
    ogType?: 'website' | 'article' | 'profile';
    /** Entity this page renders, for seo_page_override lookup (property/blog_post/service/location) */
    entity?: { type: string; id: string };
}

/**
 * Generates complete SEO metadata including canonical URL
 */
export function generateSeoMetadata(options: SeoMetadataOptions): Metadata {
    const {
        title,
        description,
        keywords,
        ogImage,
        pathname,
        searchParams,
        forceCanonical,
        noIndex = false,
        noFollow = false,
        ogType = 'website',
    } = options;

    const siteUrl = getSiteUrl();

    // Generate canonical URL
    let canonicalUrl: string;
    if (forceCanonical) {
        canonicalUrl = forceCanonical.startsWith('http') ? forceCanonical : `${siteUrl}${forceCanonical}`;
    } else if (isSearchOrFilterPage(pathname)) {
        // For search/filter pages, use primary category URL (no parameters)
        canonicalUrl = getPrimaryCategoryUrl(pathname, siteUrl);
    } else {
        canonicalUrl = generateCanonicalUrl({ pathname, searchParams, baseUrl: siteUrl });
    }

    // Prepare keywords string
    const keywordsString = Array.isArray(keywords) ? keywords.join(', ') : keywords;

    // Prepare full OG image URL
    const fullOgImage = ogImage?.startsWith('http')
        ? ogImage
        : `${siteUrl}${ogImage || DEFAULT_OG_IMAGE}`;

    const finalTitle = title || DEFAULT_TITLE;
    const finalDescription = description || DEFAULT_DESCRIPTION;

    const metadata: Metadata = {
        title: finalTitle,
        description: finalDescription,
        keywords: keywordsString || DEFAULT_KEYWORDS,

        // Robots
        robots: {
            index: !noIndex,
            follow: !noFollow,
        },

        // Alternates with canonical
        alternates: {
            canonical: canonicalUrl,
        },

        // OpenGraph
        openGraph: {
            title: finalTitle,
            description: finalDescription,
            url: canonicalUrl,
            siteName: DEFAULT_SITE_NAME,
            type: ogType,
            locale: 'en_US',
            images: [
                {
                    url: fullOgImage,
                    width: 1200,
                    height: 630,
                    alt: finalTitle,
                },
            ],
        },

        // Twitter
        twitter: {
            card: 'summary_large_image',
            title: finalTitle,
            description: finalDescription,
            images: [fullOgImage],
        },
    };

    return metadata;
}

/**
 * Merges custom metadata with base SEO configuration
 */
export function mergeWithBaseMetadata(
    customMetadata: Metadata,
    parent?: ResolvingMetadata
): Metadata {
    // Ensure canonical is present
    if (!customMetadata.alternates?.canonical) {
        console.warn('SEO Warning: Page metadata missing canonical URL');
    }

    return customMetadata;
}

/**
 * Generates metadata for static pages
 */
export function generateStaticPageMetadata(
    pathname: string,
    title: string,
    description: string,
    keywords?: string
): Metadata {
    return generateSeoMetadata({
        pathname,
        title,
        description,
        keywords,
        ogType: 'website',
    });
}

/**
 * Generates metadata for property listing pages
 */
export function generatePropertyListingMetadata(
    pathname: string,
    location?: string,
    type?: string,
    category?: string,
    searchParams?: Record<string, string | string[] | undefined>
): Metadata {
    const typeText = type === 'rent' ? 'For Rent' : type === 'sale' ? 'For Sale' : type === 'airbnb' ? 'Airbnb' : 'Available';
    const locationText = location ? ` in ${location}` : '';
    const categoryText = category ? `${category} ` : '';

    const title = `${categoryText}Properties ${typeText}${locationText} | VectorAfriq`;
    const description = `Browse ${categoryText.toLowerCase()}properties ${typeText.toLowerCase()}${locationText}. Find your perfect property with VectorAfriq.`;

    return generateSeoMetadata({
        pathname,
        searchParams,
        title,
        description,
        keywords: `properties ${typeText.toLowerCase()}, ${location || 'Kenya'} real estate, VectorAfriq`,
        ogType: 'website',
    });
}

/**
 * Async variant of generateSeoMetadata() that overlays the admin/agent override
 * (page_meta > seo_page_override > caller-supplied defaults, see overrides.ts)
 * before building the final Metadata object. Never throws — a resolver failure
 * just falls back to the caller-supplied values.
 */
export async function generateSeoMetadataAsync(options: SeoMetadataOptions): Promise<Metadata> {
    const resolved = await resolvePageMeta(options.pathname, options.entity);
    return generateSeoMetadata({
        ...options,
        title: resolved?.title || options.title,
        description: resolved?.description || options.description,
        keywords: resolved?.keywords || options.keywords,
        ogImage: resolved?.ogImage || options.ogImage,
        noIndex: resolved?.noIndex ?? options.noIndex,
    });
}

/**
 * Overlays an admin/agent override on top of a hand-built Metadata object, for pages
 * that construct `Metadata` directly instead of calling generateSeoMetadata() (property
 * listings, blog posts, service pages). Returns `base` unchanged if no override exists
 * or the resolver fails — SEO metadata must never be able to break page rendering.
 */
export async function overlayPageOverride(
    pathname: string,
    base: Metadata,
    entity?: { type: string; id: string }
): Promise<Metadata> {
    const resolved = await resolvePageMeta(pathname, entity);
    if (!resolved) return base;

    const title = resolved.title || (typeof base.title === 'string' ? base.title : undefined);
    const description = resolved.description || base.description || undefined;

    return {
        ...base,
        title: title ?? base.title,
        description: description ?? base.description,
        keywords: resolved.keywords || base.keywords,
        robots: resolved.noIndex
            ? { index: false, follow: true }
            : base.robots,
        openGraph: base.openGraph
            ? {
                ...base.openGraph,
                title: title ?? base.openGraph.title,
                description: description ?? base.openGraph.description,
                images: resolved.ogImage
                    ? [{ url: resolved.ogImage, width: 1200, height: 630, alt: title || '' }]
                    : base.openGraph.images,
            }
            : base.openGraph,
        twitter: base.twitter
            ? { ...base.twitter, title: title ?? base.twitter.title, description: description ?? base.twitter.description }
            : base.twitter,
    };
}
