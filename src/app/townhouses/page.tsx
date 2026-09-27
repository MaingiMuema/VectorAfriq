import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import StaticPropertyListingsPage, {
  type StaticListingSearchParams,
} from "@/components/properties/StaticPropertyListingsPage";
import { buildListingPageSchema } from "@/lib/seo/listingPageSchema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Townhouses For Sale",
  description: "Browse through our wide selection of townhouses for sale in Kenya.",
  alternates: { canonical: "/townhouses" },
};

const jsonLd = buildListingPageSchema({
  name: "Townhouses For Sale in Kenya | VectorAfriq",
  url: `${SITE_URL}/townhouses`,
  description:
    "Find your dream townhouse in Kenya. Browse our collection of modern townhouses and maisonettes across Nairobi, Mombasa, Kisumu, and beyond.",
  breadcrumbLabel: "Townhouses For Sale",
  itemType: "House",
});

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/townhouses", baseMetadata);
}

export default async function TownhousesPage({
  searchParams,
}: {
  searchParams: Promise<StaticListingSearchParams>;
}) {
  return (
    <>
      <script
        id="townhouses-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPropertyListingsPage
        category="townhouses"
        type="sale"
        title="Townhouses For Sale in Kenya"
        breadcrumbPath="/townhouses"
        description="Find your dream townhouse in Kenya. Browse through our extensive collection of townhouses for sale."
        searchParams={await searchParams}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
