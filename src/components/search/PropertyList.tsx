/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { FaBed, FaBath, FaRuler, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';

interface PropertyListProps {
  category: string;
  location?: string;
  bedrooms?: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

// Mock data - replace with real API call
const mockProperties = [
  {
    id: 1,
    title: 'Modern 3 Bedroom Apartment',
    location: 'Kilimani, Nairobi',
    price: 25000000,
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    image: '/images/properties/property-1.jpg',
    type: 'Apartment',
    featured: true,
  },
  // Add more mock properties...
];

export default function PropertyList() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const category = (params?.category as string) || 'sale';
  const location = searchParams?.get('location');
  const bedrooms = searchParams?.get('bedrooms');

  return (
    <div>
      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-[#514f63]">
          {mockProperties.length} Properties found
        </h2>
        <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:border-transparent">
          <option value="newest">Newest First</option>
          <option value="price-asc">Price (Low to High)</option>
          <option value="price-desc">Price (High to Low)</option>
        </select>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {mockProperties.map((property) => (
          <Link
            key={property.id}
            href={`/property/${property.id}`}
            className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border"
          >
            {/* Property Image */}
            <div className="relative h-64">
              <Image
                src={property.image}
                alt={property.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {property.featured && (
                <span className="absolute top-4 left-4 bg-[#468AD1] text-white px-3 py-1 rounded-full text-sm font-medium">
                  Featured
                </span>
              )}
              <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-[#468AD1] hover:text-white transition-colors">
                <FaHeart />
              </button>
            </div>

            {/* Property Details */}
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-[#468AD1] mb-2">
                <span className="px-3 py-1 bg-[#468AD1]/10 rounded-full">
                  {property.type}
                </span>
                <span className="px-3 py-1 bg-[#468AD1]/10 rounded-full">
                  For {category.includes('sale') ? 'Sale' : 'Rent'}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-[#514f63] mb-2 group-hover:text-[#468AD1] transition-colors">
                {property.title}
              </h3>

              <div className="flex items-center gap-2 text-gray-500 mb-4">
                <FaMapMarkerAlt className="text-[#468AD1]" />
                <span>{property.location}</span>
              </div>

              <div className="flex items-center gap-6 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <FaBed className="text-[#468AD1]" />
                  <span>{property.bedrooms} Beds</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaBath className="text-[#468AD1]" />
                  <span>{property.bathrooms} Baths</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaRuler className="text-[#468AD1]" />
                  <span>{property.area} m²</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-[#468AD1]">
                  <span className="text-sm">Price</span>
                  <p className="text-xl font-bold">
                    KES {property.price.toLocaleString()}
                  </p>
                </div>
                <button className="px-4 py-2 text-[#468AD1] border border-[#468AD1] rounded-lg hover:bg-[#468AD1] hover:text-white transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <nav className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 transition-colors">
            ←
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#468AD1] text-white">
            1
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 transition-colors">
            2
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 transition-colors">
            3
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 transition-colors">
            →
          </button>
        </nav>
      </div>
    </div>
  );
}
