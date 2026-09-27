'use client';

import { FiHeart, FiShare2, FiEye } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import type { FavoriteProperty } from '@/lib/favorites';

interface FavoritesGridProps {
  properties: FavoriteProperty[];
  onRemove: (id: string) => void;
  onShare: (id: string) => void;
}

export default function FavoritesGrid({ properties, onRemove, onShare }: FavoritesGridProps) {
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    });
  };

  const getStatusColor = (status: FavoriteProperty['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div
          key={property.id}
          className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200"
        >
          {/* Property Image */}
          <div className="relative h-48">
            <Image
              src={property.image}
              alt={property.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                onClick={() => onRemove(property.id)}
                aria-label={`Remove ${property.title} from favorites`}
                className="p-2 rounded-full bg-white shadow-sm hover:bg-red-50 transition-colors duration-200"
              >
                <FiHeart className="w-4 h-4 text-red-500" fill="currentColor" />
              </button>
              <button
                onClick={() => onShare(property.id)}
                aria-label={`Share ${property.title}`}
                className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors duration-200"
              >
                <FiShare2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="absolute bottom-2 left-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(property.status)}`}>
                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Property Details */}
          <div className="p-4">
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {property.title}
              </h3>
              <p className="text-sm text-gray-600">{property.location}</p>
            </div>

            <div className="mb-4">
              <p className="text-lg font-bold text-[#468AD1]">
                {formatPrice(property.price)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-sm text-gray-600">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="font-semibold">{property.bedrooms}</p>
                <p>Beds</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="font-semibold">{property.bathrooms}</p>
                <p>Baths</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="font-semibold">{property.area}</p>
                <p>Sq.ft</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Added {new Date(property.addedDate).toLocaleDateString('en-KE', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <Link
                href={property.url}
                className="inline-flex items-center text-sm text-[#468AD1] hover:text-[#2F6FAE]"
              >
                <FiEye className="w-4 h-4 mr-1" />
                View Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
