import { Property } from "@/types";

interface ApiPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface RawProperty extends Omit<Property, "images" | "features"> {
  images: string;
  features: string;
}

interface ApiResponse {
  properties: RawProperty[];
  pagination: ApiPagination;
  stats: Record<string, number>;
}

interface ProcessedResponse {
  properties: Property[];
  pagination: ApiPagination;
  stats: Record<string, number>;
  error: boolean;
  errorMessage: string | null;
}

function isApiResponse(data: unknown): data is ApiResponse {
  const response = data as ApiResponse;
  return (
    response &&
    Array.isArray(response.properties) &&
    typeof response.pagination === "object" &&
    typeof response.stats === "object"
  );
}

function processImages(rawImages: string): string[] {
  try {
    const parsedImages =
      typeof rawImages === "string" ? JSON.parse(rawImages) : rawImages;

    if (!Array.isArray(parsedImages)) {
      return ["/images/placeholder.png"];
    }

    const processedImages = parsedImages
      .map((img: string): string | null => {
        if (!img || typeof img !== "string") return null;

        if (img.startsWith("/properties/")) {
          const pathSegments = img.slice(1).split("/");
          const encodedSegments = pathSegments.map((segment) =>
            encodeURIComponent(segment)
          );
          return `/api/images/${encodedSegments.join("/")}`;
        }
        return null;
      })
      .filter((img): img is string => img !== null);

    return processedImages.length > 0
      ? processedImages
      : ["/images/placeholder.png"];
  } catch (error) {
    console.error("Error processing images:", error);
    return ["/images/placeholder.png"];
  }
}

function processFeatures(rawFeatures: string): string[] {
  try {
    const parsed =
      typeof rawFeatures === "string" ? JSON.parse(rawFeatures) : rawFeatures;

    // If the parsed value is an object, extract its values
    if (typeof parsed === "object" && parsed !== null) {
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === "string"
        );
      }
      // If it's a features object, convert to array of strings
      return Object.entries(parsed)
        .map(([key, value]) => {
          if (typeof value === "boolean" && value) {
            return key;
          }
          if (typeof value === "string") {
            return `${key}: ${value}`;
          }
          return null;
        })
        .filter((item): item is string => typeof item === "string");
    }
    return [];
  } catch (error) {
    console.error("Error processing features:", error);
    return [];
  }
}

export function processPropertyData(data: unknown): ProcessedResponse {
  try {
    if (!isApiResponse(data)) {
      throw new Error("Invalid API response format");
    }

    const processedProperties = data.properties.map((property) => {
      try {
        return {
          ...property,
          images: property.images
            ? processImages(property.images)
            : ["/images/placeholder.png"],
          features: property.features ? processFeatures(property.features) : [],
        };
      } catch (error) {
        console.error("Error processing property:", error);
        return {
          ...property,
          images: ["/images/placeholder.png"],
          features: [],
        };
      }
    });

    return {
      properties: processedProperties,
      pagination: data.pagination,
      stats: data.stats,
      error: false,
      errorMessage: null,
    };
  } catch (error) {
    console.error("Error processing property data:", error);
    return {
      properties: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 6,
      },
      stats: {},
      error: true,
      errorMessage:
        error instanceof Error
          ? error.message
          : "Failed to process property data",
    };
  }
}
