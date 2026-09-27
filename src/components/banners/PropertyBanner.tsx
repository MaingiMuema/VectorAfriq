"use client";

import BannerSlideshow from "./BannerSlideshow";

interface PropertyBannerProps {
  fallbackDescription?: string;
  locationId?: string;
}

export default function PropertyBanner({ fallbackDescription, locationId }: PropertyBannerProps) {
  return (
    <BannerSlideshow
      fallbackDescription={fallbackDescription}
      locationId={locationId}
      className="w-full rounded-lg overflow-hidden shadow-md"
    />
  );
}
