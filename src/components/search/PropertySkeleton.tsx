interface PropertySkeletonProps {
  count?: number;
}

export default function PropertySkeleton({ count = 6 }: PropertySkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border animate-pulse">
          {/* Image Skeleton */}
          <div className="relative h-64 bg-gray-200" />

          {/* Content Skeleton */}
          <div className="p-6">
            {/* Tags */}
            <div className="flex gap-2 mb-4">
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
            </div>

            {/* Title */}
            <div className="h-7 bg-gray-200 rounded mb-4" />

            {/* Location */}
            <div className="h-5 w-2/3 bg-gray-200 rounded mb-4" />

            {/* Features */}
            <div className="flex gap-4 mb-4">
              <div className="h-5 w-20 bg-gray-200 rounded" />
              <div className="h-5 w-20 bg-gray-200 rounded" />
              <div className="h-5 w-20 bg-gray-200 rounded" />
            </div>

            {/* Price and Button */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <div className="h-4 w-16 bg-gray-200 rounded mb-1" />
                <div className="h-6 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-10 w-28 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
