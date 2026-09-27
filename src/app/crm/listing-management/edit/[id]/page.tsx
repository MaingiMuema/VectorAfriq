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
import { VideoService } from "@/lib/videoService";

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
  videos: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  virtualTour?: string;
  featured: boolean;
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
  videos: FileWithPreview[];
  virtualTour?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
}

interface PropertyFormData extends Omit<Property, "propertyCategory"> {
  propertyCategory: PropertyCategory | "";
}

// Get property ID from URL
function getPropertyId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
}

// Parse images with proper error handling - matches listing-management pattern
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

// Parse videos with proper error handling
function parseVideos(videosData: string | null, propertyId: string): string[] {
  if (!videosData) return [];

  try {
    const videos = typeof videosData === "string" ? JSON.parse(videosData) : videosData;

    if (!Array.isArray(videos)) {
      console.error("Invalid videos format:", videos);
      return [];
    }

    return videos
      .map((vid) => {
        if (typeof vid !== "string") return null;

        // Handle existing service URLs
        if (vid.startsWith("/api/videos/")) {
          return vid;
        }

        // Handle full URLs
        if (vid.startsWith("http")) {
          return vid;
        }

        // Handle relative paths that might already include the structure
        if (vid.includes("/videos/") && !vid.startsWith("/api")) {
          return `/api${vid.startsWith("/") ? "" : "/"}${vid}`;
        }

        // Route through video service - assume filename
        return `/api/videos/${propertyId}/${vid}`;
      })
      .filter(Boolean) as string[];
  } catch (error) {
    console.error("Failed to parse videos:", error);
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

const getMimeType = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    webm: "video/webm",
    mkv: "video/x-matroska",
  };
  return (ext && types[ext]) || "video/mp4";
};

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
        const response = await fetch(`/api/crm/properties/${propertyId}`);
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
          const filename = url.split("/").pop() || `image-${Date.now()}.jpg`;
          const blob = new Blob([""], { type: "image/jpeg" });
          const newFile = new File([blob], filename, {
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

        // Parse and validate all videos
        const parsedVideoUrls = parseVideos(data.videos, propertyId);

        // Create File objects with previews for existing videos
        const parsedVideos = parsedVideoUrls.map((url) => {
          const filename = url.split("/").pop() || `video-${Date.now()}.mp4`;
          const mimeType = getMimeType(filename);
          const blob = new Blob([""], { type: mimeType });
          const newFile = new File([blob], filename, {
            type: mimeType,
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
          videos: parsedVideos,
          virtualTour: data.virtualTour,
          youtubeUrl: data.youtubeUrl,
          tiktokUrl: data.tiktokUrl,
          facebookUrl: data.facebookUrl,
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

      // Separate existing and new videos
      const existingVideos: string[] = [];
      const newVideos: File[] = [];

      for (const vid of property.videos) {
        // Check if it's an existing video
        // Existing videos are created with empty blobs (size 0) or have a service URL as preview
        const isExisting = vid.size === 0 || (vid.preview && (vid.preview.includes("/api/videos/") || vid.preview.includes("/videos/")));

        if (isExisting) {
          const preview = vid.preview || "";

          if (preview.startsWith('http')) {
            try {
              const urlObj = new URL(preview);
              let pathname = urlObj.pathname;

              // Normalize /videos/ path to /api/videos/
              if (pathname.startsWith('/videos/')) {
                pathname = `/api${pathname}`;
              }

              existingVideos.push(pathname);
            } catch {
              // Fallback
              existingVideos.push(preview.replace(/^https?:\/\/[^/]+/, ''));
            }
          } else {
            // Already a relative path
            if (preview.startsWith('/videos/')) {
              existingVideos.push(`/api${preview}`);
            } else {
              existingVideos.push(preview);
            }
          }
        } else if (vid.size > 0) {
          // New video (has actual file content)
          newVideos.push(vid);
        }
      }

      let videoUrls: string[] = [...existingVideos];

      if (newVideos.length > 0) {
        toast.loading("Uploading new videos...", { id: submitToast });

        const videoUploadResult = await VideoService.uploadVideos(propertyId, newVideos);

        if (!videoUploadResult.success) {
          // We treat video upload failure as non-fatal but notify
          toast.error(videoUploadResult.error || 'Video upload failed', { duration: 4000 });
        } else if (videoUploadResult.urls) {
          // Convert service URLs to database path format
          const newVideoPaths = videoUploadResult.urls.map(url => {
            // Already in correct format
            if (url.startsWith('/api/videos/')) {
              return url;
            }

            try {
              // Handle absolute URLs from service
              const urlObj = new URL(url);
              if (urlObj.pathname.startsWith('/videos/')) {
                return `/api${urlObj.pathname}`;
              }
              if (urlObj.pathname.startsWith('/api/videos/')) {
                return urlObj.pathname;
              }
              return urlObj.pathname;
            } catch {
              // Handle relative paths
              if (url.startsWith('/videos/')) {
                return `/api${url}`;
              }
              return url;
            }
          });

          videoUrls = [...existingVideos, ...newVideoPaths];
        }
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
        videos: JSON.stringify(videoUrls),
        virtualTour: property.virtualTour,
        youtubeUrl: property.youtubeUrl,
        tiktokUrl: property.tiktokUrl,
        facebookUrl: property.facebookUrl,
      };

      toast.loading("Saving changes...", { id: submitToast });

      const response = await fetch(`/api/crm/properties/${propertyId}`, {
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
      router.push("/crm/listing-management");
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
            href="/crm/listing-management"
            className="mt-4 inline-flex items-center text-sm text-[#468AD1]"
          >
            <FiArrowLeft className="mr-2" /> Back to Listing Management
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link
          href="/crm/listing-management"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <FiArrowLeft className="mr-2" /> Back to Listing Management
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
              youtubeUrl: property.youtubeUrl,
              tiktokUrl: property.tiktokUrl,
              facebookUrl: property.facebookUrl,
            }}
            onChange={(data) => {
              setProperty((prev) => {
                if (!prev) return null;

                // Process images and videos consistently
                const processFiles = (files: any[]) => {
                  return (files || []).map((file) => {
                    // Preserve existing FileWithPreview
                    if (file instanceof File && "preview" in file && typeof file.preview === "string") {
                      return file as FileWithPreview;
                    }

                    // For new files without preview, create one (fallback)
                    if (file instanceof File && !("preview" in file)) {
                      const newFile = new File([file], file.name, { type: file.type }) as FileWithPreview;
                      Object.defineProperty(newFile, "preview", {
                        value: URL.createObjectURL(file),
                        writable: true,
                        enumerable: true,
                      });
                      return newFile;
                    }

                    return file as FileWithPreview;
                  });
                };

                const updatedImages = processFiles(data.images || prev.images);
                const updatedVideos = processFiles(data.videos || prev.videos);

                return {
                  ...prev,
                  images: updatedImages,
                  videos: updatedVideos,
                  virtualTour: data.virtualTour !== undefined ? data.virtualTour : prev.virtualTour,
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
            href="/crm/listing-management"
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
