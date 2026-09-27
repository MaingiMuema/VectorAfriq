import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema } from "@/components/seo/SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
    title: "Find Real Estate Agents",
    description: "Connect with verified real estate agents in Kenya. Find property experts specialising in residential, commercial, luxury properties, and rentals.",
    keywords: "Kenya real estate agents, property agents Kenya, real estate professionals",
    alternates: {
        canonical: '/agents',
    },
    openGraph: {
        title: "Find Real Estate Agents | VectorAfriq Kenya",
        description: "Connect with verified real estate agents in Kenya for all your property needs.",
        type: 'website',
    },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/agents", baseMetadata);
}

export default function AgentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageUrl = `${SITE_URL}/agents`;
    return (
        <>
            <SchemaMarkup
                id="agents-schema"
                schema={[
                    buildWebPageSchema({
                        name: "Find Real Estate Agents in Kenya | VectorAfriq",
                        url: pageUrl,
                        description: "Browse and connect with verified real estate agents across Kenya. Find property specialists for residential, commercial, luxury, and rental properties.",
                        type: "CollectionPage",
                        breadcrumbs: [
                            { name: "Home", url: SITE_URL },
                            { name: "Agents", url: pageUrl },
                        ],
                    }),
                    buildBreadcrumbSchema([
                        { name: "Home", url: SITE_URL },
                        { name: "Agents", url: pageUrl },
                    ]),
                    // ItemList represents the collection of agents
                    {
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        name: "Real Estate Agents in Kenya",
                        description: "Verified real estate agents available on VectorAfriq Kenya",
                        url: pageUrl,
                    },
                ]}
            />
            {children}
        </>
    );
}
