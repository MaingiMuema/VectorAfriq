import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema } from "@/components/seo/SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
    title: "Our Partners",
    description: "Collaborate with Kenya's leading real estate companies. View our trusted partners and their services.",
    keywords: "VectorAfriq partners, Kenya real estate partners, real estate companies Kenya",
    alternates: {
        canonical: '/partners',
    },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/partners", baseMetadata);
}

export default function PartnersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageUrl = `${SITE_URL}/partners`;
    return (
        <>
            <SchemaMarkup
                id="partners-schema"
                schema={[
                    buildWebPageSchema({
                        name: "Our Partners | VectorAfriq Kenya",
                        url: pageUrl,
                        description: "Discover VectorAfriq Kenya's trusted real estate partners — leading agencies, financial institutions, and service providers across Kenya.",
                        breadcrumbs: [
                            { name: "Home", url: SITE_URL },
                            { name: "Partners", url: pageUrl },
                        ],
                    }),
                    buildBreadcrumbSchema([
                        { name: "Home", url: SITE_URL },
                        { name: "Partners", url: pageUrl },
                    ]),
                ]}
            />
            {children}
        </>
    );
}
