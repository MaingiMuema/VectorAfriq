import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema } from "@/components/seo/SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
    title: "Real Estate Market Trends",
    description: "Comprehensive analysis of Kenya's property market trends and insights. View price trends, popular locations, and market analytics.",
    keywords: "Kenya real estate market, property trends Kenya, real estate analytics",
    alternates: {
        canonical: '/market-trends',
    },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/market-trends", baseMetadata);
}

export default function MarketTrendsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageUrl = `${SITE_URL}/market-trends`;
    return (
        <>
            <SchemaMarkup
                id="market-trends-schema"
                schema={[
                    buildWebPageSchema({
                        name: "Kenya Real Estate Market Trends | VectorAfriq",
                        url: pageUrl,
                        description: "Explore comprehensive real estate market trends in Kenya — price movements, popular locations, demand analytics, and expert market insights.",
                        breadcrumbs: [
                            { name: "Home", url: SITE_URL },
                            { name: "Market Trends", url: pageUrl },
                        ],
                    }),
                    buildBreadcrumbSchema([
                        { name: "Home", url: SITE_URL },
                        { name: "Market Trends", url: pageUrl },
                    ]),
                    // Dataset schema — signals authoritative market data
                    {
                        "@context": "https://schema.org",
                        "@type": "Dataset",
                        name: "Kenya Real Estate Market Trends",
                        description: "Property market price trends, demand statistics, and location insights for Kenya's real estate market.",
                        url: pageUrl,
                        creator: {
                            "@type": "Organization",
                            name: "VectorAfriq Kenya",
                            url: SITE_URL,
                        },
                        spatialCoverage: "Kenya",
                        variableMeasured: "Property Prices and Market Trends",
                        temporalCoverage: "2023/..",
                    },
                ]}
            />
            {children}
        </>
    );
}
