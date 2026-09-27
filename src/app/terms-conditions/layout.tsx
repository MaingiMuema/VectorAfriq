import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema } from "@/components/seo/SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
    title: "Terms and Conditions",
    description: "Terms and Conditions for VectorAfriq Kenya - Read our terms of service for using our property marketplace.",
    keywords: "VectorAfriq terms, terms of service, Kenya real estate terms",
    alternates: {
        canonical: '/terms-conditions',
    },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/terms-conditions", baseMetadata);
}

export default function TermsConditionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageUrl = `${SITE_URL}/terms-conditions`;
    return (
        <>
            <SchemaMarkup
                id="terms-conditions-schema"
                schema={[
                    buildWebPageSchema({
                        name: "Terms and Conditions | VectorAfriq Kenya",
                        url: pageUrl,
                        description: "Read VectorAfriq Kenya's terms and conditions for using our real estate marketplace platform.",
                        breadcrumbs: [
                            { name: "Home", url: SITE_URL },
                            { name: "Terms & Conditions", url: pageUrl },
                        ],
                    }),
                    buildBreadcrumbSchema([
                        { name: "Home", url: SITE_URL },
                        { name: "Terms & Conditions", url: pageUrl },
                    ]),
                ]}
            />
            {children}
        </>
    );
}
