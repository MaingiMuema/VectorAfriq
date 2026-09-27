import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";

const baseMetadata: Metadata = {
    title: "Sitemap",
    description:
        "Browse the complete VectorAfriq Kenya sitemap. Navigate to all pages including property listings, resources, tools, and more.",
    keywords:
        "VectorAfriq sitemap, site map, Kenya real estate pages, property listings navigation",
    alternates: {
        canonical: "/sitemap",
    },
    openGraph: {
        title: "Sitemap – VectorAfriq Kenya",
        description:
            "Explore the full directory of pages on VectorAfriq Kenya. Find properties, tools, guides, and more.",
        type: "website",
    },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/sitemap", baseMetadata);
}

export default function SitemapLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
