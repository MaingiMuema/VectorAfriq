"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaBath,
  FaBed,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaRuler,
  FaUserCircle,
} from "react-icons/fa";
import { BiImages } from "react-icons/bi";
import { formatPrice } from "@/lib/utils";
import { processImageUrl, handleImageError } from "@/lib/imageUtils";
import { getPropertyUrl } from "@/lib/propertyCache";
import { isHtmlDescription, truncateDescription } from "@/lib/descriptionUtils";
import type { Property } from "@/types";
import FavoriteButton from "./FavoriteButton";
import ContactButtons from "./ContactButtons";
import AgentBadge from "@/components/properties/AgentBadge";

interface PropertyListViewProps {
  property: Property & {
    agent?: {
      name: string;
      image: string | null;
      company?: string;
      phone?: string;
      whatsapp?: string;
      badgeTier?: "NONE" | "VERIFIED" | "TRUSTED" | "ELITE";
    };
  };
  priority?: boolean;
}

function CompanyAvatar({
  image,
  name,
  propertyId,
}: {
  image?: string | null;
  name: string;
  propertyId: string;
}) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = image?.trim() ? processImageUrl(image, propertyId) : null;

  if (!imageSrc || hasError) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
        <FaBuilding className="h-5 w-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-100">
      <Image
        src={imageSrc}
        alt={name}
        fill
        className="object-cover"
        sizes="36px"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

function AgentAvatar({
  image,
  name,
  propertyId,
}: {
  image?: string | null;
  name: string;
  propertyId: string;
}) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = image?.trim() ? processImageUrl(image, propertyId) : null;

  if (!imageSrc || hasError) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
        <FaUserCircle className="h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-100">
      <Image
        src={imageSrc}
        alt={name}
        fill
        className="object-cover"
        sizes="36px"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export default function PropertyListView({
  property,
  priority = false,
}: PropertyListViewProps) {
  const href = getPropertyUrl(property.id, property.title);
  const displayImages =
    property.images.length > 0 ? property.images.slice(0, 4) : ["/images/placeholder.png"];
  const mainImage = displayImages[0];
  const thumbnailImages = displayImages.slice(1);
  const contactPhone = property.company?.phone || property.agent?.phone || undefined;
  const contactWhatsapp = property.agent?.whatsapp || property.company?.phone || contactPhone;

  return (
    <article className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-[340px] lg:w-[400px]">
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton
              property={{ id: property.id }}
              className="bg-white/95 p-2 rounded-full shadow-sm hover:bg-white transition-all hover:scale-105"
            />
          </div>

          <Link href={href} className="block">
            <div className="relative w-full h-[190px] sm:h-[220px] md:h-[250px] overflow-hidden bg-gray-100">
              <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                <BiImages className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-medium">
                  {property.images.length || 1}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-[1]" />
              <Image
                src={processImageUrl(mainImage, property.id)}
                alt={property.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 340px, 400px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                priority={priority}
                quality={75}
                onError={(event) =>
                  handleImageError(
                    event,
                    processImageUrl(mainImage, property.id),
                    () => {}
                  )
                }
              />
            </div>
          </Link>

          {thumbnailImages.length > 0 && (
            <div className="relative w-full h-[56px] sm:h-[68px] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
              <div className="absolute inset-0 flex gap-1 p-1">
                {thumbnailImages.map((image, index) => (
                  <Link
                    key={`${property.id}-thumb-${index}`}
                    href={href}
                    className="relative flex-none w-[calc(33.333%-2px)] sm:w-[calc(50%-2px)] h-full overflow-hidden rounded-sm bg-gray-100"
                  >
                    <Image
                      src={processImageUrl(image, property.id)}
                      alt={`${property.title} image ${index + 2}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 170px"
                      className="object-cover"
                      quality={60}
                      onError={(event) =>
                        handleImageError(
                          event,
                          processImageUrl(image, property.id),
                          () => {}
                        )
                      }
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#468AD1] transition-colors duration-300">
                  <Link href={href}>{property.title}</Link>
                </h2>
                <div className="flex items-center text-gray-500 text-sm">
                  <FaMapMarkerAlt className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                  <span className="truncate">{property.location}</span>
                </div>
              </div>

              {property.company?.name ? (
                <div className="flex items-center gap-3">
                  <CompanyAvatar
                    image={property.company.logo || property.agent?.image}
                    name={property.company.name}
                    propertyId={property.id}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900">
                        {property.company.name}
                      </p>
                      <AgentBadge tier={property.agent?.badgeTier} size="sm" />
                    </div>
                    {property.company.phone && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <FaPhone className="w-3 h-3" />
                        <span>{property.company.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : property.agent ? (
                <div className="flex items-center gap-3">
                  <AgentAvatar
                    image={property.agent.image}
                    name={property.agent.name}
                    propertyId={property.id}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900">
                        {property.agent.name}
                      </p>
                      <AgentBadge tier={property.agent.badgeTier} size="sm" />
                    </div>
                    {property.agent.company && (
                      <p className="text-xs text-gray-500">
                        {property.agent.company}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-1.5 rounded-lg">
                <FaRuler className="w-3.5 h-3.5 text-gray-400" />
                <span>{property.size} m2</span>
              </div>
              {property.bedrooms > 0 && (
                <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-1.5 rounded-lg">
                  <FaBed className="w-3.5 h-3.5 text-gray-400" />
                  <span>{property.bedrooms} Beds</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-1.5 rounded-lg">
                  <FaBath className="w-3.5 h-3.5 text-gray-400" />
                  <span>{property.bathrooms} Baths</span>
                </div>
              )}
            </div>

            {property.description && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 leading-relaxed">
                  <Link href={href}>
                    {truncateDescription(property.description, 130)}
                    <span className="text-[#468AD1] font-medium ml-1 group-hover:underline">
                      Read more
                    </span>
                  </Link>
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-[#468AD1] whitespace-nowrap">
                {formatPrice(property.price)}
              </p>
              {!["sale", "SALE"].includes(property.type) && (
                <p className="text-xs text-gray-400">per month</p>
              )}
            </div>
            <ContactButtons phone={contactPhone} whatsapp={contactWhatsapp} messageHref={href} />
          </div>
        </div>
      </div>
    </article>
  );
}
