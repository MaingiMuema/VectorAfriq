import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import StaticPropertyListingsPage, {
  type StaticListingSearchParams,
} from "@/components/properties/StaticPropertyListingsPage";
import { buildListingPageSchema } from "@/lib/seo/listingPageSchema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Houses For Sale",
  description: "Browse through our wide selection of houses for sale in Kenya.",
  alternates: { canonical: "/houses-for-sale" },
};

const jsonLd = buildListingPageSchema({
  name: "Houses For Sale in Kenya | VectorAfriq",
  url: `${SITE_URL}/houses-for-sale`,
  description:
    "Find your dream house in Kenya. Browse our extensive collection of houses for sale, from cozy family homes to luxurious villas.",
  breadcrumbLabel: "Houses For Sale",
  itemType: "House",
});

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/houses-for-sale", baseMetadata);
}

export default async function HousesForSalePage({
  searchParams,
}: {
  searchParams: Promise<StaticListingSearchParams>;
}) {
  return (
    <>
      <script
        id="houses-sale-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPropertyListingsPage
        category="houses"
        type="sale"
        title="Houses For Sale in Kenya"
        breadcrumbPath="/houses-for-sale"
        description="Find your dream house in Kenya. Browse through our extensive collection of houses for sale, from cozy family homes to luxurious villas."
        searchParams={await searchParams}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
