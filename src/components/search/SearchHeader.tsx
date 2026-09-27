/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { FaSearch, FaMapMarkerAlt, FaBed, FaChevronDown } from 'react-icons/fa';
import {
  buildInventorySlug,
  normalizePathSegment,
  parseInventorySlug,
} from '@/lib/search/searchUrl';

export default function SearchHeader() {
  const navigation = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const routeInventory =
    (params?.type as string) || (params?.category as string) || '';
  const parsedInventory = routeInventory
    ? parseInventorySlug(routeInventory)
    : null;
  const inventorySlug =
    parsedInventory?.inventorySlug ||
    buildInventorySlug({ listingType: 'sale' });
  const location = searchParams?.get('location') || '';
  const bedrooms = searchParams?.get('bedrooms') || '';

  const [searchLocation, setSearchLocation] = useState(location);
  const [searchBedrooms, setSearchBedrooms] = useState(bedrooms);
  
  const handleSearch = () => {
    let url = `/${inventorySlug}`;
    
    if (searchLocation) {
      url += `/${normalizePathSegment(searchLocation)}`;
      
      if (searchBedrooms) {
        url += searchBedrooms === 'studio'
          ? '/studio'
          : `/${searchBedrooms}-bedroom`;
      }
    }
    
    navigation.push(url);
  };

  const categoryTitle = inventorySlug === 'properties-for-sale' ? 'Properties for Sale' :
                       inventorySlug === 'properties-for-rent' ? 'Properties for Rent' :
                       'Properties for Airbnb';

  const formattedCategory = categoryTitle;
  const formattedLocation = location ? ` in ${location.replace(/-/g, ' ')}` : '';
  const formattedBedrooms = bedrooms ? ` with ${bedrooms} bedroom${bedrooms === '1' ? '' : 's'}` : '';

  return (
    <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <h1 className="text-2xl font-bold text-[#514f63] whitespace-nowrap">
            {formattedCategory}{formattedLocation}{formattedBedrooms}
          </h1>
          
          <div className="flex-1 w-full">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:border-transparent"
                />
                <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              
              <div className="relative w-48">
                <select
                  value={searchBedrooms}
                  onChange={(e) => setSearchBedrooms(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:border-transparent"
                >
                  <option value="">Any Bedrooms</option>
                  <option value="studio">Studio</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4 Bedrooms</option>
                  <option value="5">5+ Bedrooms</option>
                </select>
                <FaBed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#514f63] transition-colors focus:outline-none focus:ring-2 focus:ring-[#468AD1] focus:ring-offset-2"
              >
                <FaSearch />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
