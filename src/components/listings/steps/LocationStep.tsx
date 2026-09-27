"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface LocationStepProps {
  data: {
    county: string;
    city: string;
    neighborhood: string;
    address: string;
  };
  onChange: (data: Partial<LocationStepProps["data"]>) => void;
}

export default function LocationStep({ data, onChange }: LocationStepProps) {
  const [touched, setTouched] = useState({
    county: false,
    city: false,
    neighborhood: false,
  });

  const [counties, setCounties] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState({
    counties: false,
    cities: false,
    neighborhoods: false,
  });

  // Handle initial data loading
  useEffect(() => {
    const fetchCounties = async () => {
      setIsLoading((prev) => ({ ...prev, counties: true }));
      try {
        console.log("Fetching counties...");
        const res = await fetch("/api/locations/counties");
        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Failed to fetch counties: ${error}`);
        }
        const countyData: Location[] = await res.json();
        console.log("Successfully fetched counties:", {
          counties: countyData,
          selectedCounty: countyData.find(
            (county: Location) => county.id === data.county
          ),
        });
        setCounties(countyData);
      } catch (error) {
        console.error("Error fetching counties:", error);
        // Reset counties on error to prevent stale data
        setCounties([]);
      } finally {
        setIsLoading((prev) => ({ ...prev, counties: false }));
      }
    };
    fetchCounties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch counties on mount only

  // Fetch cities when county changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!data.county) {
        setCities([]);
        return;
      }

      console.log("Fetching cities for county:", {
        countyId: data.county,
        currentCity: data.city,
      });

      setIsLoading((prev) => ({ ...prev, cities: true }));
      try {
        const res = await fetch(
          `/api/locations/cities?countyId=${data.county}`
        );
        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Failed to fetch cities: ${error}`);
        }
        const citiesData: Location[] = await res.json();
        console.log("Successfully fetched cities:", {
          cities: citiesData,
          selectedCity: citiesData.find(
            (city: Location) => city.id === data.city
          ),
          allCities: citiesData.map(c => ({ id: c.id, name: c.name })),
        });
        setCities(citiesData);
      } catch (error) {
        console.error("Error fetching cities:", error);
        toast.error("Failed to fetch cities due to a server error. Please try again later.");
        setCities([]);
      } finally {
        setIsLoading((prev) => ({ ...prev, cities: false }));
      }
    };

    fetchCities();
  }, [data.county, data.city]);

  // Fetch neighborhoods when city changes
  useEffect(() => {
    if (!data.city) {
      setNeighborhoods([]);
      return;
    }

    console.log("Fetching neighborhoods for city:", data.city);

    const fetchNeighborhoods = async () => {
      setIsLoading((prev) => ({ ...prev, neighborhoods: true }));
      try {
        console.log("Fetching neighborhoods for city:", data.city);
        const res = await fetch(
          `/api/locations/neighborhoods?cityId=${data.city}`
        );
        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Failed to fetch neighborhoods: ${error}`);
        }
        const neighborhoodsData: Location[] = await res.json();
        console.log("Successfully fetched neighborhoods:", {
          neighborhoods: neighborhoodsData,
          selectedNeighborhood: neighborhoodsData.find(
            (n: Location) => n.id === data.neighborhood
          ),
          allNeighborhoods: neighborhoodsData.map(n => ({ id: n.id, name: n.name })),
        });
        setNeighborhoods(neighborhoodsData);
      } catch (error) {
        console.error("Error fetching neighborhoods:", error);
        toast.error("Failed to fetch neighborhoods due to a server error. Please try again later.");
        // Reset neighborhoods on error to prevent stale data
        setNeighborhoods([]);
      } finally {
        setIsLoading((prev) => ({ ...prev, neighborhoods: false }));
      }
    };

    fetchNeighborhoods();
  }, [data.city, data.neighborhood]);

  const handleBlur = (field: "county" | "city" | "neighborhood") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const errors = {
    county: !data.county && touched.county ? "County is required" : "",
    city: !data.city && touched.city ? "City is required" : "",
    neighborhood: "", // Neighborhood is optional
  };

  console.log("Current selections:", {
    county: counties.find((county: Location) => county.id === data.county)
      ?.name,
    city: cities.find((city: Location) => city.id === data.city)?.name,
    neighborhood: neighborhoods.find(
      (n: Location) => n.id === data.neighborhood
    )?.name,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="county"
            className="block text-sm font-medium text-gray-700"
          >
            County <span className="text-red-500">*</span>
          </label>
          <select
            id="county"
            value={data.county}
            onChange={(e) => {
              const newCountyId = e.target.value;
              const newCounty = counties.find((c) => c.id === newCountyId);
              console.log("County selection changing:", {
                oldId: data.county,
                newId: newCountyId,
                newCountyName: newCounty?.name,
                clearingCity: data.city,
                clearingNeighborhood: data.neighborhood,
              });
              onChange({ county: newCountyId, city: "", neighborhood: "" });
            }}
            onBlur={() => handleBlur("county")}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1] ${
              errors.county ? "border-red-500" : "border-gray-300"
            }`}
            required
            disabled={isLoading.counties}
          >
            <option value="">Select county</option>
            {counties.map((county) => (
              <option key={county.id} value={county.id}>
                {county.name}
              </option>
            ))}
          </select>
          {errors.county && (
            <p className="mt-1 text-sm text-red-500">{errors.county}</p>
          )}
          {isLoading.counties ? (
            <p className="mt-1 text-sm text-gray-500">Loading counties...</p>
          ) : (
            counties.length === 0 && (
              <p className="mt-1 text-sm text-red-500">
                Failed to load counties. Please try again later.
              </p>
            )
          )}
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700"
          >
            City/Town <span className="text-red-500">*</span>
          </label>
          <select
            id="city"
            value={data.city}
            onChange={(e) => {
              const newCityId = e.target.value;
              const newCity = cities.find((c) => c.id === newCityId);
              console.log("City selection changing:", {
                oldId: data.city,
                newId: newCityId,
                newCityName: newCity?.name,
                underCounty: counties.find((c) => c.id === data.county)?.name,
                clearingNeighborhood: data.neighborhood,
              });
              onChange({ city: newCityId, neighborhood: "" });
            }}
            onBlur={() => handleBlur("city")}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1] ${
              errors.city ? "border-red-500" : "border-gray-300"
            }`}
            required
            disabled={isLoading.cities || !data.county}
          >
            <option value="">Select city/town</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          {errors.city && (
            <p className="mt-1 text-sm text-red-500">{errors.city}</p>
          )}
          {isLoading.cities ? (
            <p className="mt-1 text-sm text-gray-500">Loading cities...</p>
          ) : (
            data.county &&
            cities.length === 0 && (
              <p className="mt-1 text-sm text-red-500">
                No cities found in this county. Please select a different county.
              </p>
            )
          )}
        </div>

        <div>
          <label
            htmlFor="neighborhood"
            className="block text-sm font-medium text-gray-700"
          >
            Neighborhood
          </label>
          <select
            id="neighborhood"
            value={data.neighborhood}
            onChange={(e) => {
              const newNeighborhoodId = e.target.value;
              const newNeighborhood = neighborhoods.find(
                (n) => n.id === newNeighborhoodId
              );
              console.log("Neighborhood selection changing:", {
                oldId: data.neighborhood,
                newId: newNeighborhoodId,
                newNeighborhoodName: newNeighborhood?.name,
                underCity: cities.find((c) => c.id === data.city)?.name,
                underCounty: counties.find((c) => c.id === data.county)?.name,
              });
              onChange({ neighborhood: newNeighborhoodId });
            }}
            onBlur={() => handleBlur("neighborhood")}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1] ${
              errors.neighborhood ? "border-red-500" : "border-gray-300"
            }`}
            disabled={isLoading.neighborhoods || !data.city}
          >
            <option value="">Select neighborhood</option>
            {neighborhoods.map((neighborhood) => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.name}
              </option>
            ))}
          </select>
          {errors.neighborhood && (
            <p className="mt-1 text-sm text-red-500">{errors.neighborhood}</p>
          )}
          {isLoading.neighborhoods ? (
            <p className="mt-1 text-sm text-gray-500">
              Loading neighborhoods...
            </p>
          ) : (
            data.city &&
            neighborhoods.length === 0 && (
              <p className="mt-1 text-sm text-red-500">
                No neighborhoods found in this city. Please select a different city.
              </p>
            )
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700"
        >
          Detailed Address
        </label>
        <input
          type="text"
          id="address"
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
          placeholder="e.g., 123 Rose Avenue, Off Ngong Road"
        />
      </div>
    </div>
  );
}
