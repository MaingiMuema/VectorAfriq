"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Parallax } from "react-parallax";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getBedroomOptions,
  propertyCategoryDisplayNames,
  SEARCH_PROPERTY_CATEGORIES,
} from "@/lib/propertyCategories";
import { FiLoader, FiMapPin, FiSearch, FiSliders, FiCpu, FiZap } from "react-icons/fi";

interface LocationSuggestion {
  type: "county" | "city" | "neighborhood";
  id: string;
  name: string;
  slug: string;
  display: string;
  pathSegments: string[];
}

function getBedroomSummary(value: string): string {
  if (value === "studio") {
    return "Studio";
  }

  if (value === "5") {
    return "5+ Bedrooms";
  }

  return `${value} ${value === "1" ? "Bedroom" : "Bedrooms"}`;
}

const AI_EXAMPLE_PROMPTS = [
  "Quiet 2-bedroom apartment in Westlands under 30M with parking",
  "Family bungalow in Karen with a garden, 4 bedrooms",
  "Studio for rent near Nairobi CBD",
];

export default function Hero() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);
  const [category, setCategory] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [listingType, setListingType] = useState("sale");
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const debouncedLocation = useDebounce(location, 300);

  const bedroomOptions = getBedroomOptions(category || undefined);
  const activeFilterCount =
    Number(Boolean(bedrooms)) + Number(Boolean(minPrice)) + Number(Boolean(maxPrice));

  useEffect(() => {
    const updateDropdownPosition = () => {
      if (showSuggestions && inputWrapperRef.current) {
        const rect = inputWrapperRef.current.getBoundingClientRect();
        setDropdownStyle({
          width: rect.width,
          left: rect.left,
          top: rect.bottom,
        });
      }
    };

    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [showSuggestions]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target) &&
        !inputWrapperRef.current?.contains(target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (aiMode) {
      setShowSuggestions(false);
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
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/locations/search?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

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
  }, [debouncedLocation, selectedLocation, aiMode]);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.display);
    setSelectedLocation(suggestion);
    setShowSuggestions(false);
  };

  const handleResetFilters = () => {
    setBedrooms("");
    setMinPrice("");
    setMaxPrice("");
  };

  const handleAiModeToggle = () => {
    setAiMode((prev) => {
      const next = !prev;
      if (next) {
        setShowFilters(false);
        setShowSuggestions(false);
      }
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!aiMode) {
      return; // classic GET form submit
    }

    event.preventDefault();
    const trimmed = aiPrompt.trim();
    if (!trimmed) {
      return;
    }

    const params = new URLSearchParams();
    params.set("q", trimmed);
    if (listingType) {
      params.set("type", listingType);
    }
    router.push(`/search/ai?${params.toString()}`);
  };

  return (
    <Parallax
      blur={0}
      bgImage="/images/hero-img.jpeg"
      bgImageAlt="Kenya cityscape"
      strength={200}
      className="relative"
    >
      <div
        className={`relative flex items-center justify-center bg-[#514f63]/5 transition-all duration-300 ${
          showFilters && !aiMode ? "min-h-[750px]" : "min-h-[440px]"
        }`}
        style={{
          transform: `translateY(${
            showFilters && !aiMode ? scrollY * 0.15 : scrollY * 0.5
          }px)`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.68)_0%,rgba(17,24,39,0.48)_54%,rgba(17,24,39,0.32)_100%)]" />

        <div className="container mx-auto px-4 py-10 relative z-10">
          <h1
            className="text-3xl md:text-5xl font-bold text-center text-white mb-3 mt-10"
            style={{
              transform: `translateY(${showFilters ? scrollY * 0.05 : scrollY * 0.2}px)`,
              opacity: Math.max(0, 1 - scrollY / 500),
            }}
          >
            Search for property in Kenya
          </h1>
          <p
            className="max-w-2xl mx-auto text-center text-white/80 text-sm md:text-base mb-8"
            style={{
              transform: `translateY(${showFilters ? scrollY * 0.03 : scrollY * 0.14}px)`,
              opacity: Math.max(0, 1 - scrollY / 550),
            }}
          >
            {aiMode
              ? "Describe the home you want in plain language — AI will find matching listings."
              : "Start with location and property type. Open filters when you want bedrooms, price range, and a narrower search."}
          </p>

          <div
            className="max-w-6xl mx-auto"
            style={{
              transform: `translateY(${showFilters ? scrollY * 0.02 : scrollY * 0.1}px)`,
            }}
          >
            <form
              action={aiMode ? undefined : "/search"}
              method={aiMode ? undefined : "get"}
              onSubmit={handleSubmit}
            >
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-center md:justify-start">
                <div className="inline-flex gap-2 bg-white/15 backdrop-blur-md p-1 rounded-full shadow-lg shadow-black/10 self-center sm:self-auto">
                  {[
                    { value: "sale", label: "For Sale" },
                    { value: "rent", label: "For Rent" },
                    { value: "airbnb", label: "Airbnb" },
                  ].map((option) => (
                    <label key={option.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={option.value}
                        checked={listingType === option.value}
                        onChange={() => setListingType(option.value)}
                        className="peer sr-only"
                      />
                      <span className="block px-4 py-1.5 text-sm font-medium rounded-full transition-colors text-white hover:bg-white/10 peer-checked:bg-[#468AD1] peer-checked:text-white">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAiModeToggle}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border self-center sm:self-auto ${
                    aiMode
                      ? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/30"
                      : "bg-white/15 backdrop-blur-md text-white border-white/30 hover:bg-white/25"
                  }`}
                >
                  <FiCpu className="h-4 w-4" />
                  <span>{aiMode ? "AI Search On" : "AI Search"}</span>
                </button>
              </div>

              <div
                className={`relative rounded-[16px] md:rounded-[20px] bg-white/95 backdrop-blur-xl shadow-[0_24px_80px_rgba(15,23,42,0.24)] ring-1 transition-all ${
                  aiMode
                    ? "ring-brand-300/80 shadow-brand-500/10"
                    : "ring-white/70"
                }`}
              >
                <div className="rounded-[32px] md:rounded-[36px] p-4 md:p-6">
                  {aiMode ? (
                    /* ── AI mode: single prompt replaces classic fields ── */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-9">
                          <label
                            htmlFor="hero-ai-prompt"
                            className="block text-sm font-medium text-gray-700 mb-1.5"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <FiZap className="h-3.5 w-3.5 text-brand-500" />
                              Describe what you&apos;re looking for
                            </span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiCpu className="h-5 w-5 text-brand-400" />
                            </div>
                            <input
                              id="hero-ai-prompt"
                              type="text"
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              maxLength={1000}
                              autoFocus
                              placeholder="e.g. 3-bedroom house in Lavington with parking under 50M"
                              className="w-full pl-10 pr-4 py-3 text-gray-700 bg-brand-50/50 border border-brand-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-3">
                          <button
                            type="submit"
                            disabled={!aiPrompt.trim()}
                            className="w-full px-4 py-3 bg-gradient-to-r from-brand-400 to-brand-600 text-white font-medium rounded-xl hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                          >
                            <FiSearch className="h-5 w-5" />
                            <span>Search with AI</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {AI_EXAMPLE_PROMPTS.map((example) => (
                          <button
                            key={example}
                            type="button"
                            onClick={() => setAiPrompt(example)}
                            className="text-[11px] leading-tight px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                          >
                            {example.length > 42 ? `${example.slice(0, 42)}…` : example}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* ── Classic mode: location, category, filters ── */
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-5 relative z-[1000]">
                          <label
                            htmlFor="hero-location"
                            className="block text-sm font-medium text-gray-700 mb-1.5"
                          >
                            Location
                          </label>
                          <div ref={inputWrapperRef} className="relative z-[9999]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiMapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="hero-location"
                              type="text"
                              name="location"
                              autoComplete="off"
                              placeholder="County, town or neighbourhood"
                              value={location}
                              onChange={(event) => {
                                setLocation(event.target.value);
                                setSelectedLocation(null);
                              }}
                              onFocus={() =>
                                setShowSuggestions(Boolean(location.trim()))
                              }
                              className="w-full pl-10 pr-10 py-3 text-[#514f63] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/10 transition-colors"
                            />
                            {isLoading && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <FiLoader className="h-5 w-5 text-gray-400 animate-spin" />
                              </div>
                            )}
                            {showSuggestions &&
                              typeof window !== "undefined" &&
                              createPortal(
                                <div
                                  ref={suggestionsRef}
                                  style={dropdownStyle}
                                  className="fixed z-[9999] bg-white shadow-2xl rounded-2xl border border-gray-200 max-h-[320px] overflow-auto"
                                >
                                  {suggestions.length > 0 ? (
                                    suggestions.map((suggestion) => (
                                      <button
                                        key={`${suggestion.type}-${suggestion.id}`}
                                        type="button"
                                        onClick={() =>
                                          handleLocationSelect(suggestion)
                                        }
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                      >
                                        <div className="flex items-start">
                                          <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">
                                              {suggestion.display}
                                            </div>
                                            <div className="text-xs text-gray-500 capitalize mt-0.5">
                                              {suggestion.type}
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500">
                                      No locations found
                                    </div>
                                  )}
                                </div>,
                                document.body
                              )}
                          </div>
                        </div>

                        <div className="md:col-span-3">
                          <label
                            htmlFor="hero-category"
                            className="block text-sm font-medium text-gray-700 mb-1.5"
                          >
                            Category
                          </label>
                          <select
                            id="hero-category"
                            name="category"
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            className="w-full px-4 py-3 text-[#514f63] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/10 transition-colors"
                          >
                            <option value="">All Categories</option>
                            {SEARCH_PROPERTY_CATEGORIES.map((option) => (
                              <option key={option} value={option}>
                                {propertyCategoryDisplayNames[option]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-4">
                          <span className="block text-sm font-medium text-gray-700 mb-1.5">
                            Actions
                          </span>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setShowFilters((prev) => !prev)}
                              className={`w-full px-4 py-3 border rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                                showFilters
                                  ? "border-[#468AD1] bg-[#468AD1]/5 text-[#468AD1]"
                                  : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <FiSliders className="h-4 w-4" />
                              <span>Filters</span>
                              {activeFilterCount > 0 && (
                                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[#468AD1] text-white text-xs font-semibold">
                                  {activeFilterCount}
                                </span>
                              )}
                            </button>

                            <button
                              type="submit"
                              className="px-4 py-3 bg-[#468AD1] text-white font-medium rounded-xl hover:bg-[#2F6FAE] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#468AD1]/20"
                            >
                              <FiSearch className="h-5 w-5" />
                              <span>Search</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          showFilters
                            ? "max-h-[500px] opacity-100 mt-4"
                            : "max-h-0 opacity-0 mt-0"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor="hero-bedrooms"
                              className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                              Bedrooms
                            </label>
                            <select
                              id="hero-bedrooms"
                              name="bedrooms"
                              value={bedrooms}
                              onChange={(event) => setBedrooms(event.target.value)}
                              className="w-full px-4 py-3 text-[#514f63] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/10 transition-colors"
                            >
                              {bedroomOptions.map((option) => (
                                <option
                                  key={option.value || "any"}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor="hero-min-price"
                              className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                              Min Price
                            </label>
                            <input
                              id="hero-min-price"
                              type="number"
                              name="minPrice"
                              inputMode="numeric"
                              min="0"
                              value={minPrice}
                              onChange={(event) => setMinPrice(event.target.value)}
                              placeholder="e.g. 5,000,000"
                              className="w-full px-4 py-3 text-[#514f63] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/10 transition-colors"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor="hero-max-price"
                              className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                              Max Price
                            </label>
                            <input
                              id="hero-max-price"
                              type="number"
                              name="maxPrice"
                              inputMode="numeric"
                              min="0"
                              value={maxPrice}
                              onChange={(event) => setMaxPrice(event.target.value)}
                              placeholder="e.g. 25,000,000"
                              className="w-full px-4 py-3 text-[#514f63] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/10 transition-colors"
                            />
                          </div>

                          <div className="flex-shrink-0 flex items-end">
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="px-5 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>

                      {activeFilterCount > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {bedrooms && (
                            <span className="inline-flex items-center rounded-full bg-[#468AD1]/10 text-[#468AD1] px-3 py-1 text-xs font-medium">
                              {getBedroomSummary(bedrooms)}
                            </span>
                          )}
                          {minPrice && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-medium">
                              Min KES {Number(minPrice).toLocaleString()}
                            </span>
                          )}
                          {maxPrice && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-medium">
                              Max KES {Number(maxPrice).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Parallax>
  );
}
