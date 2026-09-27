"use client";

import { FaFacebook, FaYoutube } from 'react-icons/fa';

export default function SocialFollowLinks() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-semibold text-gray-900 mb-3">
        Follow VectorAfriq
      </h3>
      <div className="flex gap-3">
        <a
          href="https://www.facebook.com/p/Property-Finder-KE-100063636204360/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-[#468AD1]"
        >
          <FaFacebook size={20} />
        </a>
        <a
          href="https://www.youtube.com/@vectorafriqproperties"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-[#468AD1]"
        >
          <FaYoutube size={20} />
        </a>
      </div>
    </div>
  );
}
