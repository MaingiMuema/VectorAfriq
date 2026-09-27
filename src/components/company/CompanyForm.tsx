"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiUpload, FiSave } from "react-icons/fi";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";

interface CompanyFormProps {
  initialData: {
    id?: string;
    name: string;
    logo: string;
    description: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    socialMedia: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
    };
  };
}

export default function CompanyForm({ initialData }: CompanyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(initialData);

  const onDrop = async (acceptedFiles: File[]) => {
    const uploadPromise = (async () => {
      const file = acceptedFiles[0];
      if (!file) throw new Error("No file selected");

      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch("/api/crm/company/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload image");
      }

      const imageUrl = result.urls[0];
      setFormData((prev) => ({ ...prev, logo: imageUrl }));
      return result.message || "Company logo uploaded successfully";
    })();

    toast.promise(uploadPromise, {
      loading: 'Uploading company logo...',
      success: (message) => message,
      error: (err) => {
        console.error("Error uploading company logo:", err);
        return err.message || "Failed to upload company logo";
      }
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxSize: 20242880, // 20MB
    multiple: false,
    onDropRejected: (rejections) => {
      rejections.forEach((rejection) => {
        if (rejection.errors[0]?.code === "file-too-large") {
          toast.error("File is too large. Maximum size is 20MB");
        } else {
          toast.error("Invalid file type. Please use JPEG, PNG, or WebP");
        }
      });
    }
  });

  const getImageUrl = (url: string) => {
    if (!url || url === "/images/placeholder.png") return "/images/placeholder.png";
    if (url.startsWith("http") || url.startsWith("/api/images/")) return url;
    return `/api/images/serve/companies/${url}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [name]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/crm/company", {
        method: formData.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update company");
      }

      toast.success(
        formData.id
          ? "Company information updated successfully"
          : "Company created successfully"
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Logo
        </label>
        <div className="flex items-center space-x-6">
          <div className="relative h-32 w-32">
            <Image
              src={getImageUrl(formData.logo)}
              alt="Company logo"
              fill
              className="object-contain rounded-lg"
              priority
              onError={(e) => {
                console.error("Error loading image:", formData.logo);
                const target = e.target as HTMLImageElement;
                target.src = "/images/placeholder.png";
              }}
            />
          </div>
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#468AD1] transition-colors cursor-pointer"
          >
            <input {...getInputProps()} />
            <div className="flex items-center space-x-2">
              <FiUpload className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Drag & drop or click to upload
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: 20MB. Supported formats: JPEG, PNG, WebP
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Company Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
            required
          />
        </div>

        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700"
          >
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
        />
      </div>

      {/* Address */}
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700"
        >
          Address
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
        />
      </div>

      {/* Social Media */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Social Media</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="facebook"
              className="block text-sm font-medium text-gray-700"
            >
              Facebook
            </label>
            <input
              type="url"
              id="facebook"
              name="facebook"
              value={formData.socialMedia.facebook || ""}
              onChange={handleSocialMediaChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
              placeholder="https://facebook.com/company"
            />
          </div>

          <div>
            <label
              htmlFor="twitter"
              className="block text-sm font-medium text-gray-700"
            >
              Twitter
            </label>
            <input
              type="url"
              id="twitter"
              name="twitter"
              value={formData.socialMedia.twitter || ""}
              onChange={handleSocialMediaChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
              placeholder="https://twitter.com/company"
            />
          </div>

          <div>
            <label
              htmlFor="linkedin"
              className="block text-sm font-medium text-gray-700"
            >
              LinkedIn
            </label>
            <input
              type="url"
              id="linkedin"
              name="linkedin"
              value={formData.socialMedia.linkedin || ""}
              onChange={handleSocialMediaChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
              placeholder="https://linkedin.com/company/name"
            />
          </div>

          <div>
            <label
              htmlFor="instagram"
              className="block text-sm font-medium text-gray-700"
            >
              Instagram
            </label>
            <input
              type="url"
              id="instagram"
              name="instagram"
              value={formData.socialMedia.instagram || ""}
              onChange={handleSocialMediaChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
              placeholder="https://instagram.com/company"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center px-6 py-3 bg-[#468AD1] text-white rounded-md hover:bg-[#468AD1]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1] disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <FiSave className="w-5 h-5 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
