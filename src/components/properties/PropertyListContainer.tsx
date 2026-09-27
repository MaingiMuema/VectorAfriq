"use client";

import { Property } from "@/types";
import PropertyListView from "./PropertyListView";

interface PropertyListContainerProps {
  properties: Property[];
}

export default function PropertyListContainer({
  properties,
}: PropertyListContainerProps) {
  return (
    <>
      <div className="space-y-6">
        {properties.map((property, index) => (
          <PropertyListView
            key={property.id}
            property={property}
            priority={index < 2}
          />
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No properties found
          </h3>
          <p className="text-gray-600">
            We couldn&apos;t find any properties matching your criteria.
          </p>
        </div>
      )}
    </>
  );
}
