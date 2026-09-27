/**
 * buildListingPageSchema - Shared schema builder for property category listing pages.
 *
 * Generates a @graph array containing:
 * - CollectionPage (WebPage sub-type for listing pages)
 * - BreadcrumbList
 *
 * Usage (in any listing page.tsx):
 *   const jsonLd = buildListingPageSchema({ name, url, description });
 *   <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

export interface ListingPageSchemaOpts {
    /** Full display name, e.g. "Apartments For Rent in Kenya | VectorAfriq" */
    name: string;
    /** Canonical URL string, e.g. `${SITE_URL}/apartments-for-rent` */
    url: string;
    /** Short description of the listing category */
    description: string;
    /** Human-readable label for the breadcrumb  e.g. "Apartments For Rent" */
    breadcrumbLabel: string;
    /** Schema.org itemType for the listings, e.g. "Apartment", "House", "Land" */
    itemType?: string;
}

export function buildListingPageSchema({
    name,
    url,
    description,
    breadcrumbLabel,
}: ListingPageSchemaOpts) {
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": `${url}#webpage`,
                name,
                url,
                description,
                publisher: { "@id": `${SITE_URL}/#organization` },
                inLanguage: "en-KE",
                breadcrumb: {
                    "@type": "BreadcrumbList",
                    itemListElement: [
                        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                        { "@type": "ListItem", position: 2, name: breadcrumbLabel, item: url },
                    ],
                },
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                    { "@type": "ListItem", position: 2, name: breadcrumbLabel, item: url },
                ],
            },
        ],
    };
}
