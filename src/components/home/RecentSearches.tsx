'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IoClose } from 'react-icons/io5';

interface RecentSearch {
  id: number;
  text: string;
  link: string;
}

const recentSearches: RecentSearch[] = [];

const RecentSearches = () => {
  const [searches, setSearches] = useState<RecentSearch[]>(recentSearches);

  const removeSearch = (id: number) => {
    setSearches(searches.filter(search => search.id !== id));
  };

  if (searches.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#514f63]">Your Recent Searches</h2>
          {searches.length > 0 && (
            <button
              onClick={() => setSearches([])}
              className="text-sm text-[#468AD1] hover:text-[#468AD1]/80 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {searches.map((search) => (
            <div
              key={search.id}
              className="group flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 hover:border-[#468AD1] transition-colors"
            >
              <Link
                href={search.link}
                className="text-sm text-[#514f63] hover:text-[#468AD1] transition-colors mr-2"
              >
                {search.text}
              </Link>
              <button
                onClick={() => removeSearch(search.id)}
                className="text-gray-400 hover:text-[#468AD1] transition-colors"
              >
                <IoClose size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentSearches;
