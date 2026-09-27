"use client";

import { formatNumber } from "@/utils/format";

interface FilterButtonsProps {
  stats: Record<string, number>;
}

export default function FilterButtons({ stats }: FilterButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {Object.entries(stats).map(([category, count]) => (
        <button
          key={category}
          className="text-sm px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-gray-600 transition-colors"
        >
          {category} ({formatNumber(count)})
        </button>
      ))}
    </div>
  );
}
