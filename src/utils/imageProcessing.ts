import { Property } from "@/types";

interface RawProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  type: "SALE" | "RENT" | "AIRBNB";
  location: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  images: string;
  features: string;
  status: string;
  featured: boolean;
  userId: string;
  agent?: {
    name: string;
    image: string | null;
    company?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function processPropertyImages(properties: RawProperty[]): Property[] {
  return properties.map((property) => {
    try {
      // Parse images using the robust method
      const parsedImages = (() => {
        if (!property.images) return [];

        try {
          const images =
            typeof property.images === "string"
              ? JSON.parse(property.images)
              : property.images;

          if (!Array.isArray(images)) {
            console.error(
              `Invalid images format for property ${property.id}:`,
              images
            );
            return [];
          }

          return images
            .map((img) => {
              if (typeof img !== "string") return null;

              try {
                if (img.startsWith("/properties/")) {
                  const pathSegments = img.slice(1).split("/");
                  const encodedSegments = pathSegments.map((segment) =>
                    encodeURIComponent(segment)
                  );
                  const finalPath = `/api/images/${encodedSegments.join("/")}`;
                  return finalPath;
                } else if (img.startsWith("http")) {
                  try {
                    const url = new URL(img);

                    if (url.pathname.startsWith("/properties/")) {
                      const pathSegments = url.pathname.slice(1).split("/");
                      const encodedSegments = pathSegments.map((segment) =>
                        encodeURIComponent(segment)
                      );
                      const finalPath = `/api/images/${encodedSegments.join(
                        "/"
                      )}`;
                      return finalPath;
                    }
                    return "/images/placeholder.png";
                  } catch (e) {
                    console.error("Error processing HTTP URL:", e);
                    return "/images/placeholder.png";
                  }
                }
                return null;
              } catch (e) {
                console.error("Invalid image URL:", e);
                return null;
              }
            })
            .filter((img): img is string => img !== null);
        } catch (error) {
          console.error(`Failed to parse images for property ${property.id}:`, {
            error,
            rawData: property.images,
          });
          return [];
        }
      })();

      // Parse features
      const parsedFeatures = (() => {
        if (!property.features) return [];

        try {
          const features =
            typeof property.features === "string"
              ? JSON.parse(property.features)
              : property.features;

          if (Array.isArray(features)) {
            return features.filter(
              (item): item is string => typeof item === "string"
            );
          }

          if (typeof features === "object" && features !== null) {
            return Object.entries(features)
              .map(([key, value]) => {
                if (typeof value === "boolean" && value) return key;
                if (typeof value === "string") return `${key}: ${value}`;
                return null;
              })
              .filter((item): item is string => typeof item === "string");
          }

          return [];
        } catch (e) {
          console.error(
            `Error parsing features for property ${property.id}:`,
            e
          );
          return [];
        }
      })();

      // Return processed property
      return {
        ...property,
        images:
          parsedImages.length > 0 ? parsedImages : ["/images/placeholder.png"],
        features: parsedFeatures,
        createdAt: new Date(property.createdAt),
        updatedAt: new Date(property.updatedAt),
      } as Property; // Type assertion since we know the structure matches
    } catch (error) {
      console.error("Error processing property:", error);
      return {
        ...property,
        images: ["/images/placeholder.png"],
        features: [],
        createdAt: new Date(property.createdAt),
        updatedAt: new Date(property.updatedAt),
      } as Property; // Type assertion since we know the structure matches
    }
  });
}
