"use client";

import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import {
  getBedroomOptions,
  propertyCategoryDisplayNames,
  SEARCH_PROPERTY_CATEGORIES,
} from "@/lib/propertyCategories";

interface FiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

const propertyFeatures = [
  "Swimming Pool",
  "Gym",
  "Security",
  "Parking",
  "Furnished",
  "Balcony",
  "Garden",
  "Pets Allowed",
  "CCTV",
  "Elevator",
];

const propertyTypes = SEARCH_PROPERTY_CATEGORIES.map(
  (category) => propertyCategoryDisplayNames[category]
);

const Filters = ({ isOpen, onClose }: FiltersProps) => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [bedrooms, setBedrooms] = useState<string>("");
  const [bathrooms, setBathrooms] = useState<string>("");
  const [furnished, setFurnished] = useState<string>("");

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleApplyFilters = () => {
    // Implement filter application logic
    console.log({
      features: selectedFeatures,
      types: selectedTypes,
      bedrooms,
      bathrooms,
      furnished,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedFeatures([]);
    setSelectedTypes([]);
    setBedrooms("");
    setBathrooms("");
    setFurnished("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Property Type */}
          <div>
            <h3 className="text-lg font-medium mb-3">Property Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {propertyTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedTypes.includes(type)
                      ? "bg-[#468AD1] text-white border-[#468AD1]"
                      : "border-gray-200 text-gray-700 hover:border-[#468AD1]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg"
              >
                {getBedroomOptions().map((option) => (
                  <option key={option.value || "any"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg"
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, "4+"].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Furnished Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Furnished Status
            </label>
            <select
              value={furnished}
              onChange={(e) => setFurnished(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg"
            >
              <option value="">Any</option>
              <option value="furnished">Furnished</option>
              <option value="unfurnished">Unfurnished</option>
              <option value="partially">Partially Furnished</option>
            </select>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-medium mb-3">Features</h3>
            <div className="grid grid-cols-2 gap-2">
              {propertyFeatures.map((feature) => (
                <button
                  key={feature}
                  onClick={() => handleFeatureToggle(feature)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedFeatures.includes(feature)
                      ? "bg-[#468AD1] text-white border-[#468AD1]"
                      : "border-gray-200 text-gray-700 hover:border-[#468AD1]"
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-4 py-2 bg-[#468AD1] text-white rounded-lg font-medium hover:bg-[#468AD1]/90"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
