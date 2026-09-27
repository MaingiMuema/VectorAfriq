/**
 * SEO Utilities
 * 
 * This module exports all SEO-related utilities for the VectorAfriq platform.
 */

export {
    generateCanonicalUrl,
    getPrimaryCategoryUrl,
    isSearchOrFilterPage,
    getCanonicalForMetadata,
    getSiteUrl,
    type CanonicalUrlOptions,
} from './canonical';

export {
    generateSeoMetadata,
    mergeWithBaseMetadata,
    generateStaticPageMetadata,
    generatePropertyListingMetadata,
    type SeoMetadataOptions,
} from './metadata';
