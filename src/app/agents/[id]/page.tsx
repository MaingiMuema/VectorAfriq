'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FaArrowLeft,
  FaArrowRight,
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaHome,
  FaGlobeAmericas,
  FaExclamationCircle,
} from 'react-icons/fa';
import AgentBadge from '@/components/properties/AgentBadge';
import AgentAvatar from '@/components/properties/AgentAvatar';
import { getPropertyUrl } from '@/lib/propertyCache';
import { processImageUrl } from '@/lib/imageUtils';
import type { BadgeTier, Property } from '@/types';

interface AgentDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
  specialization: string[];
  languages: string[];
  socialMedia: Record<string, string>;
  badgeTier: BadgeTier;
  createdAt: string;
  propertiesCount: number;
  availableCount: number;
}

interface ListingsResponse {
  properties: Property[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const LISTINGS_PER_PAGE = 12;

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentError, setAgentError] = useState('');

  const [listings, setListings] = useState<Property[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsTotalPages, setListingsTotalPages] = useState(1);
  const [listingsTotal, setListingsTotal] = useState(0);
  const listingsSectionRef = useRef<HTMLDivElement>(null);
  const scrollOnNextLoad = useRef(false);

  const goToListingsPage = (page: number) => {
    scrollOnNextLoad.current = true;
    setListingsPage(page);
  };

  useEffect(() => {
    if (!id) return;

    const fetchAgent = async () => {
      setAgentLoading(true);
      setAgentError('');
      try {
        const res = await fetch(`/api/agents/${id}`);
        if (!res.ok) throw new Error('Agent not found');
        const data = await res.json();
        setAgent(data.agent);
      } catch (err) {
        setAgentError(err instanceof Error ? err.message : 'Failed to load agent');
      } finally {
        setAgentLoading(false);
      }
    };

    fetchAgent();
  }, [id]);

  const fetchListings = useCallback(async () => {
    if (!id) return;
    setListingsLoading(true);
    try {
      const res = await fetch(`/api/agents/${id}/listings?page=${listingsPage}&limit=${LISTINGS_PER_PAGE}`);
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data: ListingsResponse = await res.json();
      setListings(data.properties);
      setListingsTotalPages(data.pagination.totalPages);
      setListingsTotal(data.pagination.totalItems);
    } catch {
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  }, [id, listingsPage]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Scroll only after the new page's content has actually committed to the
  // DOM (listingsLoading flipping to false) — doing it inside fetchListings'
  // `finally` fired too early, while the DOM still reflected the old/loading
  // layout, so the browser scrolled to a stale position.
  useEffect(() => {
    if (!listingsLoading && scrollOnNextLoad.current) {
      scrollOnNextLoad.current = false;
      listingsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [listingsLoading]);

  /* ──── Loading State ──── */
  if (agentLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-[#514f63] via-[#454358] to-[#3d3b4e] pt-28 pb-16 sm:pt-32">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto animate-pulse">
              <div className="h-4 bg-white/20 rounded w-40 mb-8" />
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 rounded-2xl bg-white/10" />
                <div className="flex-1">
                  <div className="h-8 bg-white/20 rounded w-64 mb-3" />
                  <div className="h-5 bg-white/15 rounded w-40 mb-2" />
                  <div className="h-4 bg-white/10 rounded w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-8 animate-pulse h-40" />
              <div className="bg-white rounded-2xl p-8 animate-pulse h-64" />
            </div>
            <div className="bg-white rounded-2xl p-8 animate-pulse h-72" />
          </div>
        </div>
      </div>
    );
  }

  /* ──── Error State ──── */
  if (agentError || !agent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-[#514f63] via-[#454358] to-[#3d3b4e] pt-28 pb-16 sm:pt-32">
          <div className="container mx-auto px-4">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              Back to Agents
            </Link>
          </div>
        </div>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <FaExclamationCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Agent Not Found</h2>
            <p className="text-gray-500 mb-6">
              {agentError || 'The agent you are looking for does not exist or is no longer available.'}
            </p>
            <Link
              href="/agents"
              className="inline-flex items-center px-6 py-2.5 bg-[#468AD1] text-white rounded-xl hover:bg-[#2F6FAE] transition-colors font-semibold text-sm"
            >
              Browse Agents
              <FaArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const memberSince = new Date(agent.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const whatsappNumber = agent.phone ? agent.phone.replace(/\s+/g, '').replace(/^\+/, '') : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ══════════ Header / Hero ══════════ */}
      <section className="bg-gradient-to-br from-[#514f63] via-[#454358] to-[#3d3b4e] text-white pt-28 pb-12 sm:pt-32 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              Back to Agents
            </Link>

            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-white/20 flex-shrink-0 bg-white/10">
                <AgentAvatar name={agent.name} avatar={agent.avatar} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-extrabold">{agent.name}</h1>
                  <AgentBadge tier={agent.badgeTier} size="lg" />
                </div>

                <div className="flex items-center gap-4 text-white/70 text-sm mb-4 flex-wrap">
                  <span>Member since {memberSince}</span>
                </div>

                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-1.5 text-white/80">
                    <FaHome className="w-4 h-4" />
                    <span className="font-bold text-lg text-white">{agent.availableCount}</span>
                    <span className="text-sm">active listings</span>
                  </div>
                  {agent.propertiesCount !== agent.availableCount && (
                    <div className="flex items-center gap-1.5 text-white/60 text-sm">
                      <span>{agent.propertiesCount} total listings</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ Content ══════════ */}
      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ──── Left: Details + Listings ──── */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                {agent.bio ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{agent.bio}</p>
                ) : (
                  <p className="text-gray-400 italic">No bio provided.</p>
                )}
              </div>

              {/* Specialization */}
              {agent.specialization.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Specialization</h2>
                  <div className="flex flex-wrap gap-2">
                    {agent.specialization.map((spec) => (
                      <span
                        key={spec}
                        className="bg-[#514f63]/10 text-[#514f63] text-sm font-medium px-4 py-2 rounded-xl"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {agent.languages.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaGlobeAmericas className="w-5 h-5 text-[#468AD1]" />
                    Languages
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {agent.languages.map((lang) => (
                      <span
                        key={lang}
                        className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Listings */}
              <div ref={listingsSectionRef} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 scroll-mt-28">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FaHome className="w-5 h-5 text-[#468AD1]" />
                    Listings by {agent.name}
                  </h2>
                  {listingsTotal > 0 && (
                    <span className="text-sm text-gray-500">{listingsTotal} available</span>
                  )}
                </div>

                {listingsLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-gray-100 animate-pulse">
                        <div className="h-40 bg-gray-200" />
                        <div className="p-4 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                          <div className="h-4 bg-gray-200 rounded w-full" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!listingsLoading && listings.length === 0 && (
                  <div className="text-center py-10">
                    <FaHome className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">This agent has no active listings right now.</p>
                  </div>
                )}

                {!listingsLoading && listings.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {listings.map((property) => (
                        <Link
                          key={property.id}
                          href={getPropertyUrl(property.id, property.title)}
                          className="group rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="relative h-40 bg-gray-100">
                            <Image
                              src={processImageUrl(property.images[0], property.id)}
                              alt={property.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <span className="absolute top-3 left-3 bg-[#468AD1] text-white px-2.5 py-1 rounded-md text-xs font-medium">
                              For {property.type}
                            </span>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center text-gray-500 text-xs mb-1.5">
                              <FaMapMarkerAlt className="mr-1 text-[#468AD1] flex-shrink-0" />
                              <span className="truncate">{property.location}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-[#468AD1] transition-colors">
                              {property.title}
                            </h3>
                            <p className="text-[#468AD1] font-bold text-sm mb-2">
                              KES {property.price.toLocaleString()}
                              {property.type.toLowerCase() === 'rent' ? '/mo' : ''}
                            </p>
                            <div className="flex items-center gap-3 text-gray-500 text-xs border-t pt-2">
                              {property.bedrooms > 0 && (
                                <span className="flex items-center gap-1">
                                  <FaBed /> {property.bedrooms}
                                </span>
                              )}
                              {property.bathrooms > 0 && (
                                <span className="flex items-center gap-1">
                                  <FaBath /> {property.bathrooms}
                                </span>
                              )}
                              {property.size > 0 && (
                                <span className="flex items-center gap-1">
                                  <FaRulerCombined /> {property.size} m2
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {listingsTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 mt-8">
                        <button
                          type="button"
                          disabled={listingsPage <= 1}
                          onClick={() => goToListingsPage(Math.max(1, listingsPage - 1))}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          <FaArrowLeft className="w-3.5 h-3.5" />
                          Prev
                        </button>
                        <span className="text-sm text-gray-500">
                          Page {listingsPage} of {listingsTotalPages}
                        </span>
                        <button
                          type="button"
                          disabled={listingsPage >= listingsTotalPages}
                          onClick={() => goToListingsPage(Math.min(listingsTotalPages, listingsPage + 1))}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Next
                          <FaArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ──── Right: Sidebar ──── */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-28">
                <h3 className="font-bold text-gray-900 mb-4">Contact {agent.name.split(' ')[0]}</h3>
                <div className="space-y-3">
                  {agent.phone && (
                    <Link
                      href={`tel:${agent.phone}`}
                      className="flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-[#468AD1] text-white rounded-xl hover:bg-[#2F6FAE] transition-colors font-semibold text-sm"
                    >
                      <FaPhone className="w-4 h-4" />
                      Call Agent
                    </Link>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`mailto:${agent.email}`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm"
                    >
                      <FaEnvelope className="w-4 h-4" />
                      Email
                    </Link>
                    {agent.phone && (
                      <Link
                        href={`https://wa.me/${whatsappNumber}`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] transition-colors font-semibold text-sm"
                      >
                        <FaWhatsapp className="w-4 h-4" />
                        WhatsApp
                      </Link>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  {agent.phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FaPhone className="w-4 h-4 text-gray-400" />
                      {agent.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <FaEnvelope className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{agent.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ Back CTA ══════════ */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4 text-center">
          <Link
            href="/agents"
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm"
          >
            <FaArrowLeft className="mr-2 w-4 h-4" />
            Browse All Agents
          </Link>
        </div>
      </section>
    </div>
  );
}
