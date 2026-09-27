import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import StaticPropertyListingsPage, {
  type StaticListingSearchParams,
} from "@/components/properties/StaticPropertyListingsPage";
import { buildListingPageSchema } from "@/lib/seo/listingPageSchema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Houses For Rent",
  description: "Browse through our wide selection of houses for rent in Kenya.",
  alternates: { canonical: "/houses-for-rent" },
};

const jsonLd = buildListingPageSchema({
  name: "Houses For Rent in Kenya | VectorAfriq",
  url: `${SITE_URL}/houses-for-rent`,
  description:
    "Find houses for rent across Kenya, from compact family homes to spacious residences in prime locations.",
  breadcrumbLabel: "Houses For Rent",
  itemType: "House",
});

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/houses-for-rent", baseMetadata);
}

export default async function HousesForRentPage({
  searchParams,
}: {
  searchParams: Promise<StaticListingSearchParams>;
}) {
  return (
    <>
      <script
        id="houses-rent-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPropertyListingsPage
        category="houses"
        type="rent"
        title="Houses For Rent in Kenya"
        breadcrumbPath="/houses-for-rent"
        description="Find houses for rent across Kenya, from compact family homes to spacious residences in prime locations."
        searchParams={await searchParams}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
