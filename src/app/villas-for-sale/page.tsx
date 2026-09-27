import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import StaticPropertyListingsPage, {
  type StaticListingSearchParams,
} from "@/components/properties/StaticPropertyListingsPage";
import { buildListingPageSchema } from "@/lib/seo/listingPageSchema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Villas For Sale",
  description: "Browse through our wide selection of luxury villas for sale in Kenya",
  alternates: {
    canonical: "/villas-for-sale",
  },
};

const jsonLd = buildListingPageSchema({
  name: "Luxury Villas For Sale in Kenya | VectorAfriq",
  url: `${SITE_URL}/villas-for-sale`,
  description:
    "Discover luxury villas for sale in Kenya. Browse premium residential properties with exquisite finishes, private gardens, swimming pools, and more.",
  breadcrumbLabel: "Villas For Sale",
  itemType: "House",
});

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/villas-for-sale", baseMetadata);
}

export default async function VillasForSalePage({
  searchParams,
}: {
  searchParams: Promise<StaticListingSearchParams>;
}) {
  return (
    <>
      <script
        id="villas-sale-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPropertyListingsPage
        category="villas"
        type="sale"
        title="Villas For Sale in Kenya"
        breadcrumbPath="/villas-for-sale"
        description="Discover luxury villas for sale in Kenya's most prestigious locations. Browse our collection of high-end residential properties with premium amenities and features."
        searchParams={await searchParams}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
