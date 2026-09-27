import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema } from "@/components/seo/SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
    title: "Request Property",
    description: "Tell us what property you're looking for and we'll help you find it. Submit your property requirements to our agents.",
    keywords: "request property Kenya, find property, property search help",
    alternates: {
        canonical: '/request-property',
    },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/request-property", baseMetadata);
}

export default function RequestPropertyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageUrl = `${SITE_URL}/request-property`;
    return (
        <>
            <SchemaMarkup
                id="request-property-schema"
                schema={[
                    buildWebPageSchema({
                        name: "Request a Property | VectorAfriq Kenya",
                        url: pageUrl,
                        description: "Can't find what you're looking for? Tell us your requirements and our network of agents across Kenya will help find your ideal property.",
                        breadcrumbs: [
                            { name: "Home", url: SITE_URL },
                            { name: "Request Property", url: pageUrl },
                        ],
                    }),
                    buildBreadcrumbSchema([
                        { name: "Home", url: SITE_URL },
                        { name: "Request Property", url: pageUrl },
                    ]),
                ]}
            />
            {children}
        </>
    );
}
