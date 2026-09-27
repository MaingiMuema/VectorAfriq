'use client';

import { useState } from 'react';
import { FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi';
import { Location } from '@/types/location';

interface LocationCardProps {
  location: Location;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  children?: React.ReactNode;
}

export default function LocationCard({ location, onEdit, onDelete, children }: LocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      id={`location-${location.id}`}
      className="bg-white rounded-lg shadow-md p-4 mb-4 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FiMapPin className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold">{location.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{location.type}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(location)}
            className="p-2 text-gray-600 hover:text-red-500 transition-colors"
          >
            <FiEdit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(location)}
            className="p-2 text-gray-600 hover:text-red-500 transition-colors"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      {children && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-gray-500 hover:text-red-500"
          >
            {isExpanded ? 'Hide' : 'Show'} sub-locations
          </button>
          {isExpanded && <div className="mt-4 ml-6">{children}</div>}
        </>
      )}
    </div>
  );
}
