"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { Location } from "@/types/location";

interface LocationSearchProps {
  locations: Location[];
  onSelect: (location: Location) => void;
}

export default function LocationSearch({
  locations,
  onSelect,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchResults = locations.filter((location) => {
      const searchString = `${location.name} ${location.type}`.toLowerCase();
      return searchString.includes(query.toLowerCase());
    });

    setResults(searchResults);
  }, [query, locations]);

  const handleSelect = (location: Location) => {
    onSelect(location);
    setQuery("");
    setIsOpen(false);
  };

  const getLocationTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search locations..."
          className="w-full px-4 py-2 pl-10 pr-10 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
          {results.map((location) => (
            <button
              key={location.id}
              onClick={() => handleSelect(location)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group"
            >
              <div>
                <span className="font-medium group-hover:text-red-600">
                  {location.name}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  {getLocationTypeLabel(location.type)}
                </span>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded group-hover:bg-red-100 group-hover:text-red-600">
                View
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border p-4 text-center text-gray-500">
          No locations found
        </div>
      )}
    </div>
  );
}
