'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiMapPin,
  FiArrowRight,
  FiArrowLeft,
  FiUsers,
  FiShield,
  FiAward,
  FiStar,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
} from 'react-icons/fi';

/* ──────────── Types ──────────── */

interface SurveyorProfessional {
  id: string;
  professionalType: string;
  businessName: string;
  profileImageUrl: string | null;
  location: string;
  specializations: string[];
  serviceAreas: string[];
  hourlyRate: number | null;
  consultationFee: number | null;
  availableOnline: boolean;
  availabilityStatus: string;
  averageRating: number;
  totalReviews: number;
  totalJobs: number;
  bio: string | null;
  userName: string | null;
  createdAt: string;
}

/* ──────────── Animation Variants ──────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ──────────── Professional Card ──────────── */

function ProfessionalCard({ professional }: { professional: SurveyorProfessional }) {
  const specIcons: Record<string, React.ReactNode> = {
    SURVEYOR: <FiAward className="w-4 h-4" />,
    LEGAL: <FiShield className="w-4 h-4" />,
    BOTH: <FiAward className="w-4 h-4" />,
  };

  return (
    <Link href={`/surveyors-legal/professionals/${professional.id}`} className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#514f63] to-[#3d3b4e] flex items-center justify-center text-white text-lg font-bold flex-shrink-0 overflow-hidden">
          {professional.profileImageUrl ? (
            <img
              src={professional.profileImageUrl}
              alt={professional.businessName}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            professional.businessName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate group-hover:text-[#468AD1] transition-colors">
            {professional.businessName}
          </h3>
          <p className="text-sm text-gray-500 truncate">{professional.userName || 'Professional'}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <FiMapPin className="w-3 h-3" />
              {professional.location}
            </span>
          </div>
        </div>
        {professional.availableOnline && (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Online
          </span>
        )}
      </div>

      {/* Type badge & rating */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 bg-[#514f63]/10 text-[#514f63] text-xs font-semibold px-2.5 py-1 rounded-lg">
          {specIcons[professional.professionalType] || <FiAward className="w-4 h-4" />}
          {professional.professionalType === 'SURVEYOR' && 'Surveyor'}
          {professional.professionalType === 'LEGAL' && 'Legal Professional'}
          {professional.professionalType === 'BOTH' && 'Surveyor & Legal'}
        </span>
        {professional.averageRating > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
            <FiStar className="w-3.5 h-3.5 fill-amber-400" />
            {professional.averageRating.toFixed(1)}
            <span className="text-gray-400 font-normal">({professional.totalReviews})</span>
          </span>
        )}
      </div>

      {/* Bio */}
      {professional.bio && (
        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
          {professional.bio}
        </p>
      )}

      {/* Specializations */}
      {professional.specializations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {professional.specializations.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg"
            >
              {spec}
            </span>
          ))}
          {professional.specializations.length > 3 && (
            <span className="text-gray-400 text-xs px-2 py-1">
              +{professional.specializations.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Service areas */}
      {professional.serviceAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {professional.serviceAreas.slice(0, 3).map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 text-xs px-2 py-0.5 rounded"
            >
              <FiMapPin className="w-3 h-3" />
              {area}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {professional.hourlyRate && (
            <span className="font-semibold text-gray-900">
              KES {professional.hourlyRate.toLocaleString()}/hr
            </span>
          )}
          {professional.totalJobs > 0 && (
            <span>{professional.totalJobs} jobs</span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {professional.consultationFee
            ? `KES ${professional.consultationFee.toLocaleString()} consult`
            : 'Free consult'}
        </span>
      </div>
    </Link>
  );
}

/* ──────────── Main Page Component ──────────── */

function ProfessionalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [professionals, setProfessionals] = useState<SurveyorProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const currentPage = Math.max(Number(searchParams.get('page') || 1), 1);
  const searchQuery = searchParams.get('search') || '';
  const locationFilter = searchParams.get('location') || '';
  const typeFilter = searchParams.get('type') || 'ALL';
  const specializationFilter = searchParams.get('specialization') || '';

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localLocation, setLocalLocation] = useState(locationFilter);
  const [localType, setLocalType] = useState(typeFilter);
  const [localSpec, setLocalSpec] = useState(specializationFilter);

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '12');
      if (searchQuery) params.set('search', searchQuery);
      if (locationFilter) params.set('location', locationFilter);
      if (typeFilter && typeFilter !== 'ALL') params.set('professionalType', typeFilter);
      if (specializationFilter) params.set('specialization', specializationFilter);

      const res = await fetch(`/api/surveyors?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProfessionals(data.surveyors || []);
        setTotal(data.total || 0);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load professionals', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, locationFilter, typeFilter, specializationFilter]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'ALL') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    if (updates.search !== undefined || updates.location !== undefined || updates.type !== undefined || updates.specialization !== undefined) {
      params.delete('page');
    }
    router.push(`/surveyors-legal/professionals?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({
      search: localSearch,
      location: localLocation,
      type: localType,
      specialization: localSpec,
    });
  };

  const clearFilters = () => {
    setLocalSearch('');
    setLocalLocation('');
    setLocalType('ALL');
    setLocalSpec('');
    router.push('/surveyors-legal/professionals');
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/surveyors-legal/professionals?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = searchQuery || locationFilter || (typeFilter && typeFilter !== 'ALL') || specializationFilter;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#514f63] via-[#454358] to-[#3d3b4e] text-white pt-28 pb-12 sm:pt-32 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Link
              href="/surveyors-legal"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Due Diligence Services
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <FiUsers className="w-6 h-6 text-[#468AD1]" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold">
                    Our Vetted Partners
                  </h1>
                  <p className="text-white/60 text-sm">
                    Verified surveyors, legal experts & valuers in our network
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Search & Filters */}
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onSubmit={handleSearch}
              className="mt-8 bg-white rounded-2xl p-4 sm:p-5 shadow-xl"
            >
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search by name, specialization..."
                    className="w-full pl-11 pr-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all text-sm"
                  />
                </div>
                <div className="flex-1 relative">
                  <FiMapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={localLocation}
                    onChange={(e) => setLocalLocation(e.target.value)}
                    placeholder="Location..."
                    className="w-full pl-11 pr-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all text-sm"
                  />
                </div>
                <select
                  value={localType}
                  onChange={(e) => setLocalType(e.target.value)}
                  className="px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all text-sm"
                >
                  <option value="ALL">All Types</option>
                  <option value="SURVEYOR">Surveyors</option>
                  <option value="LEGAL">Legal Professionals</option>
                  <option value="BOTH">Surveyor & Legal</option>
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-[#468AD1] text-white rounded-xl hover:bg-[#2F6FAE] transition-all duration-200 font-semibold text-sm whitespace-nowrap shadow-lg shadow-[#468AD1]/20 disabled:opacity-60 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <FiFilter className="w-4 h-4 mr-2" />
                      Filter
                    </>
                  )}
                </button>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-gray-500">Active filters:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 bg-[#468AD1]/10 text-[#468AD1] text-xs font-medium px-2.5 py-1 rounded-lg">
                      Search: {searchQuery}
                    </span>
                  )}
                  {locationFilter && (
                    <span className="inline-flex items-center gap-1 bg-[#514f63]/10 text-[#514f63] text-xs font-medium px-2.5 py-1 rounded-lg">
                      Location: {locationFilter}
                    </span>
                  )}
                  {typeFilter && typeFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                      Type: {typeFilter}
                    </span>
                  )}
                  {specializationFilter && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                      Spec: {specializationFilter}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-red-500 font-medium transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </motion.form>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 text-sm">
                {loading ? (
                  'Loading professionals...'
                ) : (
                  <>
                    Showing <span className="font-semibold text-gray-900">{professionals.length}</span> of{' '}
                    <span className="font-semibold text-gray-900">{total}</span> partners
                  </>
                )}
              </p>
              {!loading && totalPages > 1 && (
                <p className="text-gray-500 text-xs">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>

            {/* Loading skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="flex gap-2 mt-3">
                        <div className="h-6 bg-gray-200 rounded w-16" />
                        <div className="h-6 bg-gray-200 rounded w-20" />
                        <div className="h-6 bg-gray-200 rounded w-14" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : professionals.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No partners found
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'Try adjusting your search criteria or clearing filters.'
                    : 'No verified partners available yet. Check back soon!'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2.5 bg-[#468AD1] text-white rounded-xl hover:bg-[#2F6FAE] transition-colors font-semibold text-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {professionals.map((pro) => (
                  <motion.div key={pro.id} variants={fadeUp}>
                    <ProfessionalCard professional={pro} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | string)[]>((acc, page, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && page - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => typeof page === 'number' ? goToPage(page) : undefined}
                      disabled={page === '...'}
                      className={`min-w-[40px] px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        page === currentPage
                          ? 'bg-[#468AD1] text-white border-[#468AD1] shadow-lg shadow-[#468AD1]/20'
                          : page === '...'
                          ? 'bg-white text-gray-400 border-gray-100 cursor-default'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA — Request Services */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
              Need Due Diligence Services?
            </h2>
            <p className="text-gray-600 mb-6">
              Submit an inquiry and VectorAfriq will match you with the right verified professional for your property needs.
            </p>
            <Link
              href="/surveyors-legal#inquiry-form"
              className="inline-flex items-center px-8 py-3.5 bg-[#468AD1] text-white rounded-xl hover:bg-[#2F6FAE] transition-all duration-200 font-semibold shadow-lg shadow-[#468AD1]/20"
            >
              <FiMessageSquare className="mr-2 w-5 h-5" />
              Submit Inquiry
              <FiArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ──────────── Page Export with Suspense ──────────── */

export default function ProfessionalsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#468AD1]" />
            Loading professionals...
          </div>
        </div>
      }
    >
      <ProfessionalsContent />
    </Suspense>
  );
}
