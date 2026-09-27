"use client";

import { useEffect } from "react";
import {
  getPropertyFieldVisibility,
  isApartmentStyleCategory,
  isPlotCategory,
  isStudioCategory,
  normalizeListingDetailsForCategory,
  PropertyCategory,
} from "@/lib/propertyCategories";

interface DetailsStepProps {
  data: {
    propertyCategory: PropertyCategory | "";
    bedrooms: number;
    bathrooms: number;
    area: number;
    plotSize: number;
    features: string[];
  };
  onChange: (data: Partial<DetailsStepProps["data"]>) => void;
}

const availableFeatures = [
  "Swimming Pool",
  "Garden",
  "Gym",
  "Security",
  "Parking",
  "Balcony",
  "Air Conditioning",
  "Furnished",
  "Pet Friendly",
  "Storage",
  "Elevator",
  "CCTV",
  "Backup Generator",
  "Water Storage",
  "High Speed Internet",
];

function parseNumberInput(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export default function DetailsStep({ data, onChange }: DetailsStepProps) {
  const visibility = getPropertyFieldVisibility(data.propertyCategory);

  useEffect(() => {
    const normalizedDetails = normalizeListingDetailsForCategory(
      data.propertyCategory,
      {
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        plotSize: data.plotSize,
      }
    );

    if (
      normalizedDetails.bedrooms !== data.bedrooms ||
      normalizedDetails.bathrooms !== data.bathrooms ||
      normalizedDetails.area !== data.area ||
      normalizedDetails.plotSize !== data.plotSize
    ) {
      onChange(normalizedDetails);
    }
  }, [
    data.area,
    data.bathrooms,
    data.bedrooms,
    data.plotSize,
    data.propertyCategory,
    onChange,
  ]);

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = data.features.includes(feature)
      ? data.features.filter((f) => f !== feature)
      : [...data.features, feature];
    onChange({ features: newFeatures });
  };

  const categoryHint = isPlotCategory(data.propertyCategory)
    ? "Land listings only need land size and any relevant features."
    : isStudioCategory(data.propertyCategory)
      ? "Studios are saved as 0-bedroom listings, so bedroom input is hidden."
      : isApartmentStyleCategory(data.propertyCategory)
        ? "Use 0 bedrooms for studio apartment layouts."
      : null;

  return (
    <div className="space-y-6">
      {categoryHint && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {categoryHint}
        </div>
      )}

      {(visibility.showBedrooms || visibility.showBathrooms) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibility.showBedrooms && (
            <div>
              <label
                htmlFor="bedrooms"
                className="block text-sm font-medium text-gray-700"
              >
                Bedrooms
              </label>
              <input
                type="number"
                id="bedrooms"
                value={data.bedrooms}
                onChange={(e) =>
                  onChange({ bedrooms: parseNumberInput(e.target.value) })
                }
                min="0"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
              />
            </div>
          )}

          {visibility.showBathrooms && (
            <div>
              <label
                htmlFor="bathrooms"
                className="block text-sm font-medium text-gray-700"
              >
                Bathrooms
              </label>
              <input
                type="number"
                id="bathrooms"
                value={data.bathrooms}
                onChange={(e) =>
                  onChange({ bathrooms: parseNumberInput(e.target.value) })
                }
                min="0"
                step="0.5"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
              />
            </div>
          )}
        </div>
      )}

      {(visibility.showArea || visibility.showPlotSize) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibility.showArea && (
            <div>
              <label
                htmlFor="area"
                className="block text-sm font-medium text-gray-700"
              >
                Floor Size (sqm)
              </label>
              <input
                type="number"
                id="area"
                value={data.area}
                onChange={(e) =>
                  onChange({ area: parseNumberInput(e.target.value) })
                }
                min="0"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
              />
            </div>
          )}

          {visibility.showPlotSize && (
            <div>
              <label
                htmlFor="plotSize"
                className="block text-sm font-medium text-gray-700"
              >
                Plot Size (sqm)
              </label>
              <input
                type="number"
                id="plotSize"
                value={data.plotSize}
                onChange={(e) =>
                  onChange({ plotSize: parseNumberInput(e.target.value) })
                }
                min="0"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
              />
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Features & Amenities
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableFeatures.map((feature) => (
            <label key={feature} className="relative flex items-start py-2">
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={data.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="h-4 w-4 text-[#468AD1] focus:ring-[#468AD1] border-gray-300 rounded"
                  />
                  <span className="ml-2">{feature}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
