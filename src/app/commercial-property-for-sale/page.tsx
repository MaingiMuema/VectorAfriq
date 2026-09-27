import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import StaticPropertyListingsPage, {
  type StaticListingSearchParams,
} from "@/components/properties/StaticPropertyListingsPage";
import { buildListingPageSchema } from "@/lib/seo/listingPageSchema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Commercial Properties For Sale",
  description:
    "Browse through our wide selection of commercial properties for sale in Kenya.",
  alternates: { canonical: "/commercial-property-for-sale" },
};

const jsonLd = buildListingPageSchema({
  name: "Commercial Properties For Sale in Kenya | VectorAfriq",
  url: `${SITE_URL}/commercial-property-for-sale`,
  description:
    "Discover prime commercial properties for sale across Kenya. From office spaces to retail outlets and industrial warehouses, find the perfect location for your business.",
  breadcrumbLabel: "Commercial For Sale",
});

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/commercial-property-for-sale", baseMetadata);
}

export default async function CommercialPropertiesForSalePage({
  searchParams,
}: {
  searchParams: Promise<StaticListingSearchParams>;
}) {
  return (
    <>
      <script
        id="commercial-sale-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPropertyListingsPage
        category="commercial"
        type="sale"
        title="Commercial Properties For Sale in Kenya"
        breadcrumbPath="/commercial-property-for-sale"
        description="Discover prime commercial properties for sale across Kenya. From office spaces to retail outlets, find the perfect location for your business."
        searchParams={await searchParams}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
