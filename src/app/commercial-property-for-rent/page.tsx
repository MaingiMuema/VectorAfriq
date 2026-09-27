import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import StaticPropertyListingsPage, {
  type StaticListingSearchParams,
} from "@/components/properties/StaticPropertyListingsPage";
import { buildListingPageSchema } from "@/lib/seo/listingPageSchema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Commercial Property For Rent",
  description:
    "Browse through our wide selection of commercial properties for rent in Kenya.",
  alternates: { canonical: "/commercial-property-for-rent" },
};

const jsonLd = buildListingPageSchema({
  name: "Commercial Property For Rent in Kenya | VectorAfriq",
  url: `${SITE_URL}/commercial-property-for-rent`,
  description:
    "Find your ideal commercial property for rent in Kenya. Browse office spaces, retail shops, warehouses, and more across major Kenyan cities.",
  breadcrumbLabel: "Commercial For Rent",
});

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/commercial-property-for-rent", baseMetadata);
}

export default async function CommercialPropertyForRentPage({
  searchParams,
}: {
  searchParams: Promise<StaticListingSearchParams>;
}) {
  return (
    <>
      <script
        id="commercial-rent-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPropertyListingsPage
        type="rent"
        category="commercial"
        title="Commercial Property For Rent in Kenya"
        breadcrumbPath="/commercial-property-for-rent"
        description="Find your ideal commercial property for rent in Kenya. Browse through our collection of office spaces, retail shops, warehouses, and more."
        searchParams={await searchParams}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
