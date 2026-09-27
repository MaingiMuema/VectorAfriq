import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import StaticPropertyListingsPage, {
  type StaticListingSearchParams,
} from "@/components/properties/StaticPropertyListingsPage";
import { buildListingPageSchema } from "@/lib/seo/listingPageSchema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Airbnb Properties",
  description:
    "Browse through our wide selection of Airbnb & short-stay properties in Kenya.",
  alternates: { canonical: "/airbnb" },
};

const jsonLd = buildListingPageSchema({
  name: "Airbnb & Short-Stay Properties in Kenya | VectorAfriq",
  url: `${SITE_URL}/airbnb`,
  description:
    "Discover perfect vacation rentals and Airbnb properties across Kenya. From cozy apartments to luxury villas, find your ideal short-term stay.",
  breadcrumbLabel: "Airbnb",
  itemType: "LodgingBusiness",
});

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/airbnb", baseMetadata);
}

export default async function AirbnbPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<StaticListingSearchParams>;
}) {
  return (
    <>
      <script
        id="airbnb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StaticPropertyListingsPage
        type="airbnb"
        title="Airbnb Properties in Kenya"
        breadcrumbPath="/airbnb"
        description="Discover perfect vacation rentals and Airbnb properties across Kenya. From cozy apartments to luxury villas, find your ideal short-term stay."
        searchParams={await searchParams}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
