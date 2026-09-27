import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import StaticPropertyListingsPage, {
  type StaticListingSearchParams,
} from "@/components/properties/StaticPropertyListingsPage";
import { buildListingPageSchema } from "@/lib/seo/listingPageSchema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Apartments For Rent",
  description: "Browse through our wide selection of apartments for rent in Kenya.",
  alternates: { canonical: "/apartments-for-rent" },
};

const jsonLd = buildListingPageSchema({
  name: "Apartments For Rent in Kenya | VectorAfriq",
  url: `${SITE_URL}/apartments-for-rent`,
  description:
    "Find apartments for rent across Kenya, from modern studio flats to spacious penthouses in major neighborhoods.",
  breadcrumbLabel: "Apartments For Rent",
  itemType: "Apartment",
});

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/apartments-for-rent", baseMetadata);
}

export default async function ApartmentsForRentPage({
  searchParams,
}: {
  searchParams: Promise<StaticListingSearchParams>;
}) {
  return (
    <>
      <script
        id="apartments-rent-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPropertyListingsPage
        type="rent"
        category="apartments"
        title="Apartments For Rent in Kenya"
        breadcrumbPath="/apartments-for-rent"
        description="Find apartments for rent across Kenya, from modern studio flats to spacious penthouses in major neighborhoods."
        searchParams={await searchParams}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
