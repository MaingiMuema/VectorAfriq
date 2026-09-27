import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import StaticPropertyListingsPage, {
  type StaticListingSearchParams,
} from "@/components/properties/StaticPropertyListingsPage";
import { buildListingPageSchema } from "@/lib/seo/listingPageSchema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Land For Sale",
  description: "Browse through our wide selection of land for sale in Kenya.",
  alternates: { canonical: "/land-for-sale" },
};

const jsonLd = buildListingPageSchema({
  name: "Land For Sale in Kenya | VectorAfriq",
  url: `${SITE_URL}/land-for-sale`,
  description:
    "Find prime land for sale in Kenya. Browse residential and commercial plots, agricultural land, and development sites across the country.",
  breadcrumbLabel: "Land For Sale",
});

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/land-for-sale", baseMetadata);
}

export default async function LandForSalePage({
  searchParams,
}: {
  searchParams: Promise<StaticListingSearchParams>;
}) {
  return (
    <>
      <script
        id="land-sale-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPropertyListingsPage
        category="land"
        type="sale"
        title="Land For Sale in Kenya"
        breadcrumbPath="/land-for-sale"
        description="Find prime land for sale in Kenya. Browse through our extensive collection of residential and commercial plots across the country."
        searchParams={await searchParams}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
