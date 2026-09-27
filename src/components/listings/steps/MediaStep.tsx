"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { FiUpload, FiX, FiVideo, FiLoader } from "react-icons/fi";
import { useDropzone, FileRejection } from "react-dropzone";
import { toast } from "react-hot-toast";
import { ImageService } from "@/lib/imageService";

interface FileWithPreview extends File {
  preview?: string;
  id?: string;
}

interface MediaStepProps {
  data: {
    images: FileWithPreview[];
    videos: FileWithPreview[];
    virtualTour?: string;
    youtubeUrl?: string;
    tiktokUrl?: string;
    facebookUrl?: string;
    propertyId?: string;
  };
  onChange: (data: Partial<MediaStepProps["data"]>) => void;
}

export default function MediaStep({ data, onChange }: MediaStepProps) {
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Regenerate preview URLs for existing images on mount
  useEffect(() => {
    const imagesNeedingPreviews = data.images.filter(img => !img.preview);
    if (imagesNeedingPreviews.length > 0) {
      const updatedImages = data.images.map(img => {
        if (!img.preview) {
          const preview = URL.createObjectURL(img);
          return Object.assign(img, { preview });
        }
        return img;
      });
      onChange({ images: updatedImages });
    }
  }, [data.images, onChange]);

  // Regenerate preview URLs for existing videos on mount
  useEffect(() => {
    const videosNeedingPreviews = data.videos.filter(vid => !vid.preview);
    if (videosNeedingPreviews.length > 0) {
      const updatedVideos = data.videos.map(vid => {
        if (!vid.preview) {
          const preview = URL.createObjectURL(vid);
          return Object.assign(vid, { preview });
        }
        return vid;
      });
      onChange({ videos: updatedVideos });
    }
  }, [data.videos, onChange]);

  // Validate image file before processing
  const validateImage = (file: File): string | null => {
    // Check file size (1MB limit)
    if (file.size > 1048576) {
      return `File "${file.name}" is too large. Maximum size is 1MB.`;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return `Image "${file.name}" is not a supported format. Use JPEG, PNG, or WebP.`;
    }

    return null;
  };

  // Validate video file before processing
  const validateVideo = (file: File): string | null => {
    // Check file size (20MB limit)
    if (file.size > 20971520) {
      return `Video "${file.name}" is too large. Maximum size is 20MB.`;
    }

    // Check file type
    const allowedTypes = ['video/mp4'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['.mp4'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
      return `Video "${file.name}" is not a supported format. Please use MP4.`;
    }

    return null;
  };

  const onImageDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (window.sessionStorage.getItem("image-reorder")) return;

      setIsProcessingFiles(true);

      try {
        if (rejectedFiles.length > 0) {
          rejectedFiles.forEach((rejection) => {
            const errors = rejection.errors.map((e) => e.message).join(', ');
            toast.error(`${rejection.file.name}: ${errors}`);
          });
        }

        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        for (const file of acceptedFiles) {
          const error = validateImage(file);
          if (error) {
            invalidFiles.push(error);
          } else {
            validFiles.push(file);
          }
        }

        if (invalidFiles.length > 0) {
          invalidFiles.forEach(error => toast.error(error));
        }

        if (validFiles.length === 0) return;

        // Show compression progress for larger files
        const needsCompression = validFiles.some(f => f.size > 500 * 1024);
        if (needsCompression) {
          toast.loading('Compressing images...', { id: 'compression' });
        }

        // Compress all images to target <500KB
        const compressionPromises = validFiles.map(async (file) => {
          try {
            const compressed = await ImageService.compressToTarget(file);
            return compressed;
          } catch (error) {
            console.warn(`Failed to compress ${file.name}, using original:`, error);
            return file;
          }
        });

        const compressedFiles = await Promise.all(compressionPromises);

        // Dismiss compression toast
        if (needsCompression) {
          toast.dismiss('compression');

          // Calculate and show compression stats
          const originalSize = validFiles.reduce((sum, f) => sum + f.size, 0);
          const compressedSize = compressedFiles.reduce((sum, f) => sum + f.size, 0);
          const savedKB = Math.round((originalSize - compressedSize) / 1024);

          if (savedKB > 0) {
            toast.success(`Compressed: ${savedKB}KB saved`, { duration: 3000 });
          }
        }

        // Create previews in parallel using Promise.all
        const previewPromises = compressedFiles.map((file) => {
          return new Promise<FileWithPreview>((resolve) => {
            const preview = URL.createObjectURL(file);
            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            resolve(Object.assign(file, { preview, id }));
          });
        });

        const filesWithPreview = await Promise.all(previewPromises);
        const newImages = [...data.images, ...filesWithPreview];
        onChange({ images: newImages });
        toast.success(`Added ${filesWithPreview.length} image(s)`);
      } catch {
        toast.dismiss('compression');
        toast.error('Failed to process files');
      } finally {
        setIsProcessingFiles(false);
      }
    },
    [data.images, onChange]
  );

  const onVideoDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rejection) => {
          const errors = rejection.errors.map((e) => e.message).join(', ');
          toast.error(`${rejection.file.name}: ${errors}`);
        });
      }

      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      for (const file of acceptedFiles) {
        const error = validateVideo(file);
        if (error) {
          invalidFiles.push(error);
        } else {
          validFiles.push(file);
        }
      }

      if (invalidFiles.length > 0) {
        invalidFiles.forEach(error => toast.error(error));
      }

      if (validFiles.length === 0) return;

      const previewPromises = validFiles.map((file) => {
        return new Promise<FileWithPreview>((resolve) => {
          const preview = URL.createObjectURL(file);
          const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          resolve(Object.assign(file, { preview, id }));
        });
      });

      const filesWithPreview = await Promise.all(previewPromises);
      onChange({ videos: [...data.videos, ...filesWithPreview] });
      toast.success(`Added ${filesWithPreview.length} video(s)`);
    },
    [data.videos, onChange]
  );

  // Cleanup object URLs only on unmount
  useEffect(() => {
    return () => {
      data.images.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      data.videos.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [data.images, data.videos]);

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive } =
    useDropzone({
      onDrop: onImageDrop,
      accept: {
        "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      },
      maxSize: 1048576, // 1MB
      maxFiles: 20,
      noClick: isProcessingFiles,
      noKeyboard: isProcessingFiles,
      disabled: isProcessingFiles,
      onDragEnter: () => setIsDraggingFile(true),
      onDragLeave: () => setIsDraggingFile(false),
      onDropAccepted: () => setIsDraggingFile(false),
      onDropRejected: () => setIsDraggingFile(false),
    });

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } =
    useDropzone({
      onDrop: onVideoDrop,
      accept: {
        "video/mp4": [".mp4"],
      },
      maxSize: 20971520, // 20MB
      maxFiles: 5,
    });

  const removeImage = (index: number) => {
    const imageToRemove = data.images[index];

    // Clean up object URL
    if (imageToRemove?.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    const newImages = [...data.images];
    newImages.splice(index, 1);
    onChange({ images: newImages });

    toast.success('Image removed');
  };

  const removeVideo = (index: number) => {
    const videoToRemove = data.videos[index];

    // Clean up object URL
    if (videoToRemove?.preview) {
      URL.revokeObjectURL(videoToRemove.preview);
    }

    const newVideos = [...data.videos];
    newVideos.splice(index, 1);
    onChange({ videos: newVideos });
    toast.success('Video removed');
  };

  return (
    <div className="space-y-6">
      {/* Images Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Images
        </label>
        <div
          {...getImageRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${isProcessingFiles
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : isDragActive || isDraggingFile
              ? "border-[#468AD1] bg-red-50"
              : "border-gray-300 hover:border-[#468AD1] cursor-pointer"
            }`}
        >
          <input {...getImageInputProps()} />
          {isProcessingFiles ? (
            <>
              <FiLoader className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
              <p className="mt-2 text-sm text-gray-600">Processing files...</p>
            </>
          ) : (
            <>
              <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag & drop images here, or click to select files
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: 1MB. Supported formats: JPEG, PNG, WebP
              </p>
              <p className="text-xs text-green-600">
                ✓ Images are automatically compressed for optimal upload
              </p>
              <p className="text-xs text-gray-500">
                Maximum {20 - data.images.length} more images can be added
              </p>
            </>
          )}
        </div>

        {/* Image Preview */}
        {data.images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.images.map((file, index) => (
              <div
                key={file.id || index}
                className="relative group border border-gray-100 rounded-lg overflow-hidden shadow-sm"
                draggable={!isProcessingFiles}
                onDragStart={(e) => {
                  if (isProcessingFiles) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.effectAllowed = "move";
                  window.sessionStorage.setItem(
                    "image-reorder",
                    index.toString()
                  );
                  e.currentTarget.classList.add("opacity-50");
                }}
                onDragEnd={(e) => {
                  window.sessionStorage.removeItem("image-reorder");
                  e.currentTarget.classList.remove("opacity-50");
                }}
                onDragOver={(e) => {
                  if (isProcessingFiles) {
                    e.preventDefault();
                    return;
                  }
                  e.preventDefault();
                  e.currentTarget.classList.add("ring-2", "ring-[#468AD1]");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove(
                    "ring-2",
                    "ring-[#468AD1]"
                  );
                }}
                onDrop={(e) => {
                  if (isProcessingFiles) {
                    e.preventDefault();
                    return;
                  }
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove(
                    "ring-2",
                    "ring-[#468AD1]"
                  );
                  const draggedIndex = parseInt(
                    window.sessionStorage.getItem("image-reorder") || "-1"
                  );
                  window.sessionStorage.removeItem("image-reorder");
                  if (draggedIndex === index) return;

                  const newImages = [...data.images];
                  const [draggedImage] = newImages.splice(draggedIndex, 1);
                  newImages.splice(index, 0, draggedImage);
                  onChange({ images: newImages });
                }}
              >
                <div className={`relative w-full h-48 ${isProcessingFiles ? 'cursor-not-allowed' : 'cursor-move'
                  }`}>
                  <Image
                    src={file.preview!}
                    alt={`Preview ${index + 1}`}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-[#468AD1] text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                      Featured
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={isProcessingFiles}
                  className={`absolute top-2 right-2 p-1 bg-white/90 hover:bg-red-500 hover:text-white text-red-500 rounded-full shadow-sm transition-all ${isProcessingFiles
                    ? 'opacity-30 cursor-not-allowed'
                    : 'opacity-0 group-hover:opacity-100'
                    }`}
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Videos Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Videos
        </label>
        <div
          {...getVideoRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${isVideoDragActive
            ? "border-[#468AD1] bg-red-50"
            : "border-gray-300 hover:border-[#468AD1] cursor-pointer"
            }`}
        >
          <input {...getVideoInputProps()} />
          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag & drop videos here, or click to select files
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Maximum file size: 20MB. Supported format: MP4
          </p>
        </div>

        {/* Video Preview */}
        {data.videos.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.videos.map((file, index) => (
              <div
                key={file.id || index}
                className="relative group border border-gray-100 rounded-lg overflow-hidden bg-black aspect-video"
              >
                <video
                  src={file.preview}
                  className="w-full h-full object-contain"
                  controls={false}
                  muted
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <FiVideo className="w-10 h-10 text-white opacity-50" />
                </div>
                <div className="absolute bottom-3 left-3 right-10">
                  <p className="text-xs text-white truncate font-medium drop-shadow-md">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-gray-300 drop-shadow-md">
                    {file.size > 0
                      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                      : "Remote Video"
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Virtual Tour Link */}
      <div>
        <label
          htmlFor="virtualTour"
          className="block text-sm font-medium text-gray-700"
        >
          Virtual Tour Link (Optional)
        </label>
        <input
          type="url"
          id="virtualTour"
          value={data.virtualTour || ""}
          onChange={(e) => onChange({ virtualTour: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
          placeholder="e.g., https://my-virtual-tour.com/property"
        />
      </div>

      {/* Social Media Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700">
            YouTube Video Link (Optional)
          </label>
          <input
            type="url"
            id="youtubeUrl"
            value={data.youtubeUrl || ""}
            onChange={(e) => onChange({ youtubeUrl: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
            placeholder="e.g., https://youtube.com/watch?v=..."
          />
        </div>
        <div>
          <label htmlFor="tiktokUrl" className="block text-sm font-medium text-gray-700">
            TikTok Video Link (Optional)
          </label>
          <input
            type="url"
            id="tiktokUrl"
            value={data.tiktokUrl || ""}
            onChange={(e) => onChange({ tiktokUrl: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
            placeholder="e.g., https://tiktok.com/@user/video/..."
          />
        </div>
        <div>
          <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700">
            Facebook Video Link (Optional)
          </label>
          <input
            type="url"
            id="facebookUrl"
            value={data.facebookUrl || ""}
            onChange={(e) => onChange({ facebookUrl: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
            placeholder="e.g., https://facebook.com/watch/?v=..."
          />
        </div>
      </div>
    </div>
  );
}

