'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiHeart, FiShare2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import FavoritesGrid from '@/components/favorites/FavoritesGrid';
import FavoritesFilters from '@/components/favorites/FavoritesFilters';
import {
  fetchFavoriteProperties,
  removeFavoriteProperty,
  subscribeToFavoriteUpdates,
} from '@/lib/favorites';
import type { FavoriteProperty } from '@/lib/favorites';

interface FavoriteFilters {
  propertyType: string;
  location: string;
  priceRange: string;
  status: string;
}

function matchesPriceRange(price: number, priceRange: string): boolean {
  if (!priceRange) {
    return true;
  }

  if (priceRange.endsWith('+')) {
    return price >= (Number(priceRange.replace('+', '')) || 0);
  }

  const [minValue, maxValue] = priceRange.split('-');
  const minPrice = Number(minValue) || 0;
  const maxPrice = maxValue ? Number(maxValue) : Number.POSITIVE_INFINITY;

  return price >= minPrice && price <= maxPrice;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [filters, setFilters] = useState<FavoriteFilters>({
    propertyType: '',
    location: '',
    priceRange: '',
    status: '',
  });

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchFavoriteProperties();
      setFavorites(data.properties);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load favorites');
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();

    return subscribeToFavoriteUpdates(loadFavorites);
  }, [loadFavorites]);

  const filteredProperties = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = favorites.filter((property) => {
      const matchesSearch =
        !normalizedQuery ||
        property.title.toLowerCase().includes(normalizedQuery) ||
        property.location.toLowerCase().includes(normalizedQuery);
      const matchesType =
        !filters.propertyType ||
        property.type.toLowerCase().includes(filters.propertyType);
      const matchesLocation =
        !filters.location ||
        property.location.toLowerCase().includes(filters.location);
      const matchesStatus = !filters.status || property.status === filters.status;

      return (
        matchesSearch &&
        matchesType &&
        matchesLocation &&
        matchesPriceRange(property.price, filters.priceRange) &&
        matchesStatus
      );
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'date-asc':
          return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
        case 'date-desc':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        default:
          return 0;
      }
    });
  }, [favorites, filters, searchQuery, sortBy]);

  const availableCount = favorites.filter(
    (property) => property.status === 'available'
  ).length;

  const handleRemove = (id: string) => {
    const property = favorites.find((favorite) => favorite.id === id);
    setFavorites((current) => current.filter((favorite) => favorite.id !== id));

    removeFavoriteProperty(id)
      .then(() => {
        toast.success(
          property ? `${property.title} removed from favorites` : 'Property removed'
        );
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'Unable to remove favorite');
        loadFavorites();
      });
  };

  const handleShare = async (id: string) => {
    const property = favorites.find((favorite) => favorite.id === id);
    if (!property) {
      return;
    }

    const shareUrl = `${window.location.origin}${property.url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this property: ${property.title} in ${property.location}`,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Property link copied');
    } catch (error) {
      console.error('Unable to copy property link:', error);
      toast.error('Unable to copy property link');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Favorites</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your favorite properties
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FiHeart className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Favorites</p>
              <h3 className="text-xl font-semibold text-gray-900">
                {favorites.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiShare2 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available Properties</p>
              <h3 className="text-xl font-semibold text-gray-900">
                {availableCount}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <FavoritesFilters
        onSearch={setSearchQuery}
        onFilter={setFilters}
        onSort={setSortBy}
      />

      {isLoading ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <div className="h-10 w-10 rounded-full border-2 border-[#468AD1] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading favorites...</p>
        </div>
      ) : filteredProperties.length > 0 ? (
        <FavoritesGrid
          properties={filteredProperties}
          onRemove={handleRemove}
          onShare={handleShare}
        />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <FiHeart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">
            No favorite properties yet
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tap the heart on a listing to save it here.
          </p>
        </div>
      )}
    </div>
  );
}
