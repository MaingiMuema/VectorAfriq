"use client";

import { getCategoryLabel } from "@/lib/search/searchUrl";

interface CategoryFilterButtonsProps {
  categories: Array<[string, number]>;
  selectedCategory?: string | null;
  onCategoryClick?: (category: string) => void;
}

export default function CategoryFilterButtons({
  categories,
  selectedCategory,
  onCategoryClick,
}: CategoryFilterButtonsProps) {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div className="w-full mb-5">
      <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-x-visible">
        {categories.map(([category, count]) => (
          <button
            key={category}
            onClick={() => onCategoryClick?.(category)}
            className={`text-sm px-4 py-2 border rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
              selectedCategory === category
                ? "bg-[#468AD1] text-white border-[#468AD1] hover:bg-[#468AD1]/90"
                : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600"
            }`}
          >
            {getCategoryLabel(category)} ({formatNumber(count as number)})
          </button>
        ))}
        {selectedCategory && (
          <button
            onClick={() => onCategoryClick?.(selectedCategory)}
            className="text-sm px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md text-red-600 transition-colors whitespace-nowrap flex-shrink-0"
          >
            Clear Filter
          </button>
        )}
      </div>
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
        div {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
