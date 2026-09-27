import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FiMapPin, FiCalendar, FiArrowLeft, FiChevronRight } from "react-icons/fi";
import { getNeighborhoodGuideBySlug } from "@/lib/neighborhoodGuideData";
import { processImageUrl } from "@/lib/imageUtils";
import GuideDetailAdminActions from "@/components/neighborhood-guides/GuideDetailAdminActions";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getGuideLocationLabel(guide: {
  neighborhoodName?: string | null;
  cityName?: string | null;
  countyName?: string;
}): string {
  if (guide.neighborhoodName && guide.cityName && guide.countyName) {
    return `${guide.neighborhoodName}, ${guide.cityName}, ${guide.countyName}`;
  }
  if (guide.cityName && guide.countyName) {
    return `${guide.cityName}, ${guide.countyName}`;
  }
  return guide.countyName || "";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getNeighborhoodGuideBySlug(slug);

  if (!guide) {
    return { title: "Guide Not Found" };
  }

  const title = guide.metaTitle || guide.title;
  const description = guide.metaDescription || guide.excerpt || `Learn about ${guide.title} - a comprehensive neighborhood guide.`;
  const locationLabel = getGuideLocationLabel(guide);

  return {
    title: `${title} | VectorAfriq Kenya`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(guide.image && {
        images: [{ url: guide.image, width: 1200, height: 630, alt: guide.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(guide.image && { images: [guide.image] }),
    },
    alternates: {
      canonical: `/neighborhood-guide/${slug}`,
    },
  };
}

export default async function NeighborhoodGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = await getNeighborhoodGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const locationLabel = getGuideLocationLabel(guide);

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt || guide.metaDescription || "",
    author: {
      "@type": "Organization",
      name: "VectorAfriq Kenya",
    },
    publisher: {
      "@type": "Organization",
      name: "VectorAfriq Kenya",
      logo: {
        "@type": "ImageObject",
        url: "https://vectorafriqproperties.co.ke/logo.png",
      },
    },
    datePublished: guide.createdAt,
    dateModified: guide.updatedAt,
    image: guide.image || undefined,
    about: {
      "@type": "Place",
      name: locationLabel,
      address: {
        "@type": "PostalAddress",
        addressLocality: guide.cityName || guide.countyName,
        addressRegion: guide.countyName,
        addressCountry: "KE",
      },
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
              <Link href="/neighborhood-guides" className="hover:text-[#468AD1]">
                Neighborhood Guides
              </Link>
              <FiChevronRight className="w-3 h-3" />
              <span className="text-[#468AD1] font-medium truncate max-w-[200px]">
                {guide.title}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8 lg:py-12">
            <Link
              href="/neighborhood-guides"
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-[#468AD1] mb-4 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to All Guides
            </Link>

            <div className="max-w-4xl">
              {/* Location Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#468AD1]/10 rounded-full text-sm font-medium text-[#468AD1]">
                  <FiMapPin className="w-3 h-3" />
                  {guide.locationType === "neighborhood"
                    ? "Neighborhood Guide"
                    : guide.locationType === "city"
                      ? "City Guide"
                      : "County Guide"}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] leading-tight font-bold text-gray-900 mb-4">
                {guide.title}
              </h1>

              {/* Location & Date */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {locationLabel && (
                  <span className="flex items-center gap-1">
                    <FiMapPin className="w-4 h-4" />
                    {locationLabel}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  {formatDate(guide.createdAt)}
                </span>
              </div>

              {/* Excerpt */}
              {guide.excerpt && (
                <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                  {guide.excerpt}
                </p>
              )}

              {/* Admin-only inline management (renders nothing for regular users) */}
              <GuideDetailAdminActions
                guideId={guide.id}
                published={Boolean(guide.published)}
              />
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {guide.image && (
          <div className="container mx-auto px-4 -mt-4 mb-8">
            <div className="relative w-full max-w-4xl aspect-[21/9] rounded-2xl overflow-hidden shadow-lg bg-gray-200">
              <Image
                src={processImageUrl(guide.image, guide.id)}
                alt={guide.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Guide Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <article className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8 lg:p-10">
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: guide.content }}
              />
            </article>

            {/* Back Link */}
            <div className="mt-8 text-center">
              <Link
                href="/neighborhood-guides"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors font-medium"
              >
                <FiArrowLeft className="w-4 h-4" />
                Browse All Neighborhood Guides
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
