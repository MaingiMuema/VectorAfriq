import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema } from "@/components/seo/SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
    title: "Blog",
    description: "Read the latest real estate news, property guides, neighbourhood insights, and expert advice from VectorAfriq Kenya.",
    keywords: "Kenya real estate blog, property news Kenya, real estate advice, neighbourhood guides Kenya",
    alternates: {
        canonical: '/blogs',
    },
    openGraph: {
        title: "Blog | VectorAfriq Kenya",
        description: "Read the latest real estate news, property guides, and expert advice from VectorAfriq Kenya.",
        type: 'website',
    },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/blogs", baseMetadata);
}

export default function BlogsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageUrl = `${SITE_URL}/blogs`;
    return (
        <>
            <SchemaMarkup
                id="blogs-schema"
                schema={[
                    buildWebPageSchema({
                        name: "Real Estate Blog | VectorAfriq Kenya",
                        url: pageUrl,
                        description: "Read the latest real estate news, property guides, neighbourhood insights, and expert advice from Kenya's leading property marketplace.",
                        type: "CollectionPage",
                        breadcrumbs: [
                            { name: "Home", url: SITE_URL },
                            { name: "Blog", url: pageUrl },
                        ],
                    }),
                    buildBreadcrumbSchema([
                        { name: "Home", url: SITE_URL },
                        { name: "Blog", url: pageUrl },
                    ]),
                ]}
            />
            {children}
        </>
    );
}
