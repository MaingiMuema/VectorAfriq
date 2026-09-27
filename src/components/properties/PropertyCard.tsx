import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  return (
    <Link href={`/properties/${property.id}`}>
      <div className="group relative overflow-hidden rounded-lg border">
        <div className="aspect-square overflow-hidden">
          <Image
            src={property.images[0]}
            alt={property.title}
            width={400}
            height={400}
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold">{property.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{property.location}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-lg font-bold">
              {formatPrice(property.price)}
              {!['SALE', 'sale'].includes(property.type?.toLowerCase() ?? '') && <span className="text-sm font-normal">/per month</span>}
            </p>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {['SALE', 'sale'].includes(property.type?.toLowerCase() ?? '') ? 'For Sale' : 'For Rent'}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <span>{property.bedrooms}</span>
                <span>Beds</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <span>{property.bathrooms}</span>
                <span>Baths</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span>{property.size}</span>
              <span>sqft</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
