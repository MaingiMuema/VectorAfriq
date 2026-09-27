import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import Link from "next/link";
import { FiMapPin, FiChevronRight } from "react-icons/fi";
import { getPublishedGuides } from "@/lib/neighborhoodGuideData";
import NeighborhoodGuidesIndexGrid, {
  type IndexGuideItem,
} from "@/components/neighborhood-guides/NeighborhoodGuidesIndexGrid";

const baseMetadata: Metadata = {
  title: "Neighborhood Guides | VectorAfriq Kenya",
  description:
    "Explore comprehensive neighborhood guides for counties, cities, and neighborhoods across Kenya. Find the perfect area for your next property purchase or rental.",
  openGraph: {
    title: "Neighborhood Guides | VectorAfriq Kenya",
    description:
      "Explore comprehensive neighborhood guides for counties, cities, and neighborhoods across Kenya.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/neighborhood-guides", baseMetadata);
}

export default async function NeighborhoodGuidesIndexPage() {
  let guides: Awaited<ReturnType<typeof getPublishedGuides>> = [];
  try {
    guides = await getPublishedGuides();
  } catch (error) {
    console.error("Error fetching neighborhood guides:", error);
  }

  // JSON-LD for the list page
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Neighborhood Guides",
    description:
      "Explore comprehensive neighborhood guides for counties, cities, and neighborhoods across Kenya.",
    publisher: {
      "@type": "Organization",
      name: "VectorAfriq Kenya",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="pt-16 min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="w-full bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-[#468AD1]">
                Home
              </Link>
              <FiChevronRight className="w-3 h-3" />
              <span className="text-[#468AD1] font-medium">
                Neighborhood Guides
              </span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-10 lg:py-14">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#468AD1]/10 flex items-center justify-center">
                  <FiMapPin className="w-6 h-6 text-[#468AD1]" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Neighborhood Guides
                </h1>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Discover what makes each area special. Our comprehensive guides
                cover everything from local amenities and transport links to
                schools, shopping, and lifestyle.
              </p>
            </div>
          </div>
        </div>

        {/* Guides Grid (admin gets inline management controls) */}
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <NeighborhoodGuidesIndexGrid
            initialGuides={guides as IndexGuideItem[]}
          />
        </div>
      </div>
    </>
  );
}
