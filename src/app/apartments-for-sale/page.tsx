import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import StaticPropertyListingsPage, {
  type StaticListingSearchParams,
} from "@/components/properties/StaticPropertyListingsPage";
import { buildListingPageSchema } from "@/lib/seo/listingPageSchema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Apartments For Sale",
  description: "Browse through our wide selection of apartments for sale in Kenya.",
  alternates: { canonical: "/apartments-for-sale" },
};

const jsonLd = buildListingPageSchema({
  name: "Apartments For Sale in Kenya | VectorAfriq",
  url: `${SITE_URL}/apartments-for-sale`,
  description:
    "Find your perfect apartment for sale in Kenya. Browse studio flats to luxury penthouses across Nairobi and other major cities.",
  breadcrumbLabel: "Apartments For Sale",
  itemType: "Apartment",
});

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/apartments-for-sale", baseMetadata);
}

export default async function ApartmentsForSalePage({
  searchParams,
}: {
  searchParams: Promise<StaticListingSearchParams>;
}) {
  return (
    <>
      <script
        id="apartments-sale-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPropertyListingsPage
        type="sale"
        category="apartments"
        title="Apartments For Sale in Kenya"
        breadcrumbPath="/apartments-for-sale"
        description="Find your perfect apartment for sale in Kenya. Browse through our extensive collection of apartments, from studios to luxury penthouses."
        searchParams={await searchParams}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
