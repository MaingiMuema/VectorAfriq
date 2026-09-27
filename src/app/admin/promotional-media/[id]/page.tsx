"use client";

import React, { use } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiSave, FiUpload, FiX, FiSearch } from "react-icons/fi";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import { Banner } from "@/types/banner";

// Location interfaces
interface LocationOption {
  id: string;
  name: string;
  slug: string;
  type: 'county' | 'city' | 'neighborhood';
  cities?: LocationOption[];
  neighborhoods?: LocationOption[];
}

interface BannerEditorProps {
  id: string;
}

const BANNER_IMAGE_GUIDANCE = {
  recommendedSize: "1920 x 480 px",
  aspectRatio: "4:1",
  note:
    "Banners render at their full 4:1 ratio with object-contain, so the whole image remains visible on listing pages.",
};

function BannerEditor({ id }: BannerEditorProps) {
  const router = useRouter();
  const isNew = id === "new";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<
    (File & { preview?: string }) | null
  >(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [banner, setBanner] = useState<Banner>({
    id: "",
    imageUrl: "",
    linkUrl: "",
    locations: [],
    active: true,
    userId: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const fileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
        });
        setImageFile(fileWithPreview);
      }
    },
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxSize: 5242880, // 5MB
    multiple: false,
  });

  useEffect(() => {
    return () => {
      if (imageFile?.preview) {
        URL.revokeObjectURL(imageFile.preview);
      }
    };
  }, [imageFile]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch complete location hierarchy
        const countiesRes = await fetch('/api/locations/counties');
        if (!countiesRes.ok) throw new Error("Failed to fetch counties");
        const counties = await countiesRes.json();

        // For each county, fetch cities with neighborhoods
        const locationsWithHierarchy = await Promise.all(
          counties.map(async (county: any) => {
            const citiesRes = await fetch(`/api/locations/cities?countyId=${county.id}`);
            if (!citiesRes.ok) return { ...county, cities: [] };
            const cities = await citiesRes.json();

            // For each city, fetch neighborhoods
            const citiesWithNeighborhoods = await Promise.all(
              cities.map(async (city: any) => {
                const neighborhoodsRes = await fetch(`/api/locations/neighborhoods?cityId=${city.id}`);
                if (!neighborhoodsRes.ok) return { ...city, neighborhoods: [] };
                const neighborhoods = await neighborhoodsRes.json();
                return { ...city, neighborhoods };
              })
            );

            return { ...county, cities: citiesWithNeighborhoods };
          })
        );

        setLocations(locationsWithHierarchy);

        // Fetch banner data if editing
        if (!isNew) {
          const bannerRes = await fetch(`/api/admin/promotional-content/${id}`);
          if (!bannerRes.ok) throw new Error("Failed to fetch banner");

          const bannerData = await bannerRes.json();
          setBanner(bannerData.banner);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isNew, id]);

  // Filter locations based on search term
  const filteredLocations = locations.filter((county) => {
    const countyMatches = county.name.toLowerCase().includes(locationSearch.toLowerCase());

    // Check if any cities match
    const matchingCities = county.cities?.filter((city) => {
      const cityMatches = city.name.toLowerCase().includes(locationSearch.toLowerCase());
      // Check if any neighborhoods match
      const matchingNeighborhoods = city.neighborhoods?.filter((neighborhood) =>
        neighborhood.name.toLowerCase().includes(locationSearch.toLowerCase())
      ) || [];

      return cityMatches || matchingNeighborhoods.length > 0;
    }) || [];

    return countyMatches || matchingCities.length > 0 || locationSearch === "";
  }).map((county) => {
    if (locationSearch === "") return county;

    // Filter cities and neighborhoods within the county
    const filteredCities = county.cities?.filter((city) => {
      const cityMatches = city.name.toLowerCase().includes(locationSearch.toLowerCase());
      const matchingNeighborhoods = city.neighborhoods?.filter((neighborhood) =>
        neighborhood.name.toLowerCase().includes(locationSearch.toLowerCase())
      ) || [];

      return cityMatches || matchingNeighborhoods.length > 0;
    }).map((city) => ({
      ...city,
      neighborhoods: city.neighborhoods?.filter((neighborhood) =>
        neighborhood.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
        city.name.toLowerCase().includes(locationSearch.toLowerCase())
      )
    })) || [];

    return {
      ...county,
      cities: filteredCities
    };
  });

  const handleSave = async () => {



    if (!banner.imageUrl && !imageFile) {
      toast.error("Please upload an image");
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading("Saving banner...");

    try {
      // Upload image if exists
      let imageUrl = banner.imageUrl;
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append("file", imageFile);

          const uploadRes = await fetch("/api/admin/promotional-content/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const error = await uploadRes.json();
            throw new Error(error.error || "Failed to upload image");
          }

          const result = await uploadRes.json();
          if (!result.success || !result.path) {
            throw new Error("Failed to get upload URL");
          }

          imageUrl = result.path;
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to upload image"
          );
          setSaving(false);
          return;
        }
      }

      const method = isNew ? "POST" : "PATCH";
      const url = isNew ? "/api/admin/promotional-content" : `/api/admin/promotional-content/${id}`;

      const bannerData = {
        ...banner,
        imageUrl,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bannerData),
      });

      if (!res.ok) throw new Error("Failed to save banner");

      toast.success("Banner saved successfully");
      if (isNew) {
        const data = await res.json();
        router.push(`/admin/banners/${data.banner.id}`);
      }
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error("Error saving banner");
    } finally {
      toast.dismiss(loadingToast);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? "Create New Banner" : "Edit Banner"}
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE]"
        >
          <FiSave className="w-5 h-5" />
          Save Banner
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Locations
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Select which location pages this banner should appear on. Leave empty to show on all locations.
              </p>
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:border-transparent"
                  />
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 space-y-4">
                {filteredLocations.length === 0 && locationSearch ? (
                  <div className="text-center py-8 text-gray-500">
                    No locations found matching "{locationSearch}"
                  </div>
                ) : (
                filteredLocations.map((county) => (
                  <div key={county.id} className="space-y-2">
                    <label className="flex items-center gap-2 font-medium">
                      <input
                        type="checkbox"
                        checked={banner.locations?.includes(county.id) || false}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setBanner(prev => ({
                            ...prev,
                            locations: isChecked
                              ? [...(prev.locations || []), county.id]
                              : (prev.locations || []).filter(l => l !== county.id)
                          }));
                        }}
                        className="rounded text-[#468AD1] focus:ring-[#468AD1]"
                      />
                      <span className="text-sm">{county.name} (County)</span>
                    </label>

                    {county.cities && county.cities.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {county.cities.map((city) => (
                          <div key={city.id}>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={banner.locations?.includes(city.id) || false}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setBanner(prev => ({
                                    ...prev,
                                    locations: isChecked
                                      ? [...(prev.locations || []), city.id]
                                      : (prev.locations || []).filter(l => l !== city.id)
                                  }));
                                }}
                                className="rounded text-[#468AD1] focus:ring-[#468AD1]"
                              />
                              <span className="text-sm">{city.name} (City)</span>
                            </label>

                            {city.neighborhoods && city.neighborhoods.length > 0 && (
                              <div className="ml-6 space-y-1">
                                {city.neighborhoods.map((neighborhood) => (
                                  <label key={neighborhood.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={banner.locations?.includes(neighborhood.id) || false}
                                      onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        setBanner(prev => ({
                                          ...prev,
                                          locations: isChecked
                                            ? [...(prev.locations || []), neighborhood.id]
                                            : (prev.locations || []).filter(l => l !== neighborhood.id)
                                        }));
                                      }}
                                      className="rounded text-[#468AD1] focus:ring-[#468AD1]"
                                    />
                                    <span className="text-sm">{neighborhood.name} (Neighborhood)</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Banner Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Image
                </label>
                <div
                  {...getRootProps()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#468AD1] transition-colors cursor-pointer"
                >
                  <input {...getInputProps()} />
                  {imageFile?.preview || banner.imageUrl ? (
                    <div className="relative w-full h-48">
                      <Image
                        src={imageFile?.preview || banner.imageUrl}
                        alt="Banner image"
                        className="object-contain rounded-lg bg-gray-100"
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (imageFile?.preview) {
                            URL.revokeObjectURL(imageFile.preview);
                          }
                          setImageFile(null);
                          setBanner({ ...banner, imageUrl: "" });
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Drag & drop an image here, or click to select
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP
                      </p>
                    </>
                  )}
                </div>
                <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
                  <p className="text-sm font-medium text-sky-900">
                    Recommended image setup
                  </p>
                  <p className="mt-1 text-sm text-sky-800">
                    Size:{" "}
                    <span className="font-semibold">
                      {BANNER_IMAGE_GUIDANCE.recommendedSize}
                    </span>
                    {" "}|{" "}
                    Aspect ratio:{" "}
                    <span className="font-semibold">
                      {BANNER_IMAGE_GUIDANCE.aspectRatio}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-sky-700">
                    {BANNER_IMAGE_GUIDANCE.note}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="banner-link-url" className="block text-sm font-medium text-gray-700 mb-1">
                  Click-through link
                </label>
                <input
                  id="banner-link-url"
                  type="text"
                  value={banner.linkUrl || ""}
                  onChange={(e) =>
                    setBanner({ ...banner, linkUrl: e.target.value })
                  }
                  placeholder="/listings/example-property/id or https://example.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-2 focus:ring-[#468AD1]/20"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to make the banner non-clickable.
                </p>
              </div>



              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={banner.active}
                    onChange={(e) =>
                      setBanner({ ...banner, active: e.target.checked })
                    }
                    className="rounded text-[#468AD1] focus:ring-[#468AD1]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BannerEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params) as { id: string };
  return <BannerEditor id={resolvedParams.id} />;
}
