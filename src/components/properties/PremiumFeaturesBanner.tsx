"use client";

import Link from "next/link";

export default function PremiumFeaturesBanner() {
  return (
    <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Premium Features</h3>
        <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-semibold rounded-full">
          PRO
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-white/90">
          <div className="p-2 bg-white/10 rounded-lg">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium">Virtual Tours Available</p>
            <p className="text-sm text-white/70">
              Experience properties from anywhere
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-white/90">
          <div className="p-2 bg-white/10 rounded-lg">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium">24/7 Support</p>
            <p className="text-sm text-white/70">
              Get help whenever you need it
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-white/90">
          <div className="p-2 bg-white/10 rounded-lg">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium">Verified Listings</p>
            <p className="text-sm text-white/70">
              All properties are thoroughly vetted
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/premium"
        className="block w-full mt-6 px-4 py-2.5 bg-white text-gray-900 rounded-lg font-medium hover:bg-white/90 transition-colors text-center"
      >
        Upgrade to Premium
      </Link>
    </div>
  );
}
