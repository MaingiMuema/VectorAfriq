"use client";

import { useEffect, useState } from "react";

interface PropertyLoadingOverlayProps {
  message?: string;
}

const PropertyLoadingOverlay = ({
  message = "Loading Resources"
}: PropertyLoadingOverlayProps) => {
  const [dots, setDots] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Progress animation - simulates loading progress
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const newElapsed = Date.now() - startTime;
      setElapsed(newElapsed);

      // Smooth progress that slows down as it approaches 95%
      // Uses logarithmic curve for natural feel
      const progressPercent = Math.min(95,
        (1 - Math.exp(-newElapsed / 5000)) * 100
      );
      setProgress(progressPercent);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Dynamic message based on elapsed time
  const getStatusMessage = () => {
    if (elapsed < 2000) return "Please wait";
    if (elapsed < 4000) return "Loading content...";
    if (elapsed < 7000) return "Almost there...";
    return "Just a moment more...";
  };

  return (
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm px-6">
        {/* Animated Spinner */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 border-4 border-[#468AD1]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-[#468AD1] rounded-full animate-spin"></div>
          <div
            className="absolute inset-2 border-4 border-transparent border-t-[#468AD1]/60 rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1s" }}
          ></div>
          {/* Progress percentage in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-[#514f63]">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#468AD1] to-[#ff6b7a] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-lg font-semibold text-[#514f63]">
            {message}{".".repeat(dots)}
          </p>
          <p className="text-sm text-gray-500">
            {getStatusMessage()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PropertyLoadingOverlay;
