"use client";

import { useState } from "react";
import { FaCalculator, FaInfoCircle, FaChartLine } from "react-icons/fa";

interface ValuationResult {
  estimatedValue: number;
  priceRange: { min: number; max: number };
  pricePerSqFt: number;
  confidence: number;
}

export default function PropertyValuation() {
  const [formData, setFormData] = useState({
    propertyType: "",
    location: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    landSize: "",
    yearBuilt: "",
    condition: "",
    amenities: [] as string[],
  });

  const [result, setResult] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const amenitiesOptions = [
    "Swimming Pool",
    "Garden",
    "Security System",
    "Garage",
    "Solar Panels",
    "Borehole",
    "Servants Quarter",
    "CCTV",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const calculateValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call with dummy calculation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const basePrice = 5000000; // Base price in KES
      const locationMultiplier = 1.2;
      const sizeMultiplier = parseInt(formData.squareFeet) * 1000;
      const amenitiesMultiplier = formData.amenities.length * 100000;

      const estimatedValue =
        (basePrice + sizeMultiplier + amenitiesMultiplier) * locationMultiplier;

      setResult({
        estimatedValue: estimatedValue,
        priceRange: {
          min: estimatedValue * 0.9,
          max: estimatedValue * 1.1,
        },
        pricePerSqFt: estimatedValue / parseInt(formData.squareFeet),
        confidence: 85,
      });
    } catch (error) {
      console.error("Valuation calculation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <FaCalculator className="text-[#468AD1]" />
              Property Valuation Calculator
            </h1>
            <p className="mt-4 text-gray-600">
              Get an estimated value for your property based on location,
              features, and market trends
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={calculateValuation} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type *
                  </label>
                  <select
                    name="propertyType"
                    required
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                  >
                    <option value="">Select property type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="land">Land</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <select
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                  >
                    <option value="">Select location</option>
                    <option value="kitengela">Kitengela</option>
                    <option value="syokimau">Syokimau</option>
                    <option value="athi-river">Athi River</option>
                    <option value="mlolongo">Mlolongo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    min="0"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    min="0"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Square Feet *
                  </label>
                  <input
                    type="number"
                    name="squareFeet"
                    required
                    min="0"
                    value={formData.squareFeet}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Built
                  </label>
                  <input
                    type="number"
                    name="yearBuilt"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.yearBuilt}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-[#468AD1] focus:border-[#468AD1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {amenitiesOptions.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="rounded border-gray-300 text-[#468AD1] focus:ring-[#468AD1]"
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#468AD1] text-white px-6 py-3 rounded-lg hover:bg-[#2F6FAE] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? "Calculating..." : "Calculate Property Value"}
              </button>
            </form>

            {result && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaChartLine className="text-[#468AD1]" />
                  Valuation Results
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      Estimated Value
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      KES{" "}
                      {result.estimatedValue.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Price Range</p>
                    <p className="text-lg font-semibold text-gray-900">
                      KES{" "}
                      {result.priceRange.min.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}{" "}
                      - KES{" "}
                      {result.priceRange.max.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      Price per Sq Ft
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      KES{" "}
                      {result.pricePerSqFt.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      Confidence Score
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.confidence}%
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-2 text-sm text-gray-500">
                  <FaInfoCircle className="mt-1 flex-shrink-0" />
                  <p>
                    This is an estimated value based on available data and
                    market trends. Actual property value may vary. For a more
                    accurate valuation, please consult with our property
                    experts.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
