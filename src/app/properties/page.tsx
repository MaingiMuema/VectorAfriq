import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import StaticPropertyListingsPage, {
  type StaticListingSearchParams,
} from "@/components/properties/StaticPropertyListingsPage";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Properties in Kenya",
  description:
    "Browse through our wide selection of properties in Kenya — houses, apartments, commercial spaces, and land for sale or rent.",
  alternates: {
    canonical: "/properties",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/properties#webpage`,
      name: "Properties in Kenya | VectorAfriq",
      url: `${SITE_URL}/properties`,
      description:
        "Browse thousands of properties across Kenya — apartments, houses, land, and commercial properties for sale and rent.",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-KE",
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/properties", baseMetadata);
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<StaticListingSearchParams>;
}) {
  return (
    <>
      <script
        id="properties-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPropertyListingsPage
        title="Properties in Kenya"
        breadcrumbPath="/properties"
        description="Browse through our extensive collection of properties across Kenya, including apartments, houses, commercial spaces, and land."
        searchParams={await searchParams}
        categoryLinkMode="current"
        sidebarType="sale"
      />
    </>
  );
}

export const dynamic = "force-dynamic";
