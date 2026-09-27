"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import BasicInfoStep, {
  PropertyCategory,
} from "@/components/listings/steps/BasicInfoStep";
import DetailsStep from "@/components/listings/steps/DetailsStep";
import LocationStep from "@/components/listings/steps/LocationStep";
import MediaStep from "@/components/listings/steps/MediaStep";
import PricingStep from "@/components/listings/steps/PricingStep";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { ImageService } from "@/lib/imageService";

interface FileWithPreview extends File {
  preview?: string;
}

interface ApiProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  type: string;
  location: {
    county: string;
    city: string;
    neighborhood: string;
    address: string;
    ids: {
      county: string;
      city: string;
      neighborhood: string;
    };
  };
  bedrooms: number;
  bathrooms: number;
  floorSize: number;
  plotSize: number;
  paymentTerms: string;
  features: string;
  status: string;
  images: string;
  featured: boolean;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface Property {
  id: string;
  title: string;
  description: string;
  propertyCategory: PropertyCategory;
  listingType: "sale" | "rent" | "airbnb";
  bedrooms: number;
  bathrooms: number;
  area: number;
  plotSize: number;
  features: string[];
  county: string;
  city: string;
  neighborhood: string | ""; // Allow empty string
  address: string;
  price: number;
  priceUnit: "total" | "sqft";
  negotiable: boolean;
  paymentTerms?: string;
  images: FileWithPreview[];
  videos: File[];
  virtualTour?: string;
}

interface PropertyFormData extends Omit<Property, "propertyCategory"> {
  propertyCategory: PropertyCategory | "";
}

// Get property ID from URL
function getPropertyId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
}

// Parse images with proper error handling - matches CRM pattern
function parseImages(imagesData: string | null, propertyId: string): string[] {
  if (!imagesData) return [];

  try {
    const images = typeof imagesData === "string" ? JSON.parse(imagesData) : imagesData;

    if (!Array.isArray(images)) {
      console.error("Invalid images format:", images);
      return [];
    }

    return images
      .map((img) => {
        if (typeof img !== "string") return null;

        // Handle existing service URLs
        if (img.startsWith("/api/images/")) {
          return img;
        }

        // Extract filename from any path format
        let filename = img;
        if (img.includes('/')) {
          const pathParts = img.split('/');
          filename = pathParts[pathParts.length - 1];
        }

        // Route through image service
        return `/api/images/serve/${propertyId}/${filename}`;
      })
      .filter(Boolean) as string[];
  } catch (error) {
    console.error("Failed to parse images:", error);
    return [];
  }
}

// Parse features safely
function parseFeatures(features: string | null): string[] {
  if (!features) return [];
  try {
    const parsed = JSON.parse(features);
    if (parsed && typeof parsed === "object" && parsed.metadata) {
      // Handle the case where features contains metadata
      return [];
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse features:", error);
    return [];
  }
}

export default function EditPropertyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const propertyId = getPropertyId(pathname);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [property, setProperty] = useState<PropertyFormData | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        console.log("Fetching property data for ID:", propertyId);
        const response = await fetch(`/api/admin/properties/${propertyId}`);
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to fetch property: ${error}`);
        }
        const data: ApiProperty = await response.json();

        // Log complete API response
        console.log("Complete API response:", data);

        // Parse and validate all images
        const parsedUrls = parseImages(data.images, propertyId);

        // Create File objects with previews for existing images
        const parsedImages = parsedUrls.map((url) => {
          const blob = new Blob([""], { type: "image/jpeg" });
          const newFile = new File([blob], `existing-${Date.now()}.jpg`, {
            type: "image/jpeg",
          }) as FileWithPreview;
          Object.defineProperty(newFile, "preview", {
            value: url,
            writable: true,
            enumerable: true,
          });
          Object.defineProperty(newFile, "id", {
            value: url,
            writable: true,
            enumerable: true,
          });
          return newFile;
        });

        // Extract and validate location data from the API response
        // The API returns location data in a nested structure with ids and names
        const locationData = {
          county: data.location?.ids?.county ?? "",
          city: data.location?.ids?.city ?? "",
          neighborhood: data.location?.ids?.neighborhood ?? "",
          address: data.location?.address ?? "",
        };

        // Log raw API response for debugging
        console.log("Raw API response data:", {
          locationStructure: data.location,
          locationIds: data.location?.ids,
          locationNames: {
            county: data.location?.county,
            city: data.location?.city,
            neighborhood: data.location?.neighborhood,
          },
        });

        // Add validation check for location data
        if (!data.location?.ids?.county || !data.location?.ids?.city) {
          console.warn("Location data missing in API response:", {
            county: data.location?.ids?.county,
            city: data.location?.ids?.city,
            fullLocationData: data.location,
          });
        }

        // Log complete location information for debugging
        console.log("Received location data:", {
          county: {
            id: data.location?.ids?.county,
            name: data.location?.county,
          },
          city: {
            id: data.location?.ids?.city,
            name: data.location?.city,
          },
          neighborhood: {
            id: data.location?.ids?.neighborhood,
            name: data.location?.neighborhood,
          },
          address: data.location?.address,
        });

        console.log("Extracted location data:", {
          rawData: data.location,
          extractedIds: locationData,
        });

        // Validate location IDs
        if (!locationData.county || !locationData.city) {
          console.warn("Missing required location IDs:", locationData);
        }

        console.log("Processing location data:", {
          raw: data.location,
          transformed: locationData,
        });

        // Transform the data to match the form structure
        // Ensure location data is valid before transforming
        if (!locationData.county || !locationData.city) {
          console.warn("Missing required location data:", locationData);
          toast.error(
            "Some location data is missing. Please check and update."
          );
        }

        const transformedData: PropertyFormData = {
          id: data.id,
          title: data.title,
          description: data.description,
          propertyCategory: data.category as PropertyCategory,
          listingType: data.type.toLowerCase() as "sale" | "rent" | "airbnb",
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          area: data.floorSize,
          plotSize: data.plotSize,
          features: parseFeatures(data.features),
          // Explicitly assign location fields
          county: locationData.county,
          city: locationData.city,
          neighborhood: locationData.neighborhood || "", // Allow empty string for optional neighborhood
          address: locationData.address,
          // Rest of the fields
          price: data.price,
          priceUnit: "total",
          negotiable: false,
          paymentTerms: data.paymentTerms,
          images: parsedImages,
          videos: [],
          virtualTour: undefined,
        };

        console.log("Setting property data:", {
          location: {
            county: transformedData.county,
            city: transformedData.city,
            neighborhood: transformedData.neighborhood,
            address: transformedData.address,
          },
        });

        setProperty(transformedData);

        // Log final transformed data for location fields
        console.log("Final location data set in state:", {
          county: transformedData.county,
          city: transformedData.city,
          neighborhood: transformedData.neighborhood,
          address: transformedData.address,
        });
      } catch (error) {
        console.error("Error fetching property:", error);
        toast.error("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  const handleSubmit = async () => {
    if (!property || property.propertyCategory === "") return;

    // Validate required fields
    if (!property.county) {
      toast.error("Please select a county");
      return;
    }
    if (!property.city) {
      toast.error("Please select a city");
      return;
    }

    setSubmitting(true);
    const submitToast = toast.loading("Updating property...");

    try {
      // Separate existing and new images
      const existingImages: string[] = [];
      const newImages: File[] = [];

      for (const img of property.images) {
        if (img.preview?.startsWith("/api/images/")) {
          // Extract filename from service URL
          const pathParts = img.preview.split('/');
          const filename = pathParts[pathParts.length - 1];
          existingImages.push(`/properties/${propertyId}/${filename}`);
        } else if (img.size > 0) {
          // New image (has actual file content)
          newImages.push(img);
        }
      }

      // Upload new images using ImageService
      let imageUrls: string[] = [...existingImages];

      if (newImages.length > 0) {
        toast.loading("Uploading new images...", { id: submitToast });

        const uploadResult = await ImageService.uploadImages(propertyId, newImages);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Image upload failed');
        }

        if (!uploadResult.urls || uploadResult.urls.length === 0) {
          throw new Error('No image URLs returned from upload service');
        }

        // Convert service URLs to database path format
        const newImagePaths = uploadResult.urls.map(url => {
          if (url.startsWith('/api/images/')) {
            return url.replace('/api/images/', '/properties/');
          }
          try {
            const urlObj = new URL(url);
            if (urlObj.pathname.startsWith('/api/images/')) {
              return urlObj.pathname.replace('/api/images/', '/properties/');
            }
            return urlObj.pathname;
          } catch {
            return url.startsWith('/') ? url : `/${url}`;
          }
        });

        imageUrls = [...existingImages, ...newImagePaths];
      }

      // Transform the data for API
      const transformedData = {
        title: property.title,
        description: property.description,
        category: property.propertyCategory,
        type: property.listingType.toUpperCase(),
        price: property.price,
        paymentTerms: property.paymentTerms,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        floorSize: property.area,
        plotSize: property.plotSize,
        features: JSON.stringify(property.features),
        neighborhood: property.neighborhood || "",
        city: property.city,
        county: property.county,
        images: JSON.stringify(imageUrls),
      };

      toast.loading("Saving changes...", { id: submitToast });

      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update property");
      }

      toast.success("Property updated successfully", { id: submitToast });
      router.push("/admin/properties");
      router.refresh();
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update property",
        { id: submitToast }
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#468AD1]"></div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">
            Property not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The property you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to view it.
          </p>
          <Link
            href="/admin/properties"
            className="mt-4 inline-flex items-center text-sm text-[#468AD1]"
          >
            <FiArrowLeft className="mr-2" /> Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link
          href="/admin/properties"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <FiArrowLeft className="mr-2" /> Back to Properties
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Edit Property</h1>
      </div>

      <div className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Basic Information
          </h2>
          <BasicInfoStep
            data={{
              title: property.title,
              description: property.description,
              propertyCategory: property.propertyCategory,
              listingType: property.listingType,
            }}
            onChange={(data) =>
              setProperty((prev) => (prev ? { ...prev, ...data } : null))
            }
          />
        </div>

        {/* Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Property Details
          </h2>
          <DetailsStep
            data={{
              propertyCategory: property.propertyCategory,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              area: property.area,
              plotSize: property.plotSize,
              features: property.features,
            }}
            onChange={(data) =>
              setProperty((prev) => (prev ? { ...prev, ...data } : null))
            }
          />
        </div>

        {/* Location */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
          <LocationStep
            data={{
              county: property.county,
              city: property.city,
              neighborhood: property.neighborhood,
              address: property.address,
            }}
            onChange={(data) =>
              setProperty((prev) => (prev ? { ...prev, ...data } : null))
            }
          />
        </div>

        {/* Media */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Media</h2>
          <MediaStep
            data={{
              images: property.images,
              videos: property.videos,
              virtualTour: property.virtualTour,
            }}
            onChange={(data) => {
              setProperty((prev) => {
                if (!prev) return null;

                // Preserve existing FileWithPreview objects and their preview URLs
                const updatedImages = (data.images || []).map((file) => {
                  // If it's already a FileWithPreview with preview URL, keep it as is
                  if (
                    file instanceof File &&
                    "preview" in file &&
                    typeof file.preview === "string"
                  ) {
                    return file as FileWithPreview;
                  }

                  // For new files, create new FileWithPreview
                  if (file instanceof File) {
                    const newFile = new File([file], file.name, {
                      type: file.type,
                    }) as FileWithPreview;
                    Object.defineProperty(newFile, "preview", {
                      value: URL.createObjectURL(file),
                      writable: true,
                      enumerable: true,
                    });
                    return newFile;
                  }

                  return file as FileWithPreview;
                });

                return {
                  ...prev,
                  images: updatedImages,
                  videos: data.videos || [],
                  virtualTour: data.virtualTour,
                };
              });
            }}
          />
        </div>

        {/* Pricing */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing</h2>
          <PricingStep
            data={{
              price: property.price,
              priceUnit: property.priceUnit,
              negotiable: property.negotiable,
              paymentTerms: property.paymentTerms,
            }}
            onChange={(data) =>
              setProperty((prev) => (prev ? { ...prev, ...data } : null))
            }
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/admin/properties"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting || property.propertyCategory === ""}
            className="px-4 py-2 text-sm font-medium text-white bg-[#468AD1] rounded-lg shadow-sm hover:bg-[#2F6FAE] disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
