/**
 * SchemaMarkup - Central JSON-LD Structured Data Component
 *
 * Renders one or more schema.org JSON-LD objects as <script> tags.
 * Accepts any valid Schema.org type. Deduplicates IDs automatically.
 *
 * Usage:
 *   <SchemaMarkup id="org-schema" schema={organizationSchema} />
 *   <SchemaMarkup id="page-schemas" schema={[breadcrumb, webpage]} />
 */

import Script from "next/script";

// ─── Shared Primitive Types ───────────────────────────────────────────────────

export interface PostalAddress {
    "@type": "PostalAddress";
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    addressCountry: string;
    postalCode?: string;
}

export interface GeoCoordinates {
    "@type": "GeoCoordinates";
    latitude: number | string;
    longitude: number | string;
}

export interface ImageObject {
    "@type": "ImageObject";
    url: string;
    width?: number;
    height?: number;
    caption?: string;
}

export interface ContactPoint {
    "@type": "ContactPoint";
    telephone?: string;
    contactType: string;
    email?: string;
    availableLanguage?: string[];
    areaServed?: string;
}

export interface BreadcrumbListItem {
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
}

// ─── Schema Types ─────────────────────────────────────────────────────────────

export interface OrganizationSchema {
    "@context": "https://schema.org";
    "@type": "Organization" | "RealEstateAgent" | "LocalBusiness";
    "@id"?: string;
    name: string;
    url: string;
    logo?: string | ImageObject;
    description?: string;
    address?: PostalAddress;
    contactPoint?: ContactPoint | ContactPoint[];
    sameAs?: string[];
    telephone?: string;
    email?: string;
    foundingDate?: string;
    areaServed?: string | string[];
}

export interface WebSiteSchema {
    "@context": "https://schema.org";
    "@type": "WebSite";
    "@id"?: string;
    name: string;
    url: string;
    description?: string;
    publisher?: { "@id": string };
    potentialAction?: SearchActionSchema;
    inLanguage?: string;
}

export interface SearchActionSchema {
    "@type": "SearchAction";
    target: {
        "@type": "EntryPoint";
        urlTemplate: string;
    };
    "query-input": string;
}

export interface BreadcrumbListSchema {
    "@context": "https://schema.org";
    "@type": "BreadcrumbList";
    itemListElement: BreadcrumbListItem[];
}

export interface WebPageSchema {
    "@context": "https://schema.org";
    "@type":
    | "WebPage"
    | "AboutPage"
    | "ContactPage"
    | "FAQPage"
    | "CollectionPage";
    "@id"?: string;
    name: string;
    url: string;
    description?: string;
    breadcrumb?: BreadcrumbListSchema;
    publisher?: { "@id": string } | OrganizationSchema;
    inLanguage?: string;
    dateModified?: string;
    mainEntity?: FAQMainEntity | ItemListSchema;
}

export interface FAQMainEntity {
    "@type": "ItemList";
    itemListElement: FAQItem[];
}

export interface FAQItem {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
        "@type": "Answer";
        text: string;
    };
}

export interface ArticleSchema {
    "@context": "https://schema.org";
    "@type": "Article" | "BlogPosting" | "NewsArticle";
    "@id"?: string;
    headline: string;
    description?: string;
    image?: string | string[] | ImageObject;
    author: {
        "@type": "Person" | "Organization";
        name: string;
        url?: string;
    };
    publisher: {
        "@type": "Organization";
        name: string;
        logo?: ImageObject;
        url?: string;
    };
    datePublished: string;
    dateModified?: string;
    mainEntityOfPage?: { "@type": "WebPage"; "@id": string };
    url?: string;
    keywords?: string | string[];
    articleSection?: string;
    wordCount?: number;
    inLanguage?: string;
}

export interface ItemListSchema {
    "@context": "https://schema.org";
    "@type": "ItemList";
    name: string;
    description?: string;
    numberOfItems?: number;
    url?: string;
    itemListElement: {
        "@type": "ListItem";
        position: number;
        name: string;
        url?: string;
        item?: unknown;
    }[];
}

export interface RealEstateListingSchema {
    "@context": "https://schema.org";
    "@type": "Accommodation" | "Apartment" | "House" | "LodgingBusiness";
    "@id"?: string;
    name: string;
    description?: string;
    url?: string;
    image?: string | string[];
    address: PostalAddress;
    geo?: GeoCoordinates;
    numberOfRooms?: number;
    numberOfBathroomsTotal?: number;
    floorSize?: { "@type": "QuantitativeValue"; value: number; unitCode: string };
    amenityFeature?: { "@type": "LocationFeatureSpecification"; name: string; value: boolean }[];
    offers?: {
        "@type": "Offer";
        price: number;
        priceCurrency: string;
        availability?: string;
        priceValidUntil?: string;
    };
    additionalProperty?: { "@type": "PropertyValue"; name: string; value: string | number | boolean }[];
    datePosted?: string;
    dateModified?: string;
}

export interface FinancialProductSchema {
    "@context": "https://schema.org";
    "@type": "FinancialProduct" | "LoanOrCredit";
    name: string;
    url?: string;
    description?: string;
    provider?: {
        "@type": "Organization";
        name: string;
        url?: string;
    };
    feesAndCommissionsSpecification?: string;
    interestRate?: number;
    loanTerm?: { "@type": "QuantitativeValue"; value: number; unitCode: string };
}

// ─── Union type of all supported schemas ──────────────────────────────────────

export type AnySchema =
    | OrganizationSchema
    | WebSiteSchema
    | BreadcrumbListSchema
    | WebPageSchema
    | ArticleSchema
    | ItemListSchema
    | RealEstateListingSchema
    | FinancialProductSchema
    // Allow passthrough of arbitrary JSON-LD
    | Record<string, unknown>;

// ─── Component ────────────────────────────────────────────────────────────────

interface SchemaMarkupProps {
    /** Unique ID for the script tag (required by Next.js Script) */
    id: string;
    /** Single schema object or array — both render as valid JSON-LD */
    schema: AnySchema | AnySchema[];
}

/**
 * Renders schema.org JSON-LD structured data using Next.js <Script />.
 *
 * Supports single or multiple schemas in one call. When multiple schemas
 * are provided, they are wrapped in a @graph array for best practice.
 */
export default function SchemaMarkup({ id, schema }: SchemaMarkupProps) {
    const schemaArray = Array.isArray(schema) ? schema : [schema];

    // Use @graph pattern for multiple schemas or single-schema passthrough
    const jsonLd =
        schemaArray.length === 1
            ? schemaArray[0]
            : {
                "@context": "https://schema.org",
                "@graph": schemaArray.map((s) => {
                    // Strip top-level @context from each item in the graph
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { "@context": _ctx, ...rest } = s as Record<string, unknown>;
                    return rest;
                }),
            };

    return (
        <Script
            id={id}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            strategy="afterInteractive"
        />
    );
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";
const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Returns the canonical Organization schema for VectorAfriq.
 * Reused across layout.tsx and other pages.
 */
export function buildOrganizationSchema(): OrganizationSchema {
    return {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "@id": ORG_ID,
        name: "VectorAfriq",
        url: SITE_URL,
        logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/vectorafriq-logo-removebg-preview.png`,
            width: 200,
            height: 60,
        },
        description:
            "Kenya's leading property marketplace for buying, selling, and renting homes, apartments, commercial properties, and land.",
        address: {
            "@type": "PostalAddress",
            addressLocality: "Nairobi",
            addressRegion: "Nairobi County",
            addressCountry: "KE",
        },
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            availableLanguage: ["English", "Swahili"],
            areaServed: "KE",
        },
        sameAs: [
            "https://www.facebook.com/p/Property-Finder-KE-100063636204360/",
            "https://www.youtube.com/@vectorafriqproperties",
        ],
        areaServed: "Kenya",
        foundingDate: "2020",
    };
}

/**
 * Returns the WebSite schema with Sitelinks Searchbox action.
 */
export function buildWebSiteSchema(): WebSiteSchema {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "VectorAfriq",
        url: SITE_URL,
        description:
            "Browse thousands of properties for sale and rent in Kenya. Find houses, apartments, land, and commercial properties.",
        publisher: { "@id": ORG_ID },
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/properties?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
        inLanguage: "en-KE",
    };
}

/**
 * Builds a BreadcrumbList schema from an array of breadcrumb items.
 */
export function buildBreadcrumbSchema(
    items: { name: string; url?: string }[]
): BreadcrumbListSchema {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            ...(item.url ? { item: item.url } : {}),
        })),
    };
}

/**
 * Builds a WebPage schema for standard informational pages.
 */
export function buildWebPageSchema(opts: {
    name: string;
    url: string;
    description?: string;
    type?: WebPageSchema["@type"];
    breadcrumbs?: { name: string; url?: string }[];
    dateModified?: string;
}): WebPageSchema {
    return {
        "@context": "https://schema.org",
        "@type": opts.type ?? "WebPage",
        "@id": `${opts.url}#webpage`,
        name: opts.name,
        url: opts.url,
        description: opts.description,
        publisher: { "@id": ORG_ID },
        inLanguage: "en-KE",
        dateModified: opts.dateModified ?? new Date().toISOString().split("T")[0],
        ...(opts.breadcrumbs
            ? { breadcrumb: buildBreadcrumbSchema(opts.breadcrumbs) }
            : {}),
    };
}

/**
 * Builds a FAQPage schema. Each item needs a question (name) and answer (text).
 */
export function buildFAQSchema(
    faqs: { question: string; answer: string }[]
): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    };
}

/**
 * Builds an Article/BlogPosting schema for blog content.
 */
export function buildArticleSchema(opts: {
    title: string;
    description?: string;
    image?: string;
    authorName: string;
    datePublished: string;
    dateModified?: string;
    url: string;
    categories?: string[];
    wordCount?: number;
}): ArticleSchema {
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${opts.url}#article`,
        headline: opts.title,
        description: opts.description,
        image: opts.image ? [opts.image] : undefined,
        author: {
            "@type": "Person",
            name: opts.authorName,
        },
        publisher: {
            "@type": "Organization",
            name: "VectorAfriq",
            url: SITE_URL,
            logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/vectorafriq-logo-removebg-preview.png`,
                width: 200,
                height: 60,
            },
        },
        datePublished: opts.datePublished,
        dateModified: opts.dateModified ?? opts.datePublished,
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": opts.url,
        },
        url: opts.url,
        keywords: opts.categories?.join(", "),
        articleSection: opts.categories?.[0],
        wordCount: opts.wordCount,
        inLanguage: "en-KE",
    };
}
