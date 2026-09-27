"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  skeletonClassName?: string;
}

export default function OptimizedImage({ 
  skeletonClassName = "",
  className = "",
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      {!isLoaded && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse ${skeletonClassName}`} />
      )}
      <Image
        {...props}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        alt={props.alt || ""}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/images/placeholder.png";
          setIsLoaded(true);
        }}
      />
    </>
  );
}
