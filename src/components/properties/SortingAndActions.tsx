"use client";

import { FaHeart } from "react-icons/fa";

export default function SortingAndActions() {
  return (
    <div className="flex items-center gap-4 mt-4 md:mt-0">
      <select className="px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
        <option value="featured">Featured</option>
        <option value="newest">Newest</option>
        <option value="price-low">Price (Low to High)</option>
        <option value="price-high">Price (High to Low)</option>
      </select>
      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
        <FaHeart className="w-5 h-5" />
        <span>Save Search</span>
      </button>
    </div>
  );
}
