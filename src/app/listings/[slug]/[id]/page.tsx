import { notFound } from "next/navigation";
import { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { query } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { isHtmlDescription, stripHtml } from "@/lib/descriptionUtils";
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaYoutube, FaTiktok, FaFacebook, FaExternalLinkAlt, FaClipboardCheck, FaArrowRight } from "react-icons/fa";
import PropertyContact from "@/components/properties/PropertyContact";
import PropertyStructuredData from "@/components/seo/PropertyStructuredData";
import ImageGallery from "@/components/properties/ImageGallery";
import FavoriteButton from "@/components/properties/FavoriteButton";
import DescriptionRenderer from "@/components/properties/DescriptionRenderer";
import { searchProperties } from "@/lib/propertySearch";
import { getPropertyUrl } from "@/lib/propertyCache";
import { processImageUrl } from "@/lib/imageUtils";
import ReportButton from "@/components/properties/ReportButton";
import { buildListingUrl } from "@/lib/seo/routes";
import { overlayPageOverride } from "@/lib/seo/metadata";

// Utility functions
const getTypeUrl = (type: string): string => {
  switch (type.toUpperCase()) {
    case "SALE":
      return "for-sale";
    case "RENT":
      return "for-rent";
    case "AIRBNB":
      return "airbnb";
    default:
      return type.toLowerCase();
  }
};

const getTypeDisplay = (type: string): string => {
  switch (type.toUpperCase()) {
    case "SALE":
      return "For Sale";
    case "RENT":
      return "For Rent";
    case "AIRBNB":
      return "Airbnb";
    default:
      return type;
  }
};

import type { BadgeTier } from "@/types";
import AgentBadge from "@/components/properties/AgentBadge";

// Database types
interface DbProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  type: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  floorSize: number;
  plotSize: number;
  paymentTerms: string;
  features: string;
  status: string;
  images: string;
  videos?: string;
  virtualTour?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  userId: string;
  featured: boolean;
  createdAt: Date;
  userName: string;
  userEmail: string;
  userPhone: string;
  userBadgeTier: BadgeTier;
  companyPhone: string | null;
  companyName: string | null;
  companyLogo: string | null;
  countyName: string | null;
  cityName: string | null;
  neighborhoodName: string | null;
}

// Processed property type for the component
interface ProcessedProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  category: string;
  bedrooms: number;
  bathrooms: number;
  location: {
    county: string;
    city: string;
    neighborhood: string;
    address: string;
  };
  images: string[];
  videos: string[];
  virtualTour?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  features: string[];
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    badgeTier: BadgeTier;
  };
  company: {
    name: string;
    logo: string;
    phone: string;
  } | null;
}

// Process property images
function processPropertyImages(imageData: string | string[] | undefined, propertyId: string): string[] {
  try {
    if (!imageData) {
      return ["/images/placeholder.png"];
    }

    const images = typeof imageData === "string" ? JSON.parse(imageData) : imageData;

    if (!Array.isArray(images)) {
      return ["/images/placeholder.png"];
    }

    const processedImages = images.map(img => {
      if (typeof img !== "string") return "/images/placeholder.png";

      if (img.startsWith("/api/images/")) return img;

      let filename = img;
      if (img.includes('/')) {
        const pathParts = img.split('/');
        filename = pathParts[pathParts.length - 1];
      }

      const finalPath = `/api/images/serve/${propertyId}/${filename}`;
      return finalPath;
    });

    return processedImages.length > 0 ? processedImages : ["/images/placeholder.png"];
  } catch (error) {
    console.error("Error processing images:", error);
    return ["/images/placeholder.png"];
  }
}

// Process property videos
function processPropertyVideos(videoData: string | string[] | undefined): string[] {
  try {
    if (!videoData) return [];

    const videos = typeof videoData === "string" ? JSON.parse(videoData) : videoData;

    if (!Array.isArray(videos)) return [];

    return videos.map(vid => {
      if (typeof vid !== "string") return "";
      if (vid.startsWith("http")) return vid;
      // Use relative paths to be environment-agnostic
      return vid.startsWith("/") ? vid : `/${vid}`;
    }).filter(v => v !== "");
  } catch (error) {
    console.error("Error processing videos:", error);
    return [];
  }
}

// Process features
function processFeatures(featuresData: string | string[] | undefined): string[] {
  try {
    if (!featuresData) return [];

    const parsed = typeof featuresData === "string" ? JSON.parse(featuresData) : featuresData;

    if (Array.isArray(parsed)) return parsed;

    if (parsed.features && Array.isArray(parsed.features)) return parsed.features;

    if (typeof parsed === 'object' && parsed !== null) {
      return Object.values(parsed).filter(value => typeof value === 'string');
    }

    return [];
  } catch (error) {
    console.error("Error processing features:", error);
    return [];
  }
}

// Safe string conversion
function toString(value: any): string {
  return value == null ? "" : String(value);
}

// Safe number conversion
function toNumber(value: any): number {
  return value == null ? 0 : Number(value);
}

// Fetch single property
async function fetchProperty(id: string): Promise<ProcessedProperty | null> {
  try {
    noStore();

    const getPropertyQuery = `
      SELECT
        p.*,
        u.name as userName,
        u.email as userEmail,
        u.phone as userPhone,
        u.badgeTier as userBadgeTier,
        c.phone as companyPhone,
        c.name as companyName,
        c.logo as companyLogo,
        co.name as countyName,
        ci.name as cityName,
        n.name as neighborhoodName
      FROM property p
      LEFT JOIN user u ON p.userId = u.id
      LEFT JOIN company c ON u.id = c.userId
      LEFT JOIN county co ON co.name = (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(p.location, ',', 3), ',', -1))
      LEFT JOIN city ci ON ci.name = (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(p.location, ',', 2), ',', -1))
      LEFT JOIN neighborhood n ON n.name = (SELECT SUBSTRING_INDEX(p.location, ',', 1))
      WHERE p.id = ?
    `;

    const [property] = await query<DbProperty>(getPropertyQuery, [id]);

    if (!property) return null;

    const locationParts = toString(property.location).split(",").map((part: string) => part.trim());

    const formattedProperty: ProcessedProperty = {
      id: toString(property.id),
      title: toString(property.title),
      description: toString(property.description),
      price: toNumber(property.price),
      type: toString(property.type),
      category: toString(property.category),
      bedrooms: toNumber(property.bedrooms),
      bathrooms: toNumber(property.bathrooms),
      images: processPropertyImages(property.images, property.id),
      videos: processPropertyVideos(property.videos),
      virtualTour: property.virtualTour || "",
      youtubeUrl: property.youtubeUrl || "",
      tiktokUrl: property.tiktokUrl || "",
      facebookUrl: property.facebookUrl || "",
      features: processFeatures(property.features),
      location: {
        county: toString(property.countyName) || locationParts[2] || "",
        city: toString(property.cityName) || locationParts[1] || "",
        neighborhood: toString(property.neighborhoodName) || locationParts[0] || "",
        address: toString(property.location) || "",
      },
      user: {
        id: toString(property.userId),
        name: toString(property.userName),
        email: toString(property.userEmail),
        phone: toString(property.userPhone),
        badgeTier: (property.userBadgeTier as BadgeTier) || "NONE",
      },
      company: property.companyName ? {
        name: toString(property.companyName),
        logo: toString(property.companyLogo),
        phone: toString(property.companyPhone),
      } : null,
    };

    return formattedProperty;
  } catch (error) {
    console.error("Error fetching property:", error);
    return null;
  }
}

// Generate metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await fetchProperty(id);

  if (!property) {
    return {
      title: "Property Not Found | VectorAfriq",
    };
  }

  const typeText = getTypeDisplay(property.type);
  const title = `${property.title} - ${typeText} in ${property.location.city}, ${property.location.county} | VectorAfriq`;
  const plainDescription = isHtmlDescription(property.description) ? stripHtml(property.description) : property.description;
  const description = `${plainDescription.substring(0, 160)}... ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms, KSh ${property.price.toLocaleString()}`;
  const listingPath = buildListingUrl(property);

  const baseMetadata: Metadata = {
    title,
    description,
    keywords: [
      property.title,
      property.location.city,
      property.location.county,
      property.category.toLowerCase(),
      property.type.toLowerCase(),
      "Kenya real estate",
      "VectorAfriq",
    ].join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_US",
      siteName: "VectorAfriq Kenya",
      images: property.images.slice(0, 1).map(img => ({
        url: img,
        width: 1200,
        height: 630,
        alt: property.title,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: property.images.slice(0, 1),
    },
    alternates: {
      canonical: `https://vectorafriqproperties.co.ke${listingPath}`,
    },
  };

  return overlayPageOverride(listingPath, baseMetadata, { type: "property", id: property.id });
}

interface PropertyPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function SinglePropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;

  const property = await fetchProperty(id);

  if (!property) {
    notFound();
  }

  // Fetch similar properties by category and type, excluding current
  const similarResult = await searchProperties({
    category: property.category,
    type: property.type,
    city: property.location.city || undefined,
    limit: 6,
  }).catch(() => ({ properties: [] }));
  const similarProperties = similarResult.properties.filter(
    (p) => p.id !== property.id
  ).slice(0, 6);

  const typeText = getTypeDisplay(property.type);
  const canonicalUrl = `https://vectorafriqproperties.co.ke${buildListingUrl(property)}`;

  return (
    <>
      <PropertyStructuredData property={property} url={canonicalUrl} />

      <div className="mx-auto px-4 sm:px-6 lg:px-10 py-8 pt-20 bg-gray-50">
        {/* Breadcrumb */}
        <nav className="flex items-center flex-wrap text-xs sm:text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link
            href={`/${getTypeUrl(property.type)}`}
            className="hover:text-blue-600"
          >
            {typeText}
          </Link>
          {property.location.county && (
            <>
              <span className="mx-2">›</span>
              <Link
                href={`/${getTypeUrl(property.type)}/${encodeURIComponent(
                  property.location.county.toLowerCase().replace(/\s+/g, "-")
                )}`}
                className="hover:text-blue-600"
              >
                {property.location.county}
              </Link>
            </>
          )}
          {property.location.city && property.location.city !== property.location.county && (
            <>
              <span className="mx-2">›</span>
              <Link
                href={`/${getTypeUrl(property.type)}/${encodeURIComponent(
                  property.location.city.toLowerCase().replace(/\s+/g, "-")
                )}`}
                className="hover:text-blue-600"
              >
                {property.location.city}
              </Link>
            </>
          )}
          {property.location.neighborhood &&
            property.location.neighborhood !== property.location.city &&
            property.location.neighborhood !== property.location.county && (
              <>
                <span className="mx-2">›</span>
                <Link
                  href={`/${getTypeUrl(property.type)}/${encodeURIComponent(
                    property.location.neighborhood.toLowerCase().replace(/\s+/g, "-")
                  )}`}
                  className="hover:text-blue-600"
                >
                  {property.location.neighborhood}
                </Link>
              </>
            )}
          <span className="mx-2">›</span>
          <span className="text-gray-700">{property.title}</span>
        </nav>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-8">
            {/* Property Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{property.title}</h1>
                  <div className="flex items-start gap-2 text-gray-600 mb-4">
                    <FaMapMarkerAlt className="w-5 h-5 mt-1 text-red-600 flex-shrink-0" />
                    <p className="text-base">{property.location.address}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                      <FaBed className="text-red-600" />
                      <span className="font-medium">{property.bedrooms} Bedrooms</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                      <FaBath className="text-red-600" />
                      <span className="font-medium">{property.bathrooms} Bathrooms</span>
                    </div>
                    {property.category && (
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                        <FaRulerCombined className="text-red-600" />
                        <span className="font-medium">{property.category}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="flex justify-start sm:justify-end gap-2 mb-3">
                    <FavoriteButton
                      property={{ id: property.id }}
                      className="inline-flex items-center justify-center h-10 w-10 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                    />
                    <ReportButton
                      propertyId={property.id}
                      propertyTitle={property.title}
                      className="inline-flex items-center justify-center h-10 px-3 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-red-50 transition-colors text-gray-500 hover:text-red-600 text-xs font-medium gap-1.5"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Price</p>
                  <div className="text-3xl font-bold text-red-600">
                    KSh {property.price.toLocaleString()}
                  </div>
                  <span className="inline-block mt-2 bg-yellow-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
                    Gold Listing
                  </span>
                </div>
              </div>
            </div>

            {/* Media Gallery with Navigation and Fullscreen */}
            <div className="mb-8">
              <ImageGallery
                images={property.images}
                videos={property.videos}
                title={property.title}
              />
            </div>

            {/* Property Details */}
            <div className="space-y-6">

              {(property.youtubeUrl || property.tiktokUrl || property.facebookUrl || property.virtualTour) && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-3">Social Media & Tours</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {property.youtubeUrl && (
                      <a
                        href={property.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-red-50 transition-colors group"
                      >
                        <FaYoutube className="text-2xl text-[#FF0000]" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">YouTube Video</p>
                          <p className="text-sm text-gray-500">Watch on YouTube</p>
                        </div>
                        <FaExternalLinkAlt className="text-gray-300 group-hover:text-red-500 transition-colors text-sm" />
                      </a>
                    )}
                    {property.tiktokUrl && (
                      <a
                        href={property.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <FaTiktok className="text-2xl text-black" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">TikTok Video</p>
                          <p className="text-sm text-gray-500">Watch on TikTok</p>
                        </div>
                        <FaExternalLinkAlt className="text-gray-300 group-hover:text-black transition-colors text-sm" />
                      </a>
                    )}
                    {property.facebookUrl && (
                      <a
                        href={property.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-blue-50 transition-colors group"
                      >
                        <FaFacebook className="text-2xl text-[#1877F2]" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Facebook Video</p>
                          <p className="text-sm text-gray-500">Watch on Facebook</p>
                        </div>
                        <FaExternalLinkAlt className="text-gray-300 group-hover:text-blue-500 transition-colors text-sm" />
                      </a>
                    )}
                    {property.virtualTour && (
                      <a
                        href={property.virtualTour}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-purple-50 transition-colors group"
                      >
                        <FaExternalLinkAlt className="text-2xl text-purple-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Virtual Tour</p>
                          <p className="text-sm text-gray-500">View 360° Tour</p>
                        </div>
                        <FaExternalLinkAlt className="text-gray-300 group-hover:text-purple-500 transition-colors text-sm" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-3">Description</h2>
                <DescriptionRenderer description={property.description} />
              </div>

              {property.features.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-3">
                    Features & Amenities
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-green-600"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-gray-800 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verify Property */}
              <Link
                href={`/surveyors-legal?property=${encodeURIComponent(property.title)}&location=${encodeURIComponent(property.location.address)}&type=verification`}
                className="block bg-gradient-to-r from-[#514f63] to-[#3d3b4e] rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#468AD1] transition-colors">
                    <FaClipboardCheck className="text-xl text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Verify This Property</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Get a professional property survey or legal consultation before you buy. Connect with verified surveyors and legal experts.
                    </p>
                    <span className="inline-flex items-center mt-3 text-sm font-semibold text-[#468AD1] group-hover:text-white transition-colors">
                      Request Verification
                      <FaArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <PropertyContact
                propertyId={property.id}
                propertyTitle={property.title}
                userName={property.user.name}
                userPhone={property.user.phone}
                companyName={property.company?.name}
                companyLogo={property.company?.logo}
                companyPhone={property.company?.phone}
                badgeTier={property.user.badgeTier}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Similar Properties Grid */}
      {similarProperties.length > 0 && (
        <div className="mx-auto px-4 sm:px-6 lg:px-10 py-10 bg-white border-t">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Similar Properties</h2>
              <Link
                href={`/${getTypeUrl(property.type)}${property.location.city ? `/${encodeURIComponent(property.location.city.toLowerCase().replace(/\s+/g, "-"))}` : ""}`}
                className="text-sm font-medium text-[#468AD1] hover:text-[#c9273a] transition-colors"
              >
                View all {getTypeDisplay(property.type).toLowerCase()} listings →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map((similar) => (
                <Link
                  key={similar.id}
                  href={getPropertyUrl(similar.id, similar.title)}
                  className="group block bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <Image
                      src={processImageUrl(similar.images[0], similar.id)}
                      alt={similar.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 bg-[#468AD1] text-white text-xs font-semibold rounded-md">
                        {getTypeDisplay(similar.type)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#468AD1] transition-colors truncate">
                      {similar.title}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm mt-1.5">
                      <FaMapMarkerAlt className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{similar.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
                      {similar.bedrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <FaBed className="w-3.5 h-3.5" />
                          {similar.bedrooms} Beds
                        </span>
                      )}
                      {similar.bathrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <FaBath className="w-3.5 h-3.5" />
                          {similar.bathrooms} Baths
                        </span>
                      )}
                      {similar.size > 0 && (
                        <span className="flex items-center gap-1">
                          <FaRulerCombined className="w-3.5 h-3.5" />
                          {similar.size} m²
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <p className="text-lg font-bold text-[#468AD1]">
                        KES {similar.price.toLocaleString()}
                      </p>
                      {similar.type !== "SALE" && (
                        <span className="text-xs text-gray-400">/month</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
