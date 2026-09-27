"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiSave } from "react-icons/fi";
import { toast } from "react-hot-toast";
import ProfileImageUpload from "./ProfileImageUpload";

interface ProfileFormProps {
  initialData: {
    name: string;
    email: string;
    phone: string;
    avatar: string;
    bio: string;
    role: string;
    specialization: string[];
    languages: string[];
    socialMedia: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
    };
  };
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    ...initialData,
    name: initialData.name || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    bio: initialData.bio || "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, avatar: url }));
    toast.success("Profile picture uploaded successfully");
    window.location.reload();
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
      const response = await fetch("/api/crm/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile Image */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Profile Picture
        </label>
        <ProfileImageUpload
          avatar={formData.avatar}
          onImageUpload={handleImageUpload}
        />
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name
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
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number
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

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-gray-700"
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio || ""}
          onChange={handleInputChange}
          rows={4}
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
              placeholder="https://facebook.com/username"
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
              placeholder="https://twitter.com/username"
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
              placeholder="https://linkedin.com/in/username"
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
              placeholder="https://instagram.com/username"
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
