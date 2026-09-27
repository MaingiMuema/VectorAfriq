"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiLoader,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import BasicInfoStep from "./steps/BasicInfoStep";
import LocationStep from "./steps/LocationStep";
import DetailsStep from "./steps/DetailsStep";
import MediaStep from "./steps/MediaStep";
import PricingStep from "./steps/PricingStep";
import { ImageService } from "@/lib/imageService";
import { VideoService, VIDEO_SERVICE_VERSION } from "@/lib/videoService";
import { hasDescriptionContent } from "@/lib/descriptionUtils";
import {
  getPropertyFieldVisibility,
  normalizeListingDetailsForCategory,
  PropertyCategory,
} from "@/lib/propertyCategories";

interface FormData {
  // Basic Info
  title: string;
  description: string;
  propertyCategory: PropertyCategory | "";
  listingType: "sale" | "rent" | "airbnb";

  // Location
  county: string;
  city: string;
  neighborhood: string;
  address: string;

  // Details
  bedrooms: number;
  bathrooms: number;
  area: number;
  plotSize: number;
  yearBuilt: number;
  features: string[];

  // Media
  images: File[];
  videos: File[];
  virtualTour?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  propertyId?: string;

  // Pricing
  price: number;
  priceUnit: "total" | "sqft";
  negotiable: boolean;
  paymentTerms?: string;
}

const steps = [
  { id: "basic", title: "Basic Info", description: "Property title and type" },
  {
    id: "location",
    title: "Location",
    description: "Property location details",
  },
  { id: "details", title: "Details", description: "Property specifications" },
  { id: "media", title: "Media", description: "Photos and videos" },
  { id: "pricing", title: "Pricing", description: "Price and payment terms" },
];

export default function CreateListingForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    propertyCategory: "",
    listingType: "sale",
    county: "",
    city: "",
    neighborhood: "",
    address: "",
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    plotSize: 0,
    yearBuilt: new Date().getFullYear(),
    features: [],
    images: [],
    videos: [],
    price: 0,
    priceUnit: "total",
    negotiable: false,
    virtualTour: "",
    youtubeUrl: "",
    tiktokUrl: "",
    facebookUrl: "",
    propertyId: Date.now().toString(), // Generate property ID upfront
  });

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    // Validate current step
    if (!validateCurrentStep()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const validateCurrentStep = () => {
    let isValid = true;
    const step = steps[currentStep].id;
    const fieldVisibility = getPropertyFieldVisibility(formData.propertyCategory);
    const normalizedDetails = normalizeListingDetailsForCategory(
      formData.propertyCategory,
      {
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area: formData.area,
        plotSize: formData.plotSize,
      }
    );

    if (step === "basic") {
      if (!formData.title.trim()) {
        toast.error("Please enter a property title");
        isValid = false;
      }
      if (!formData.propertyCategory) {
        toast.error("Please select a property category");
        isValid = false;
      }
      if (!hasDescriptionContent(formData.description)) {
        toast.error("Please enter a property description");
        isValid = false;
      }
    } else if (step === "location") {
      if (!formData.county) {
        toast.error("Please select a county");
        isValid = false;
      }
      if (!formData.city) {
        toast.error("Please select a city");
        isValid = false;
      }
    } else if (step === "details") {
      if (
        fieldVisibility.showArea &&
        (!Number.isFinite(normalizedDetails.area) || normalizedDetails.area <= 0)
      ) {
        toast.error("Please enter a valid property size");
        isValid = false;
      }
      if (
        fieldVisibility.showPlotSize &&
        (!Number.isFinite(normalizedDetails.plotSize) ||
          normalizedDetails.plotSize <= 0)
      ) {
        toast.error("Please enter a valid plot size");
        isValid = false;
      }
      if (
        fieldVisibility.showBedrooms &&
        (!Number.isFinite(normalizedDetails.bedrooms) ||
          normalizedDetails.bedrooms < 0)
      ) {
        toast.error("Please enter a valid number of bedrooms");
        isValid = false;
      }
      if (
        fieldVisibility.showBathrooms &&
        (!Number.isFinite(normalizedDetails.bathrooms) ||
          normalizedDetails.bathrooms < 0)
      ) {
        toast.error("Please enter a valid number of bathrooms");
        isValid = false;
      }
    } else if (step === "media") {
      if (formData.images.length === 0) {
        toast.error("Please upload at least one property image");
        isValid = false;
      }
    } else if (step === "pricing") {
      if (formData.price <= 0) {
        toast.error("Please enter a valid price");
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    const submitToast = toast.loading("Creating property listing...");

    try {
      // Check session first
      if (!session?.user) {
        throw new Error("You must be signed in to create a listing");
      }

      const normalizedFormData: FormData = {
        ...formData,
        ...normalizeListingDetailsForCategory(formData.propertyCategory, {
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          area: formData.area,
          plotSize: formData.plotSize,
        }),
      };

      let imageUrls: string[] = [];

      if (normalizedFormData.images.length > 0) {
        toast.loading("Uploading images...", { id: submitToast });

        try {
          const uploadResult = await ImageService.uploadImages(
            normalizedFormData.propertyId!,
            normalizedFormData.images
          );

          if (!uploadResult.success || !uploadResult.urls?.length) {
            throw new Error(uploadResult.error || 'Image upload failed');
          }

          imageUrls = uploadResult.urls.map(url => {
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

          if (uploadResult.warnings) {
            toast(uploadResult.warnings, {
              duration: 4000,
              icon: '⚠️',
              style: {
                background: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #F59E0B',
              },
            });
          }
        } catch (uploadError) {
          const errorMsg = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          throw new Error(`Failed to upload images: ${errorMsg}`);
        }
      }

      let videoUrls: string[] = [];
      if (normalizedFormData.videos.length > 0) {
        console.log(`[CreateListingForm] Using VideoService version: ${VIDEO_SERVICE_VERSION}`);
        console.log(`[CreateListingForm] Property ID: ${normalizedFormData.propertyId}`);
        toast.loading("Uploading videos...", { id: submitToast });
        try {
          const videoUploadResult = await VideoService.uploadVideos(
            normalizedFormData.propertyId!,
            normalizedFormData.videos
          );
          if (!videoUploadResult.success || !videoUploadResult.urls?.length) {
            // We'll treat video upload failure as non-fatal but warn the user
            toast.error(videoUploadResult.error || 'Video upload failed', { duration: 4000 });
          } else if (videoUploadResult.urls) {
            videoUrls = videoUploadResult.urls.map(url => {
              if (url.startsWith('/api/videos/')) return url;
              try {
                const urlObj = new URL(url);
                return urlObj.pathname;
              } catch {
                // If it's already a relative path or something else, use it as is
                return url.startsWith('/') ? url : `/${url}`;
              }
            });

            if (videoUploadResult.warnings) {
              toast(videoUploadResult.warnings, { icon: '⚠️' });
            }
          }
        } catch (videoError) {
          toast.error("Failed to upload videos. The listing will be created without videos.");
          console.error("Video upload error:", videoError);
        }
      }

      toast.loading("Processing listing...", { id: submitToast });

      const data = new FormData();
      data.append("images", JSON.stringify(imageUrls));
      data.append("videos", JSON.stringify(videoUrls));
      data.append("features", JSON.stringify(normalizedFormData.features));
      data.append("propertyId", normalizedFormData.propertyId!);

      Object.entries(normalizedFormData).forEach(([key, value]) => {
        if (!["images", "videos", "features", "propertyId"].includes(key)) {
          data.append(key, value?.toString() || "");
        }
      });

      const response = await fetch("/api/crm/properties", {
        method: "POST",
        body: data,
        credentials: "include", // Add this to send auth cookies
      });

      interface PropertyResponse {
        id: string;
        title: string;
        description: string;
        price: number;
        category: string;
        type: string;
        location: string;
        bedrooms: number;
        bathrooms: number;
        size: number;
        features: string;
        images: string;
        userId: string;
        status: string;
        user?: {
          id: string;
          name: string | null;
          email: string | null;
        };
      }

      interface ApiResponse {
        success: boolean;
        property?: PropertyResponse;
        error?: string;
      }

      const responseData: ApiResponse = await response.json();

      if (!response.ok) {
        console.log("[Form] Response not OK:", {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        });
        const upgradeHint =
          (responseData as { requiresUpgrade?: boolean; details?: string })
            .requiresUpgrade
            ? ` ${(responseData as { details?: string }).details || ""} Upgrade at /crm/rate-cards.`
            : "";
        throw new Error(
          (responseData.error || "Failed to create property listing") +
            upgradeHint
        );
      }

      if (!responseData.success) {
        throw new Error("Failed to create property listing");
      }

      toast.success("Property listing created successfully", {
        id: submitToast,
      });

      router.push("/crm/listing-management");
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create property listing";

      toast.error(errorMessage, {
        id: submitToast,
        duration: 5000,
      });

      if (errorMessage.includes("upload")) {
        setCurrentStep(3);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepClick = (index: number) => {
    // Only allow clicking on completed steps or the next available step
    if (index <= currentStep + 1 && !isSubmitting) {
      setCurrentStep(index);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep data={formData} onChange={updateFormData} />;
      case 1:
        return <LocationStep data={formData} onChange={updateFormData} />;
      case 2:
        return <DetailsStep data={formData} onChange={updateFormData} />;
      case 3:
        return <MediaStep data={formData} onChange={updateFormData} />;
      case 4:
        return <PricingStep data={formData} onChange={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 relative ${index === steps.length - 1
                ? ""
                : 'after:content-[""] after:h-[2px] after:w-full after:absolute after:top-5 after:left-1/2 after:bg-gray-200'
                }`}
            >
              <button
                onClick={() => handleStepClick(index)}
                disabled={index > currentStep + 1 || isSubmitting}
                className={`w-full group ${index > currentStep + 1 || isSubmitting
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
                  }`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-all duration-200 ${index <= currentStep
                      ? "bg-[#468AD1] text-white group-hover:bg-[#2F6FAE]"
                      : index === currentStep + 1
                        ? "bg-gray-200 text-gray-400 group-hover:bg-gray-300"
                        : "bg-gray-200 text-gray-400"
                      }`}
                  >
                    {index < currentStep ? (
                      <FiCheck className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-sm font-medium transition-colors duration-200 ${index <= currentStep
                        ? "text-gray-900 group-hover:text-[#468AD1]"
                        : index === currentStep + 1
                          ? "text-gray-900 group-hover:text-gray-700"
                          : "text-gray-400"
                        }`}
                    >
                      {step.title}
                    </div>
                    <div
                      className={`text-xs hidden md:block transition-colors duration-200 ${index <= currentStep
                        ? "text-gray-500 group-hover:text-gray-700"
                        : index === currentStep + 1
                          ? "text-gray-500 group-hover:text-gray-600"
                          : "text-gray-400"
                        }`}
                    >
                      {step.description}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Form Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0 || isSubmitting}
          className={`inline-flex items-center px-4 py-2 rounded-lg ${currentStep === 0 || isSubmitting
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          <FiChevronLeft className="w-5 h-5 mr-2" />
          Previous
        </button>
        <button
          type="button"
          onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <FiLoader className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : currentStep === steps.length - 1 ? (
            <>
              Submit Listing
              <FiCheck className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              Next Step
              <FiChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
