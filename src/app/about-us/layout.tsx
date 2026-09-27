import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema } from "@/components/seo/SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
    title: "About Us",
    description: "Learn about VectorAfriq Kenya - Your trusted partner in finding the perfect property in Kenya. We're revolutionizing the real estate industry through technology and innovation.",
    keywords: "about VectorAfriq, Kenya real estate company, property marketplace Kenya, real estate technology",
    alternates: {
        canonical: '/about-us',
    },
    openGraph: {
        title: "About VectorAfriq Kenya",
        description: "Your trusted partner in finding the perfect property in Kenya. We're revolutionizing the real estate industry through technology and innovation.",
        type: 'website',
    },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/about-us", baseMetadata);
}

export default function AboutUsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageUrl = `${SITE_URL}/about-us`;
    return (
        <>
            <SchemaMarkup
                id="about-us-schema"
                schema={[
                    buildWebPageSchema({
                        name: "About VectorAfriq Kenya",
                        url: pageUrl,
                        description: "Learn about VectorAfriq Kenya — your trusted partner in finding the perfect property in Kenya. We revolutionize the real estate industry through technology and innovation.",
                        type: "AboutPage",
                        breadcrumbs: [
                            { name: "Home", url: SITE_URL },
                            { name: "About Us", url: pageUrl },
                        ],
                    }),
                    buildBreadcrumbSchema([
                        { name: "Home", url: SITE_URL },
                        { name: "About Us", url: pageUrl },
                    ]),
                ]}
            />
            {children}
        </>
    );
}
