"use client";

import { useCallback } from "react";
import Image from "next/image";
import { FiUpload } from "react-icons/fi";
import { useDropzone, FileRejection } from "react-dropzone";

interface ProfileImageUploadProps {
  avatar: string;
  onImageUpload: (url: string) => void;
}

export default function ProfileImageUpload({
  avatar,
  onImageUpload,
}: ProfileImageUploadProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      console.log("onDrop triggered with files:", acceptedFiles);
      try {
        const file = acceptedFiles[0]; // Only take the first file
        if (!file) {
          console.error("No file received in onDrop");
          return;
        }

        console.log("Processing file:", file.name);

        // Create FormData and append file
        const formData = new FormData();
        formData.append("files", file);

        console.log("Making API request to upload file...");
        
        const response = await fetch("/api/crm/profile/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to upload image");
        }

        onImageUpload(result.urls[0]);
      } catch (error) {
        console.error("Error uploading profile image:", error);
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxSize: 5242880, // 5MB
    multiple: false,
    onDropRejected: (fileRejections: FileRejection[]) => {
      console.log("File rejected:", fileRejections);
    },
    onError: (error: Error) => {
      console.error("Dropzone error:", error);
    }
  });

  const getImageUrl = (avatarUrl: string) => {
    if (!avatarUrl) return "/images/placeholder.png";
    if (avatarUrl.startsWith("http") || avatarUrl.startsWith("/api/images/")) {
      return avatarUrl;
    }
    return `/api/images/serve/profiles/${avatarUrl}`;
  };

  return (
    <div>
      <div className="flex items-center space-x-6">
        <div className="relative h-24 w-24">
          <Image
            src={getImageUrl(avatar)}
            alt="Profile picture"
            fill
            className="rounded-full object-cover"
            priority
            onError={(e) => {
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
            Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP
          </p>
        </div>
      </div>
    </div>
  );
}
