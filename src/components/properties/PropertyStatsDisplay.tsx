"use client";

interface PropertyStatsDisplayProps {
  stats: Record<string, number>;
}

export default function PropertyStatsDisplay({
  stats,
}: PropertyStatsDisplayProps) {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Available Properties</h3>
      <div className="space-y-3">
        {Object.entries(stats).map(([category, count]) => (
          <div key={category} className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-gray-600">{category}</span>
            <span className="ml-auto text-gray-900 font-medium">
              {formatNumber(count)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
