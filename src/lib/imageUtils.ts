// Optimized image utilities with retry mechanism

const imageCache = new Map<string, string>();
const retryAttempts = new Map<string, number>();
const MAX_RETRIES = 4;

export const processImageUrl = (img: string | null | undefined, propertyId: string): string => {
  if (!img) return "/images/placeholder.png";
  if (img.startsWith("/api/images/serve/")) return img;

  if (img.startsWith("/companies/") || img.startsWith("companies/")) {
    return `/${img.replace(/^\//, '')}`;
  }

  const filename = img.includes('/') ? img.split('/').pop() : img;
  return `/api/images/serve/${propertyId}/${filename}`;
};

export const preloadImageWithRetry = async (src: string, retries = 0): Promise<void> => {
  if (typeof window === 'undefined' || imageCache.has(src)) return;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, src);
      retryAttempts.delete(src);
      resolve();
    };
    img.onerror = () => {
      if (retries < MAX_RETRIES) {
        setTimeout(() => preloadImageWithRetry(src, retries + 1), Math.min(1000 * Math.pow(2, retries), 5000));
      }
      resolve();
    };
    img.src = src;
  });
};

export const preloadImages = (urls: string[]): void => {
  urls.slice(0, 3).forEach(url => preloadImageWithRetry(url));
};

export const getImageSizes = (isThumbnail = false): string => {
  return isThumbnail
    ? "(max-width: 768px) 50vw, 170px"
    : "(max-width: 768px) 100vw, (max-width: 1024px) 340px, 400px";
};

export const getImageQuality = (isThumbnail = false): number => {
  return isThumbnail ? 60 : 75;
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, src: string | null | undefined, onRetry: () => void): void => {
  if (!src) {
    (e.target as HTMLImageElement).src = "/images/placeholder.png";
    return;
  }
  const target = e.target as HTMLImageElement;
  const attempts = retryAttempts.get(src) || 0;

  if (attempts < MAX_RETRIES) {
    retryAttempts.set(src, attempts + 1);
    setTimeout(() => {
      target.src = src;
      onRetry();
    }, Math.min(1000 * Math.pow(2, attempts), 5000));
  } else {
    target.src = "/images/placeholder.png";
    retryAttempts.delete(src);
  }
};