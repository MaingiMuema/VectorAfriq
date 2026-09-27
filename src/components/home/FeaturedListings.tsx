import Link from "next/link";
import Image from "next/image";
import { FaBath, FaBed, FaRuler } from "react-icons/fa";
import { MdLocationOn } from "react-icons/md";
import { getPropertyUrl } from "@/lib/propertyCache";
import { processImageUrl } from "@/lib/imageUtils";
import type { Property } from "@/types";

interface FeaturedListingsProps {
  properties: Property[];
}

export default function FeaturedListings({
  properties,
}: FeaturedListingsProps) {
  if (properties.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#514f63] mb-4">
            Featured Properties
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our hand-picked selection of premium properties across
            Kenya. From modern apartments to luxury villas, find your perfect
            home.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.map((property, index) => (
            <Link
              key={property.id}
              href={getPropertyUrl(property.id, property.title)}
              className="group bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-48">
                <Image
                  src={processImageUrl(property.images[0], property.id)}
                  alt={property.title}
                  fill
                  priority={index < 4}
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-[#468AD1] text-white px-3 py-1 rounded-md text-sm font-medium">
                    For {property.type}
                  </span>
                  <span className="bg-white/90 backdrop-blur-sm text-[#514f63] px-3 py-1 rounded-md text-sm font-medium">
                    Featured
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center text-gray-500 text-sm mb-2">
                  <MdLocationOn className="mr-1 text-[#468AD1]" />
                  {property.location}
                </div>
                <h3 className="font-semibold text-lg mb-2 text-[#514f63] group-hover:text-[#468AD1] transition-colors line-clamp-1">
                  {property.title}
                </h3>
                <p className="text-[#468AD1] font-bold mb-4">
                  KES {property.price.toLocaleString()}
                  {property.type.toLowerCase() === "rent" ? "/mo" : ""}
                </p>

                <div className="flex items-center justify-between text-gray-500 text-sm border-t pt-4">
                  {property.bedrooms > 0 && (
                    <div className="flex items-center">
                      <FaBed className="mr-2" />
                      <span>
                        {property.bedrooms}{" "}
                        {property.bedrooms === 1 ? "Bed" : "Beds"}
                      </span>
                    </div>
                  )}
                  {property.bathrooms > 0 && (
                    <div className="flex items-center">
                      <FaBath className="mr-2" />
                      <span>
                        {property.bathrooms}{" "}
                        {property.bathrooms === 1 ? "Bath" : "Baths"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <FaRuler className="mr-2" />
                    <span>{property.size} m2</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/properties"
            className="inline-block bg-[#468AD1] text-white px-8 py-3 rounded-md font-medium hover:bg-[#468AD1]/90 transition-colors"
          >
            View All Properties
          </Link>
        </div>
      </div>
    </section>
  );
}
