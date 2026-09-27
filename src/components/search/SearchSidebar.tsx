"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaChevronDown } from "react-icons/fa";
import { FiMapPin, FiLoader } from "react-icons/fi";
import { BiSliderAlt } from "react-icons/bi";
import { createPortal } from "react-dom";
import { useDebounce } from "@/hooks/useDebounce";
import {
  propertyCategoryDisplayNames,
  SEARCH_PROPERTY_CATEGORIES,
  AIRBNB_PROPERTY_CATEGORIES,
} from "@/lib/propertyCategories";
import Filters from "./Filters";
import { resolveLocationPath } from "@/lib/search/locationResolverClient";
import { buildInventorySlug } from "@/lib/search/searchUrl";

interface LocationSuggestion {
  type: "county" | "city" | "neighborhood";
  id: string;
  name: string;
  slug: string;
  display: string;
  pathSegments: string[];
}
interface SearchSidebarProps {
  currentFilters?: {
    category?: string;
    location?: string;
    locationPath?: string[];
    minPrice?: string;
    maxPrice?: string;
    type?: "sale" | "rent" | "airbnb";
  };
}

const SearchSidebar = ({ currentFilters = {} }: SearchSidebarProps) => {
  const router = useRouter();
  const [category, setCategory] = useState(currentFilters.category || "");
  const [location, setLocation] = useState(currentFilters.location || "");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);
  const [locationPath, setLocationPath] = useState<string[]>(
    currentFilters.locationPath || []
  );
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || "");
  const [type, setType] = useState<"sale" | "rent" | "airbnb">(
    currentFilters.type || "sale"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [isLocationAutocompleteActive, setIsLocationAutocompleteActive] =
    useState(false);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const debouncedLocation = useDebounce(location, 300);

  useEffect(() => {
    const updateDropdownPosition = () => {
      if (showSuggestions && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownStyle({
          width: rect.width + "px",
          left: rect.left + "px",
          top: rect.bottom + "px",
        });
      }
    };

    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () =>
      window.removeEventListener("scroll", updateDropdownPosition, true);
  }, [showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideInput = inputRef.current?.contains(target);
      const clickedInsideSuggestions = suggestionsRef.current?.contains(target);

      if (!clickedInsideInput && !clickedInsideSuggestions) {
        setShowSuggestions(false);
        setIsLocationAutocompleteActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchSuggestions = async () => {
      if (!isLocationAutocompleteActive) {
        setShowSuggestions(false);
        setIsLoading(false);
        return;
      }

      const query = debouncedLocation.trim();

      if (!query) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
        return;
      }

      if (
        selectedLocation &&
        query.toLowerCase() === selectedLocation.display.trim().toLowerCase()
      ) {
        setSuggestions([selectedLocation]);
        setShowSuggestions(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/locations/search?q=${encodeURIComponent(query)}`
        );
        if (!response.ok) throw new Error("Failed to fetch suggestions");
        const data = await response.json();
        if (!isActive) {
          return;
        }
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        if (!isActive) {
          return;
        }
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchSuggestions();
    return () => {
      isActive = false;
    };
  }, [debouncedLocation, isLocationAutocompleteActive, selectedLocation]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
    setSelectedLocation(null);
    setLocationPath([]);
    setIsLocationAutocompleteActive(true);
  };

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.display);
    setSelectedLocation(suggestion);
    setLocationPath(suggestion.pathSegments || []);
    setShowSuggestions(false);
    setIsLocationAutocompleteActive(false);
  };

  const handleSearch = async () => {
    const inventorySlug = buildInventorySlug({
      listingType: type,
      category: category || undefined,
    });

    const resolvedLocation =
      !selectedLocation && location.trim()
        ? await resolveLocationPath(location)
        : null;
    const pathSegments = selectedLocation?.pathSegments?.length
      ? selectedLocation.pathSegments
      : locationPath.length > 0
        ? locationPath
        : resolvedLocation?.pathSegments || [];
    let path = `/${inventorySlug}`;
    if (pathSegments.length > 0) {
      path = `${path}/${pathSegments.join("/")}`;
    }

    // Add query parameters for additional filters
    const params = new URLSearchParams();

    if (minPrice) {
      params.set("minPrice", minPrice);
    }

    if (maxPrice) {
      params.set("maxPrice", maxPrice);
    }

    if (pathSegments.length === 0 && location.trim()) {
      params.set("location", location.trim());
    }

    // Append search parameters if any exist
    const queryString = params.toString();
    if (queryString) {
      path += `?${queryString}`;
    }

    router.push(path);
  };

  return (
    <div className="w-full max-w-full bg-white rounded-xl shadow-sm border p-6 mt-10">
      {/* Property Type Tabs */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        <button
          onClick={() => setType("sale")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            type === "sale"
              ? "bg-[#468AD1] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          For Sale
        </button>
        <button
          onClick={() => setType("rent")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            type === "rent"
              ? "bg-[#468AD1] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          For Rent
        </button>
        <button
          onClick={() => setType("airbnb")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            type === "airbnb"
              ? "bg-[#468AD1] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Airbnb
        </button>
      </div>

      {/* Location Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <div ref={inputRef} className="relative z-[9999]">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <FiMapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={location}
            onChange={handleLocationChange}
            onFocus={() => setIsLocationAutocompleteActive(true)}
            placeholder="Enter an address, city, area or neighborhood"
            className="w-full max-w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#468AD1]/20 focus:border-[#468AD1] text-gray-600 placeholder-gray-400 text-sm"
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              <FiLoader className="h-5 w-5 text-gray-400 animate-spin" />
            </div>
          )}
          <div className="relative">
            {showSuggestions &&
              typeof window !== "undefined" &&
              createPortal(
                <div
                  ref={suggestionsRef}
                  style={dropdownStyle}
                  className="fixed z-[9999] bg-white shadow-xl rounded-lg border border-gray-200 max-h-[300px] overflow-auto"
                >
                  {suggestions.length > 0 ? (
                    suggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.type}-${suggestion.id}`}
                        onClick={() => handleLocationSelect(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        <div className="flex items-start">
                          <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {suggestion.display}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {suggestion.type}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No locations found
                    </div>
                  )}
                </div>,
                document.body
              )}
          </div>
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10 text-gray-600"
          >
            <option value="">Select Category</option>
            {(type === "airbnb" ? AIRBNB_PROPERTY_CATEGORIES : SEARCH_PROPERTY_CATEGORIES).map((categoryOption) => (
              <option key={categoryOption} value={categoryOption}>
                {propertyCategoryDisplayNames[categoryOption]}
              </option>
            ))}
          </select>
          <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min Price"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-600 placeholder-gray-400"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max Price"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-600 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium bg-[#468AD1] hover:bg-[#c9273ae9] transition-colors flex items-center justify-center gap-2"
      >
        <FaSearch className="w-4 h-4" />
        Search
      </button>

      {/* More Filters Button */}
      <button
        onClick={() => setShowFilters(true)}
        className="w-full mt-3 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        <BiSliderAlt className="w-5 h-5" />
        More Filters
      </button>

      {/* Filters Modal */}
      <Filters isOpen={showFilters} onClose={() => setShowFilters(false)} />
    </div>
  );
};

export default SearchSidebar;
