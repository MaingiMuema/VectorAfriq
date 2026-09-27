'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaSearch, FaPhone, FaEnvelope, FaWhatsapp, FaMapMarkerAlt } from 'react-icons/fa';
import AgentBadge from '@/components/properties/AgentBadge';
import AgentAvatar from '@/components/properties/AgentAvatar';
import type { BadgeTier } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  specialization: string[];
  languages: string[];
  socialMedia: Record<string, string>;
  properties_count: number;
  badgeTier: BadgeTier;
  createdAt: string;
}

interface AgentsResponse {
  agents: Agent[];
  total: number;
  pages: number;
}

interface LocationStat {
  location: string;
  count: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [total, setTotal] = useState(0);

  const [topLocations, setTopLocations] = useState<LocationStat[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationFieldRef = useRef<HTMLDivElement>(null);

  const debouncedLocationQuery = useDebounce(locationQuery, 400);

  // Fetch top 5 locations (by listing count) the first time the location field is used
  const loadTopLocations = async () => {
    if (topLocations.length > 0 || locationsLoading) return;
    try {
      setLocationsLoading(true);
      const response = await fetch('/api/agents/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data: { locations: LocationStat[] } = await response.json();
      setTopLocations(data.locations);
    } catch {
      setTopLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  };

  // Close the location suggestions dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationFieldRef.current && !locationFieldRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        if (debouncedLocationQuery) {
          params.append('location', debouncedLocationQuery);
        }

        const response = await fetch(`/api/agents?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }

        const data: AgentsResponse = await response.json();
        setAgents(data.agents);
        setTotal(data.total);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [searchQuery, debouncedLocationQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b mt-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Your Property Agent</h1>
          <p className="mt-2 text-lg text-gray-600">
            Connect with experienced real estate agents in your area
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Agents</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-12 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                />
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Location Filter */}
            <div className="relative" ref={locationFieldRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by location"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onClick={() => {
                    setShowLocationSuggestions(true);
                    loadTopLocations();
                  }}
                  onFocus={() => {
                    setShowLocationSuggestions(true);
                    loadTopLocations();
                  }}
                  className="w-full px-4 py-2.5 pl-12 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
                />
                <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {showLocationSuggestions && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-400 bg-gray-50">
                    Top Locations
                  </div>
                  {locationsLoading && (
                    <div className="px-4 py-3 text-sm text-gray-500">Loading locations...</div>
                  )}
                  {!locationsLoading && topLocations.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">No locations found</div>
                  )}
                  {!locationsLoading && topLocations.map((loc) => (
                    <button
                      key={loc.location}
                      type="button"
                      onClick={() => {
                        setLocationQuery(loc.location);
                        setShowLocationSuggestions(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-400" />
                        {loc.location}
                      </span>
                      <span className="text-xs text-gray-400">{loc.count} listings</span>
                    </button>
                  ))}
                  {locationQuery && (
                    <button
                      type="button"
                      onClick={() => setShowLocationSuggestions(false)}
                      className="w-full px-4 py-2 text-left text-sm text-[#468AD1] border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      Search for &quot;{locationQuery}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#468AD1]"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Agents Found */}
        {!loading && !error && agents.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-2">No agents found</p>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Agents Grid */}
        {!loading && !error && agents.length > 0 && (
          <>
            <div className="mb-4">
              <p className="text-gray-600">
                Showing {agents.length} of {total} agents
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <Link href={`/agents/${agent.id}`} className="block group">
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <AgentAvatar name={agent.name} avatar={agent.avatar} />
                    </div>
                    <div className="px-6 pt-6">
                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#468AD1] transition-colors">{agent.name}</h2>
                          <AgentBadge tier={agent.badgeTier} size="sm" />
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {agent.bio && (
                          <div className="text-gray-600 text-sm">
                            {agent.bio.length > 100 ? `${agent.bio.substring(0, 100)}...` : agent.bio}
                          </div>
                        )}
                        <div className="text-gray-600">
                          <span className="font-medium">Specialization:</span>{' '}
                          {agent.specialization.length > 0 ? agent.specialization.join(', ') : 'General Properties'}
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">Properties:</span> {agent.properties_count} listings
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">Languages:</span> {agent.languages.join(', ')}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="px-6 pb-6 space-y-2">
                    {agent.phone && (
                      <Link
                        href={`tel:${agent.phone}`}
                        className="flex items-center justify-center w-full px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors"
                      >
                        <FaPhone className="mr-2" />
                        Call Agent
                      </Link>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`mailto:${agent.email}`}
                        className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <FaEnvelope className="mr-2" />
                        Email
                      </Link>
                      {agent.phone && (
                        <Link
                          href={`https://wa.me/${agent.phone.replace(/\s+/g, '').replace(/^\+/, '')}`}
                          className="flex items-center justify-center px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
                        >
                          <FaWhatsapp className="mr-2" />
                          WhatsApp
                        </Link>
                      )}
                    </div>
                    <Link
                      href={`/agents/${agent.id}`}
                      className="flex items-center justify-center w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      View Full Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}