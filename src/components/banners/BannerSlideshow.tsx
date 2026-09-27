"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl?: string | null;
  locations: string[];
  active: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_BANNER_ASPECT_RATIO = "4 / 1";

function getBannerImageUrl(imageUrl: string): string {
  if (!imageUrl) return '/images/placeholder.png';
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/api/images/serve/')) return imageUrl;
  return imageUrl;
}

function getSafeBannerHref(linkUrl?: string | null): string | null {
  const trimmedLinkUrl = linkUrl?.trim();

  if (!trimmedLinkUrl) return null;
  if (trimmedLinkUrl.startsWith("/")) return trimmedLinkUrl;

  try {
    const url = new URL(trimmedLinkUrl);
    return url.protocol === "http:" || url.protocol === "https:"
      ? trimmedLinkUrl
      : null;
  } catch {
    return `/${trimmedLinkUrl}`;
  }
}

interface BannerSlideshowProps {
  fallbackDescription?: string;
  className?: string;
  locationId?: string; // Location ID for filtering banners
}

export default function BannerSlideshow({
  fallbackDescription,
  className = "w-full min-h-[112px] sm:min-h-0 rounded-lg overflow-hidden mb-6 shadow-md",
  locationId
}: BannerSlideshowProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageRetries, setImageRetries] = useState<Record<string, number>>({});
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        console.log('BannerSlideshow: Starting fetch for active banners');
        console.log('BannerSlideshow: Current URL:', window.location.href);
        console.log('BannerSlideshow: Location filter:', locationId);

        // Build query parameters
        const params = new URLSearchParams();
        params.append('active', 'true');
        if (locationId) {
          params.append('locationId', locationId);
        }

        const fetchUrl = `/api/media-content?${params.toString()}`;
        console.log('BannerSlideshow: Fetch URL:', fetchUrl);

        // Use media-content endpoint to avoid adblocker blocking /api/banners
        const response = await fetch(fetchUrl);

        console.log('BannerSlideshow: Response received:', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('BannerSlideshow: API error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`Failed to fetch banners: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('BannerSlideshow: API response data:', data);

        setBanners(data.banners || []);

        if (data.banners && data.banners.length > 0) {
          console.log(`BannerSlideshow: Found ${data.banners.length} active banners for location: ${locationId || 'all'}`);
        } else {
          console.log(`BannerSlideshow: No active banners found for location: ${locationId || 'all'}`);
        }
      } catch (error) {
        console.error("BannerSlideshow: Error details:", {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        // Set empty array on error to show fallback
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure the component is fully mounted
    const timeoutId = setTimeout(fetchBanners, 100);
    return () => clearTimeout(timeoutId);
  }, [locationId]);

  // Auto-advance slideshow
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1);
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  // If no banners found and a locationId is specified, don't show anything
  if (banners.length === 0 && locationId) {
    return null;
  }

  // If no banners found and no locationId specified, show fallback
  if (banners.length === 0 && !locationId) {
    return (
      <div
        className={`${className} bg-gray-900 relative`}
        style={{ aspectRatio: DEFAULT_BANNER_ASPECT_RATIO }}
      >
        {!imageLoaded[-1] && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-wave" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#468AD1]/10 to-transparent animate-pulse" />
          </div>
        )}
        <Image
          src="/images/placeholder.png"
          alt="Find Your Perfect Property"
          fill
          sizes="(max-width: 1024px) 100vw, 75vw"
          className={`object-cover opacity-80 transition-opacity duration-500 ${imageLoaded[-1] ? 'opacity-80' : 'opacity-0'}`}
          priority
          onLoad={() => setImageLoaded(prev => ({ ...prev, [-1]: true }))}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-gray-900/20 flex items-center">
          <div className="text-white px-6 md:px-8 max-w-2xl">
            <h2 className="text-lg md:text-xl font-semibold mb-1">
              Find Your Perfect Property
            </h2>
            <p className="text-xs md:text-sm text-gray-200 font-light">
              {fallbackDescription || "Browse through our wide selection of properties"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];
  const bannerHref = getSafeBannerHref(currentBanner.linkUrl);
  const currentAspectRatio =
    imageAspectRatios[currentIndex] || DEFAULT_BANNER_ASPECT_RATIO;
  const bannerImage = (
    <Image
      src={getBannerImageUrl(currentBanner.imageUrl) || '/images/placeholder.png'}
      alt={`Banner ${currentIndex + 1}`}
      fill
      sizes="(max-width: 1024px) 100vw, 75vw"
      className={`object-contain transition-opacity duration-500 ${imageLoaded[currentIndex] ? 'opacity-100' : 'opacity-0'}`}
      priority
      quality={85}
      onLoad={(event) => {
        const target = event.currentTarget;

        setImageLoaded(prev => ({ ...prev, [currentIndex]: true }));

        if (target.naturalWidth > 0 && target.naturalHeight > 0) {
          setImageAspectRatios(prev => ({
            ...prev,
            [currentIndex]: `${target.naturalWidth} / ${target.naturalHeight}`,
          }));
        }
      }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        const key = `banner-${currentIndex}`;
        const retries = imageRetries[key] || 0;

        if (retries < 2) {
          setImageRetries(prev => ({ ...prev, [key]: retries + 1 }));
          setTimeout(() => {
            target.src = getBannerImageUrl(currentBanner.imageUrl) + `?retry=${retries + 1}`;
          }, 1000 * (retries + 1));
        } else {
          target.src = "/images/placeholder.png";
          setImageLoaded(prev => ({ ...prev, [currentIndex]: true }));
        }
      }}
    />
  );

  return (
    <div
      className={`${className} bg-gray-900 relative group`}
      style={{ aspectRatio: currentAspectRatio }}
    >
      {!imageLoaded[currentIndex] && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-wave" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#468AD1]/10 to-transparent animate-pulse" />
        </div>
      )}
      {bannerHref ? (
        <a
          href={bannerHref}
          className="absolute inset-0 block"
          aria-label={`Open banner ${currentIndex + 1}`}
        >
          {bannerImage}
        </a>
      ) : (
        bannerImage
      )}

      {/* Navigation arrows - only show if more than one banner */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 z-10 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70"
            aria-label="Previous banner"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 z-10 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70"
            aria-label="Next banner"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-2 left-1/2 z-10 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
