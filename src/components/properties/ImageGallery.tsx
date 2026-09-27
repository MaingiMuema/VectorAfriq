"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight, FaTimes, FaExpand, FaPlay } from "react-icons/fa";

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

interface MediaGalleryProps {
  images: string[];
  videos?: string[];
  title: string;
}

export default function ImageGallery({ images, videos = [], title }: MediaGalleryProps) {
  // Combine media items with videos first as requested ("videos start and auto play")
  const media: MediaItem[] = [
    ...videos.map(v => ({ type: 'video' as const, url: v })),
    ...images.map(i => ({ type: 'image' as const, url: i }))
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && media[currentIndex].type === 'video') {
      videoRef.current.play().catch(err => console.log("Autoplay blocked:", err));
    }
  }, [currentIndex, media]);

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const nextFullscreen = () => {
    setFullscreenIndex((prev) => (prev + 1) % media.length);
  };

  const prevFullscreen = () => {
    setFullscreenIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setFullscreenOpen(true);
  };

  if (!media || media.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No media available</p>
      </div>
    );
  }

  const currentItem = media[currentIndex];

  return (
    <div className="relative">
      {/* Main Display Area */}
      <div className="relative w-full overflow-hidden bg-black rounded-lg" style={{ aspectRatio: "16/9" }}>
        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 p-3 rounded-full text-white z-10 transition-all"
              onClick={prevMedia}
              aria-label="Previous"
            >
              <FaChevronLeft className="w-6 h-6" />
            </button>
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 p-3 rounded-full text-white z-10 transition-all"
              onClick={nextMedia}
              aria-label="Next"
            >
              <FaChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {currentItem.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentItem.url}
            className="w-full h-full object-contain"
            controls
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <Image
            src={currentItem.url}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="rounded-lg object-cover cursor-pointer"
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            quality={85}
            priority
            onClick={() => openFullscreen(currentIndex)}
          />
        )}

        {/* Overlay Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            className="bg-black bg-opacity-50 hover:bg-opacity-70 p-2 rounded-full text-white transition-all z-20"
            onClick={() => openFullscreen(currentIndex)}
            aria-label="View fullscreen"
          >
            <FaExpand className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute bottom-4 right-4 z-20">
          <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">
            {currentIndex + 1} / {media.length}
          </span>
        </div>
      </div>

      {/* Scrollable Thumbnail Grid */}
      {media.length > 1 && (
        <div className="mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {media.map((item, index) => (
              <div
                key={index}
                className={`flex-shrink-0 relative w-24 h-16 cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${index === currentIndex
                    ? 'border-red-500 ring-2 ring-red-200'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => setCurrentIndex(index)}
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                    <video src={item.url} className="w-full h-full object-cover opacity-50" />
                    <FaPlay className="absolute text-white text-xs" />
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={`${title} thumbnail ${index + 1}`}
                    className="object-cover"
                    fill
                    sizes="96px"
                    quality={60}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreenOpen && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center">
          <button
            onClick={() => setFullscreenOpen(false)}
            className="absolute top-4 right-4 z-[110] bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-full text-white transition-all"
          >
            <FaTimes className="w-6 h-6" />
          </button>

          {media.length > 1 && (
            <>
              <button
                onClick={prevFullscreen}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 p-4 rounded-full text-white z-[110]"
              >
                <FaChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={nextFullscreen}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 p-4 rounded-full text-white z-[110]"
              >
                <FaChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="relative w-full h-full flex items-center justify-center p-4">
            {media[fullscreenIndex].type === 'video' ? (
              <video
                src={media[fullscreenIndex].url}
                className="max-w-full max-h-full"
                controls
                autoPlay
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={media[fullscreenIndex].url}
                  alt={`${title} - ${fullscreenIndex + 1}`}
                  className="object-contain"
                  fill
                  sizes="100vw"
                  quality={90}
                />
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
            {fullscreenIndex + 1} / {media.length}
          </div>
        </div>
      )}
    </div>
  );
}
