import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema } from "@/components/seo/SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
    title: "Property Valuation Calculator",
    description: "Get an estimated value for your property based on location, features, and market trends in Kenya.",
    keywords: "property valuation Kenya, real estate value calculator, home value estimator",
    alternates: {
        canonical: '/property-valuation',
    },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/property-valuation", baseMetadata);
}

export default function PropertyValuationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageUrl = `${SITE_URL}/property-valuation`;
    return (
        <>
            <SchemaMarkup
                id="property-valuation-schema"
                schema={[
                    buildWebPageSchema({
                        name: "Free Property Valuation Calculator Kenya | VectorAfriq",
                        url: pageUrl,
                        description: "Estimate your property's market value based on location, size, features, and current Kenya real estate market trends. Free valuation tool by VectorAfriq.",
                        breadcrumbs: [
                            { name: "Home", url: SITE_URL },
                            { name: "Property Valuation", url: pageUrl },
                        ],
                    }),
                    buildBreadcrumbSchema([
                        { name: "Home", url: SITE_URL },
                        { name: "Property Valuation", url: pageUrl },
                    ]),
                    // SoftwareApplication — marks it as an interactive valuation tool
                    {
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        name: "VectorAfriq Property Valuation Calculator",
                        applicationCategory: "FinanceApplication",
                        operatingSystem: "Any",
                        url: pageUrl,
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "KES",
                        },
                        description: "Free tool to estimate the market value of residential and commercial properties in Kenya.",
                    },
                ]}
            />
            {children}
        </>
    );
}
