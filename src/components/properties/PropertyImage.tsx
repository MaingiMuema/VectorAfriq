import { useEffect } from 'react';
import Image from 'next/image';
import { useImageRetry } from '@/hooks/useImageRetry';

interface Property {
  id: string;
  title: string;
  images: string[];
}

import { processImageUrl } from '@/lib/imageUtils';

interface PropertyImageProps {
  property: Property;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  className?: string;
  priority?: boolean;
}

export const PropertyImage = ({
  property,
  onError,
  className = "object-cover transform group-hover:scale-105 transition-transform duration-500",
  priority = false
}: PropertyImageProps) => {
  const imageSrc = processImageUrl(property.images[0], property.id);

  const {
    currentSrc,
    setCurrentSrc,
    handleImageError
  } = useImageRetry({
    maxRetries: 3,
    retryDelay: 1000,
    fallbackSrc: "/images/placeholder.png"
  });

  // Set initial source
  useEffect(() => {
    setCurrentSrc(imageSrc);
  }, [imageSrc, setCurrentSrc]);

  // If we don't have a current source yet, show loading state
  if (!currentSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#468AD1]" />
      </div>
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={property.title}
      fill
      sizes="(max-width: 768px) 100vw, 340px"
      className={className}
      priority={priority}
      onError={(e) => handleImageError(imageSrc, onError)(e)}
    />
  );
};