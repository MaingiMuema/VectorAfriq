"use client";

import { useState, useEffect } from "react";
import { Location, County, City, Neighborhood } from "@/types/location";

interface LocationFormProps {
  type: "county" | "city" | "neighborhood";
  location?: Location;
  onSubmit: (data: Partial<Location>) => void;
  onCancel: () => void;
}

export default function LocationForm({
  type,
  location,
  onSubmit,
  onCancel,
}: LocationFormProps) {

  const [formData, setFormData] = useState<{
    name: string;
    countyId: string;
    cityId: string;
  }>({
    name: location?.name || "",
    countyId: (location as City)?.countyId || "",
    cityId:
      location?.type === "neighborhood"
        ? (location as Neighborhood).cityId
        : "",
  });

  const [counties, setCounties] = useState<County[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      try {
        setIsLoading(true);
        setError(null);

        if (type === "county") {
          setIsLoading(false);
          return;
        }

        const [countiesRes, citiesRes] = await Promise.all([
          fetch("/api/locations/counties"),
          fetch("/api/locations/cities"),
        ]);

        if (!countiesRes.ok || !citiesRes.ok) {
          throw new Error("Failed to fetch location data");
        }

        const [countiesData, citiesData] = await Promise.all([
          countiesRes.json(),
          citiesRes.json(),
        ]);

        setCounties(countiesData);
        setCities(citiesData);
      } catch (error) {
        console.error("Error fetching locations:", error);
        setError("Failed to load locations");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLocations();
  }, [type]);

  const getEndpoint = (locationType: string, isEdit: boolean = false) => {
    const basePath = (() => {
      switch (locationType) {
        case "county":
          return "/api/locations/counties";
        case "city":
          return "/api/locations/cities";
        case "neighborhood":
          return "/api/locations/neighborhoods";
        default:
          throw new Error("Invalid location type");
      }
    })();

    return isEdit && location ? `${basePath}/${location.id}` : basePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Base data with type field
    const data: Partial<Location> = {
      name: formData.name,
      slug,
      type,
    };

    // Add specific fields based on type
    if (type === "city" && formData.countyId) {
      (data as Partial<City>).countyId = formData.countyId;
    } else if (type === "neighborhood") {
      const city = cities.find((c) => c.id === formData.cityId);
      if (city) {
        (data as Partial<Neighborhood>).cityId = formData.cityId;
        (data as Partial<Neighborhood>).countyId = city.countyId;
      } else {
        setError("Selected city not found");
        return;
      }
    }

    try {
      const isEdit = !!location;
      const endpoint = getEndpoint(type, isEdit);
      console.log("Submitting to endpoint:", endpoint);
      console.log("Submit data:", data);

      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add location");
      }

      const responseData = await response.json();
      onSubmit(responseData);
    } catch (error) {
      console.error("Error submitting form:", error);
      setError(
        error instanceof Error ? error.message : "Failed to submit form"
      );
    }
  };

  if (isLoading && type !== "county") {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-red-600">{error}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          required
        />
      </div>

      {type === "city" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            County
          </label>
          <select
            value={formData.countyId}
            onChange={(e) =>
              setFormData({ ...formData, countyId: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            required
          >
            <option value="">Select a county</option>
            {counties.map((county) => (
              <option key={county.id} value={county.id}>
                {county.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {type === "neighborhood" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              County
            </label>
            <select
              value={formData.countyId}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  countyId: e.target.value,
                  cityId: "", // Reset city when county changes
                });
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            >
              <option value="">Select a county</option>
              {counties.map((county) => (
                <option key={county.id} value={county.id}>
                  {county.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <select
              value={formData.cityId}
              onChange={(e) =>
                setFormData({ ...formData, cityId: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
              disabled={!formData.countyId}
            >
              <option value="">Select a city</option>
              {cities
                .filter((city) => city.countyId === formData.countyId)
                .map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
            </select>
          </div>
        </>
      )}

      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          {location ? "Update" : "Add"} {type}
        </button>
      </div>
    </form>
  );
}
