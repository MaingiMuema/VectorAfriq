"use client";

import {
  LISTING_PROPERTY_CATEGORIES,
  propertyCategoryDisplayNames,
  PropertyCategory,
} from "@/lib/propertyCategories";
import ClientEditor from "@/components/editor/ClientEditor";

export { PropertyCategory } from "@/lib/propertyCategories";

interface BasicInfoStepProps {
  data: {
    title: string;
    description: string;
    propertyCategory: PropertyCategory | "";
    listingType: "sale" | "rent" | "airbnb";
  };
  onChange: (data: Partial<BasicInfoStepProps["data"]>) => void;
}

export default function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const categoryOptions =
    data.propertyCategory &&
    !LISTING_PROPERTY_CATEGORIES.includes(data.propertyCategory)
      ? [data.propertyCategory, ...LISTING_PROPERTY_CATEGORIES]
      : LISTING_PROPERTY_CATEGORIES;

  return (
    <div className="space-y-6">
      {/* Listing Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Listing Type <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 space-y-2">
          <div className="flex items-center">
            <input
              type="radio"
              id="sale"
              name="listingType"
              value="sale"
              checked={data.listingType === "sale"}
              onChange={(e) =>
                onChange({
                  listingType: e.target.value as "sale" | "rent" | "airbnb",
                })
              }
              className="h-4 w-4 border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
              required
            />
            <label htmlFor="sale" className="ml-3 block text-sm text-gray-700">
              For Sale
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="rent"
              name="listingType"
              value="rent"
              checked={data.listingType === "rent"}
              onChange={(e) =>
                onChange({
                  listingType: e.target.value as "sale" | "rent" | "airbnb",
                })
              }
              className="h-4 w-4 border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
            />
            <label htmlFor="rent" className="ml-3 block text-sm text-gray-700">
              For Rent
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="airbnb"
              name="listingType"
              value="airbnb"
              checked={data.listingType === "airbnb"}
              onChange={(e) =>
                onChange({
                  listingType: e.target.value as "sale" | "rent" | "airbnb",
                })
              }
              className="h-4 w-4 border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
            />
            <label
              htmlFor="airbnb"
              className="ml-3 block text-sm text-gray-700"
            >
              Airbnb/Short Stay
            </label>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Property Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
          placeholder="e.g., Modern 3 Bedroom Apartment in Kilimani"
          required
        />
      </div>

      {/* Property Category */}
      <div>
        <label
          htmlFor="propertyCategory"
          className="block text-sm font-medium text-gray-700"
        >
          Property Category <span className="text-red-500">*</span>
        </label>
        <select
          id="propertyCategory"
          value={data.propertyCategory}
          onChange={(e) =>
            onChange({ propertyCategory: e.target.value as PropertyCategory })
          }
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
          required
        >
          <option value="">Select category</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {propertyCategoryDisplayNames[category]}
            </option>
          ))}
        </select>
      </div>

      {/* Description — WYSIWYG Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Property Description <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden">
          <ClientEditor
            value={data.description}
            onChange={(content: string) => onChange({ description: content })}
            className="h-[400px]"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Use the editor to format your description with headings, bold, italic, lists, and more.
          Include key features, recent renovations, and unique selling points.
        </p>
      </div>
    </div>
  );
}
