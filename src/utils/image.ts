import { imageCache } from "./imageCache";

// Utility functions for handling image URLs and paths

/**
 * Encodes a file path for use in URLs, handling spaces and special characters properly
 */
export const encodeImagePath = (path: string): string => {
  if (!path) return "";

  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Split path into segments and encode each segment separately
  const segments = cleanPath.split("/");
  const encodedSegments = segments.map((segment) =>
    // Double encode to handle special characters consistently
    encodeURIComponent(decodeURIComponent(segment))
  );

  return encodedSegments.join("/");
};

/**
 * Converts various image path formats to a consistent API URL
 */
export const getImageUrl = async (imagePath: string): Promise<string> => {
  if (!imagePath) return "/images/placeholder.png";

  try {
    let urlToCache: string;

    // Handle full URLs
    if (imagePath.startsWith("http")) {
      const url = new URL(imagePath);
      if (
        url.pathname.startsWith("/properties/") ||
        url.pathname.startsWith("/blogs/") ||
        url.pathname.startsWith("/partners/") ||
        url.pathname.startsWith("/companies/") ||
        url.pathname.startsWith("/profiles/")
      ) {
        urlToCache = `/api/images/${encodeImagePath(url.pathname)}`;
      } else {
        urlToCache = imagePath;
      }
    } else if (
      imagePath.startsWith("/properties/") ||
      imagePath.startsWith("/blogs/") ||
      imagePath.startsWith("/partners/") ||
      imagePath.startsWith("/companies/") ||
      imagePath.startsWith("/profiles/")
    ) {
      // Handle relative paths
      urlToCache = `/api/images/${encodeImagePath(imagePath)}`;
    } else {
      return "/images/placeholder.png";
    }

    // Try to get from cache first
    const cachedUrl = await imageCache.getUrl(urlToCache);
    if (cachedUrl) {
      return cachedUrl;
    }

    // If not in cache, fetch and cache it
    try {
      const response = await fetch(urlToCache);
      const blob = await response.blob();
      await imageCache.set(urlToCache, blob, urlToCache);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error loading image:", error);
      return "/images/placeholder.png";
    }
  } catch (error) {
    console.error("Error processing image URL:", error);
    return "/images/placeholder.png";
  }
};

/**
 * Parse image paths from JSON string or array
 */
export const parseImagePaths = async (
  images: string | string[]
): Promise<string[]> => {
  try {
    // Handle already parsed arrays
    if (Array.isArray(images)) {
      return Promise.all(images.map(getImageUrl));
    }

    // Parse JSON string
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed)) {
      return Promise.all(parsed.map(getImageUrl));
    }

    // Handle single string
    if (typeof parsed === "string") {
      return Promise.all([getImageUrl(parsed)]);
    }

    throw new Error("Invalid image format");
  } catch (error) {
    console.error("Error parsing image paths:", error);
    return ["/images/placeholder.png"];
  }
};
