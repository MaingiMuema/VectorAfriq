"use client";

import React, { useRef, useState, useEffect } from "react";
import { EditorRef } from "@/components/editor/Editor";
import Image from "next/image";
import { FiSave, FiSend, FiUpload, FiX } from "react-icons/fi";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import Editor from "@/components/editor/Editor";
import {
  generateNeighborhoodGuideSlug,
  isTitleDerivedGuideSlug,
} from "@/lib/neighborhoodGuideSlug";

interface Guide {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  locationType: "county" | "city" | "neighborhood";
  countyId: string;
  cityId: string | null;
  neighborhoodId: string | null;
  categories: string[];
  bedrooms: string[] | null;
  listingTypes: string[] | null;
  published: boolean;
  sortOrder: number;
  countyName: string;
  cityName: string | null;
  neighborhoodName: string | null;
}

interface NeighborhoodGuideEditorProps {
  id: string;
  /** When true, the editor is rendered inside a modal/overlay on a public page
   *  (no full-page layout, no redirect after save). */
  inline?: boolean;
  /** Pre-fill values for creating a new guide (e.g. from the current page
   *  context — location and filter targeting are set here, not in the form).
   *  Ignored when editing an existing guide. */
  initialData?: Partial<Guide>;
  /** Called with the saved guide instead of navigating to the admin editor. */
  onSaved?: (guide: Guide) => void;
}

export function NeighborhoodGuideEditor({
  id,
  inline = false,
  initialData,
  onSaved,
}: NeighborhoodGuideEditorProps) {
  const isNew = id === "new";
  const editorRef = useRef<EditorRef>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<
    (File & { preview?: string }) | null
  >(null);
  const [hasPendingImages, setHasPendingImages] = useState(false);

  const [guide, setGuide] = useState<Guide>({
    id: "",
    title: "",
    slug: "",
    excerpt: null,
    content: "",
    image: null,
    metaTitle: null,
    metaDescription: null,
    locationType: "city",
    countyId: "",
    cityId: null,
    neighborhoodId: null,
    categories: [],
    bedrooms: null,
    listingTypes: null,
    published: false,
    sortOrder: 0,
    countyName: "",
    cityName: null,
    neighborhoodName: null,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBedrooms, setSelectedBedrooms] = useState<string[]>([]);
  const [selectedListingTypes, setSelectedListingTypes] = useState<string[]>([]);
  const [useCustomSlug, setUseCustomSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState("");

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
    maxSize: 5242880,
    multiple: false,
  });

  useEffect(() => {
    return () => {
      if (imageFile?.preview) {
        URL.revokeObjectURL(imageFile.preview);
      }
    };
  }, [imageFile]);

  // Apply pre-fill for new guides created from public pages. Location and
  // filter targeting (county/city/neighborhood, categories, bedrooms, listing
  // types) are determined by the page the guide is created from — the form no
  // longer exposes these. The editor remounts fresh on each modal open, so
  // [isNew] is the only dependency needed.
  useEffect(() => {
    if (isNew && initialData) {
      setGuide((prev) => ({ ...prev, ...initialData }));
      setSelectedCategories(initialData.categories || []);
      setSelectedBedrooms(initialData.bedrooms || []);
      setSelectedListingTypes(initialData.listingTypes || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isNew) {
          const guideRes = await fetch(
            `/api/admin/neighborhood-guides/${id}`
          );
          if (!guideRes.ok) throw new Error("Failed to fetch guide");

          const guideData = await guideRes.json();
          setGuide(guideData);
          setSelectedCategories(guideData.categories || []);
          setSelectedBedrooms(guideData.bedrooms || []);
          setSelectedListingTypes(guideData.listingTypes || []);

          const hasCustomSlug =
            Boolean(guideData.slug) &&
            !isTitleDerivedGuideSlug(guideData.title, guideData.slug);
          setUseCustomSlug(hasCustomSlug);
          setCustomSlug(hasCustomSlug ? guideData.slug : "");
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

  const resolvedSlug = generateNeighborhoodGuideSlug(
    useCustomSlug
      ? customSlug || guide.title || guide.id || "guide"
      : guide.title || guide.id || "guide"
  );
  const slugPreview = resolvedSlug
    ? `/neighborhood-guide/${resolvedSlug}`
    : "/neighborhood-guide/{slug}";

  const syncGuideFromResponse = (data: Guide) => {
    setGuide(data);
    setSelectedCategories(data.categories || []);
    setSelectedBedrooms(data.bedrooms || []);
    setSelectedListingTypes(data.listingTypes || []);
    const hasCustomSlug =
      Boolean(data.slug) &&
      !isTitleDerivedGuideSlug(data.title, data.slug);
    setUseCustomSlug(hasCustomSlug);
    setCustomSlug(hasCustomSlug ? data.slug : "");
  };

  const handleSave = async (publish: boolean = false) => {
    if (!guide.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSaving(true);
    let loadingToast: string | undefined;

    if (publish) {
      loadingToast = toast.loading("Publishing guide...");
    }

    try {
      let processedContent = guide.content;
      if (hasPendingImages && editorRef.current) {
        if (publish) {
          toast.loading("Uploading content images...", { id: loadingToast });
        }
        processedContent = await editorRef.current.uploadPendingImages();
        setGuide((prev) => ({ ...prev, content: processedContent }));
      }

      let imageUrl = guide.image;
      if (imageFile) {
        if (publish) {
          toast.loading("Uploading featured image...", { id: loadingToast });
        }

        const formData = new FormData();
        formData.append("files", imageFile);
        formData.append(
          "propertyId",
          `neighborhood-guides/${isNew ? "temp" : id}`
        );

        const uploadRes = await fetch("/api/crm/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(error.error || "Failed to upload image");
        }

        const result = await uploadRes.json();
        if (!result.success || !result.urls?.[0]) {
          throw new Error("Failed to get upload URL");
        }
        imageUrl = result.urls[0];
      }

      const method = isNew ? "POST" : "PATCH";
      const url = `/api/admin/neighborhood-guides${
        isNew ? "" : `/${id}`
      }`;

      const guideData = {
        title: guide.title,
        slug: useCustomSlug ? customSlug : "",
        excerpt: guide.excerpt,
        content: processedContent,
        image: imageUrl,
        metaTitle: guide.metaTitle,
        metaDescription: guide.metaDescription,
        locationType: guide.locationType,
        countyId: guide.countyId,
        cityId: guide.cityId,
        neighborhoodId: guide.neighborhoodId,
        categories: selectedCategories,
        bedrooms: selectedBedrooms.length > 0 ? selectedBedrooms : null,
        listingTypes: selectedListingTypes.length > 0 ? selectedListingTypes : null,
        published: publish,
        sortOrder: guide.sortOrder,
      };

      if (publish) {
        toast.loading("Saving...", { id: loadingToast });
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(guideData),
      });

      if (!res.ok) throw new Error("Failed to save guide");
      const data = await res.json();

      if (publish) {
        toast.dismiss(loadingToast);
        toast.success("Guide published successfully");
      } else {
        toast.success("Draft saved successfully");
      }

      if (isNew) {
        if (onSaved) {
          onSaved(data);
        }
      } else {
        syncGuideFromResponse(data);
        if (onSaved) {
          onSaved(data);
        }
      }
    } catch (error) {
      console.error("Error saving guide:", error);
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      toast.error("Error saving guide");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${
          inline ? "min-h-[300px]" : "min-h-screen"
        }`}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {!inline && (
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? "Create Neighborhood Guide" : "Edit Neighborhood Guide"}
          </h1>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <FiSave className="w-5 h-5" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE]"
          >
            <FiSend className="w-5 h-5" />
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - 2/3 width */}
        <div className="col-span-2 space-y-6">
          <input
            type="text"
            placeholder="Guide Title"
            className="w-full px-4 py-2 text-xl border rounded-lg"
            value={guide.title}
            onChange={(e) => setGuide({ ...guide, title: e.target.value })}
          />

          <div className="prose max-w-none">
            <Editor
              ref={editorRef}
              value={guide.content}
              onChange={(content: string) =>
                setGuide({ ...guide, content })
              }
              className="h-96"
              contextId={isNew ? undefined : `neighborhood-guides/${id}`}
              onPendingImagesChange={(count) =>
                setHasPendingImages(count > 0)
              }
            />
          </div>
        </div>

        {/* Settings Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Content Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">
              Content Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  value={guide.excerpt || ""}
                  onChange={(e) =>
                    setGuide({ ...guide, excerpt: e.target.value })
                  }
                  placeholder="Brief description shown in guide cards"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Slug
                  </label>
                  {useCustomSlug ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomSlug(false);
                        setCustomSlug("");
                      }}
                      className="text-xs font-medium text-[#468AD1] hover:text-[#2F6FAE]"
                    >
                      Use Title Slug
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomSlug(true);
                        setCustomSlug(
                          guide.slug ||
                            generateNeighborhoodGuideSlug(guide.title || "guide")
                        );
                      }}
                      className="text-xs font-medium text-[#468AD1] hover:text-[#2F6FAE]"
                    >
                      Add Custom Slug
                    </button>
                  )}
                </div>

                {useCustomSlug ? (
                  <input
                    type="text"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="Enter a custom slug"
                  />
                ) : (
                  <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    Slug will be generated from title when saved.
                  </div>
                )}

                <div className="mt-2 rounded-lg border bg-gray-50 px-3 py-2">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Preview
                  </div>
                  <div className="mt-1 break-all font-mono text-sm text-gray-900">
                    {slugPreview}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Featured Image
                </label>
                <div
                  {...getRootProps()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#468AD1] transition-colors cursor-pointer"
                >
                  <input {...getInputProps()} />
                  {imageFile?.preview || guide.image ? (
                    <div className="relative w-full h-48">
                      <Image
                        src={imageFile?.preview || guide.image || ""}
                        alt="Featured image"
                        className="object-cover rounded-lg"
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
                          setGuide({ ...guide, image: null });
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
                        Drag & drop an image, or click to select
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Max 5MB. JPEG, PNG, WebP
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">SEO Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={guide.metaTitle || ""}
                  onChange={(e) =>
                    setGuide({ ...guide, metaTitle: e.target.value })
                  }
                  placeholder="Override page title for SEO"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to use guide title
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  value={guide.metaDescription || ""}
                  onChange={(e) =>
                    setGuide({ ...guide, metaDescription: e.target.value })
                  }
                  placeholder="SEO description (160 chars recommended)"
                  maxLength={320}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
