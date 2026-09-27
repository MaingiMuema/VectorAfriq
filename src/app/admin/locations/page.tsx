"use client";

import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import LocationCard from "./components/LocationCard";
import LocationForm from "./components/LocationForm";
import LocationSearch from "./components/LocationSearch";
import { Location, County, City, Neighborhood } from "@/types/location";
import { toast } from "react-hot-toast";

export default function LocationsPage() {
  const [counties, setCounties] = useState<County[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [addLocationType, setAddLocationType] = useState<
    "county" | "city" | "neighborhood"
  >("county");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const [countiesRes, citiesRes, neighborhoodsRes] = await Promise.all([
        fetch("/api/locations/counties"),
        fetch("/api/locations/cities"),
        fetch("/api/locations/neighborhoods"),
      ]);

      if (!countiesRes.ok || !citiesRes.ok || !neighborhoodsRes.ok) {
        throw new Error("Failed to fetch locations");
      }

      const [countiesData, citiesData, neighborhoodsData] = await Promise.all([
        countiesRes.json(),
        citiesRes.json(),
        neighborhoodsRes.json(),
      ]);

      setCounties(countiesData);
      setCities(citiesData);
      setNeighborhoods(neighborhoodsData);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (location: Location) => {
    if (!window.confirm(`Are you sure you want to delete ${location.name}?`)) {
      return;
    }

    try {
      const typeToPlural = {
        county: 'counties',
        city: 'cities',
        neighborhood: 'neighborhoods'
      };
      const endpoint = `/api/locations/${typeToPlural[location.type as keyof typeof typeToPlural]}/${location.id}`;
      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete location");
      }

      toast.success(`${location.name} deleted successfully`);
      fetchLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete location"
      );
    }
  };

  const handleAdd = (type: "county" | "city" | "neighborhood") => {
    setAddLocationType(type);
    setIsAddModalOpen(true);
  };

  const handleFormSuccess = async () => {
    await fetchLocations();
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedLocation(null);
  };

  const getCitiesForCounty = (countyId: string) => {
    return cities.filter((city) => city.countyId === countyId);
  };

  const getNeighborhoodsForCity = (cityId: string) => {
    return neighborhoods.filter(
      (neighborhood) => neighborhood.cityId === cityId
    );
  };

  const getAllLocations = (): Location[] => {
    return [...counties, ...cities, ...neighborhoods];
  };

  const handleSearchSelect = (location: Location) => {
    const element = document.getElementById(`location-${location.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-red-500");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-red-500");
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Location Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => handleAdd("county")}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Add County
          </button>
          <button
            onClick={() => handleAdd("city")}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Add City
          </button>
          <button
            onClick={() => handleAdd("neighborhood")}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Add Neighborhood
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <LocationSearch
          locations={getAllLocations()}
          onSelect={handleSearchSelect}
        />
      </div>

      <div className="space-y-6">
        {counties.map((county) => (
          <LocationCard
            key={county.id}
            location={county}
            onEdit={handleEdit}
            onDelete={handleDelete}
          >
            <div className="space-y-4">
              {getCitiesForCounty(county.id).map((city) => (
                <LocationCard
                  key={city.id}
                  location={city}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                >
                  <div className="space-y-4">
                    {getNeighborhoodsForCity(city.id).map((neighborhood) => (
                      <LocationCard
                        key={neighborhood.id}
                        location={neighborhood}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </LocationCard>
              ))}
            </div>
          </LocationCard>
        ))}
      </div>

      {/* Add Location Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              Add New {addLocationType}
            </h2>
            <LocationForm
              type={addLocationType}
              onSubmit={handleFormSuccess}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {isEditModalOpen && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              Edit {selectedLocation.type}
            </h2>
            <LocationForm
              type={selectedLocation.type}
              location={selectedLocation}
              onSubmit={handleFormSuccess}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedLocation(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
