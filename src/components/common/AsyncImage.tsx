"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { getImageUrl } from "@/utils/image";

interface AsyncImageProps extends Omit<ImageProps, "src"> {
  src: string;
  alt: string; // Make alt required
}

export default function AsyncImage({ src, ...imageProps }: AsyncImageProps) {
  const [imageSrc, setImageSrc] = useState("/images/placeholder.png");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let mounted = true;

    const loadImage = async () => {
      try {
        const resolvedSrc = await getImageUrl(src);
        if (mounted) {
          setImageSrc(resolvedSrc);
        }
      } catch (error) {
        console.error("Error loading image:", error);
        if (mounted) {
          setImageSrc("/images/placeholder.png");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [src]);

  return (
    <div className={`relative ${isLoading ? "animate-pulse bg-gray-200" : ""}`}>
      <Image
        {...imageProps}
        src={imageSrc}
        alt={imageProps.alt}
        className={`${imageProps.className || ""} ${
          isLoading ? "opacity-0" : "opacity-100"
        } transition-opacity duration-200`}
      />
    </div>
  );
}
