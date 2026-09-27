'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiArrowRight,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiShield,
  FiAward,
  FiStar,
  FiClock,
  FiBriefcase,
  FiFileText,
  FiLoader,
  FiAlertCircle,
  FiMessageSquare,
  FiSend,
} from 'react-icons/fi';

/* ──────────── Types ──────────── */

interface Review {
  id: string;
  professionalId: string;
  userId: string | null;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
}

interface ReviewsData {
  reviews: Review[];
  total: number;
  averageRating: number;
  distribution: number[];
}

interface ProfessionalDetail {
  id: string;
  professionalType: string;
  businessName: string;
  contactPhone: string;
  contactEmail: string | null;
  licenseNumber: string | null;
  qualification: string | null;
  experience: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  location: string;
  serviceAreas: string[];
  specializations: string[];
  hourlyRate: number | null;
  consultationFee: number | null;
  availableOnline: boolean;
  availabilityStatus: string;
  averageRating: number;
  totalReviews: number;
  totalJobs: number;
  userName: string | null;
  createdAt: string;
}

/* ──────────── Animation Variants ──────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

/* ──────────── Page Component ──────────── */

function ProfessionalDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [professional, setProfessional] = useState<ProfessionalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ──── Contact form state ──── */
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');

  /* ──── Reviews state ──── */
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({
    reviewerName: '',
    reviewerEmail: '',
    rating: 5,
    title: '',
    comment: '',
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchProfessional = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/surveyors/${id}`);
        if (!res.ok) throw new Error('Professional not found');
        const data = await res.json();
        setProfessional(data.professional);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load professional');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfessional();
  }, [id]);

  /* Pre-fill contact form from session */
  useEffect(() => {
    if (session?.user) {
      const user = session.user as { name?: string; email?: string };
      setContactForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
      setReviewForm((prev) => ({
        ...prev,
        reviewerName: prev.reviewerName || user.name || '',
        reviewerEmail: prev.reviewerEmail || user.email || '',
      }));
    }
  }, [session]);

  /* ──── Fetch reviews ──── */
  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`/api/surveyors/${id}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviewsData(data);
        }
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    if (id) fetchReviews();
  }, [id, reviewSubmitted]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await fetch(`/api/surveyors/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewForm,
          userId: (session?.user as { id?: string })?.id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      setReviewSubmitted(true);
      setShowReviewForm(false);
      setReviewForm({ reviewerName: '', reviewerEmail: '', rating: 5, title: '', comment: '' });
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactError('');
    try {
      const res = await fetch('/api/surveyors/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactForm,
          serviceType: professional?.professionalType === 'LEGAL' ? 'legal-consultation' : 'property-surveying',
          location: professional?.location || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry');
      setContactSubmitted(true);
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Failed to submit inquiry');
    } finally {
      setContactSubmitting(false);
    }
  };

  /* ──── Loading State ──── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-[#514f63] via-[#454358] to-[#3d3b4e] text-white pt-28 pb-16 sm:pt-32">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto animate-pulse">
              <div className="h-4 bg-white/20 rounded w-48 mb-8" />
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/10" />
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
              <div className="bg-white rounded-2xl p-8 animate-pulse h-48" />
              <div className="bg-white rounded-2xl p-8 animate-pulse h-32" />
              <div className="bg-white rounded-2xl p-8 animate-pulse h-40" />
            </div>
            <div className="bg-white rounded-2xl p-8 animate-pulse h-96" />
          </div>
        </div>
      </div>
    );
  }

  /* ──── Error State ──── */
  if (error || !professional) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-[#514f63] via-[#454358] to-[#3d3b4e] text-white pt-28 pb-16 sm:pt-32">
          <div className="container mx-auto px-4">
            <Link
              href="/surveyors-legal/professionals"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Professionals
            </Link>
          </div>
        </div>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Professional Not Found
            </h2>
            <p className="text-gray-500 mb-6">
              {error || 'The professional you are looking for does not exist or is no longer available.'}
            </p>
            <Link
              href="/surveyors-legal/professionals"
              className="inline-flex items-center px-6 py-2.5 bg-[#468AD1] text-white rounded-xl hover:bg-[#2F6FAE] transition-colors font-semibold text-sm"
            >
              Browse Professionals
              <FiArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const specIcons: Record<string, React.ReactNode> = {
    SURVEYOR: <FiAward className="w-4 h-4" />,
    LEGAL: <FiShield className="w-4 h-4" />,
    BOTH: <FiAward className="w-4 h-4" />,
  };

  const typeLabel: Record<string, string> = {
    SURVEYOR: 'Surveyor',
    LEGAL: 'Legal Professional',
    BOTH: 'Surveyor & Legal',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ══════════ Header / Hero ══════════ */}
      <section className="bg-gradient-to-br from-[#514f63] via-[#454358] to-[#3d3b4e] text-white pt-28 pb-12 sm:pt-32 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Link
              href="/surveyors-legal/professionals"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Professionals
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row items-start gap-6"
            >
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-2 border-white/20 flex-shrink-0">
                {professional.profileImageUrl ? (
                  <img
                    src={professional.profileImageUrl}
                    alt={professional.businessName}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  professional.businessName.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-extrabold">
                    {professional.businessName}
                  </h1>
                  {professional.availableOnline && (
                    <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Available
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-white/70 text-sm mb-4 flex-wrap">
                  {professional.userName && (
                    <span>{professional.userName}</span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <FiMapPin className="w-3.5 h-3.5" />
                    {professional.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-semibold px-2.5 py-1 rounded-lg">
                    {specIcons[professional.professionalType]}
                    {typeLabel[professional.professionalType] || professional.professionalType}
                  </span>
                </div>

                {/* Rating & Stats */}
                <div className="flex items-center gap-6 flex-wrap">
                  {professional.averageRating > 0 && (
                    <div className="flex items-center gap-1.5">
                      <FiStar className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-lg">{professional.averageRating.toFixed(1)}</span>
                      <span className="text-white/50 text-sm">({professional.totalReviews} reviews)</span>
                    </div>
                  )}
                  {professional.totalJobs > 0 && (
                    <div className="flex items-center gap-1.5 text-white/60 text-sm">
                      <FiBriefcase className="w-4 h-4" />
                      <span>{professional.totalJobs} jobs completed</span>
                    </div>
                  )}
                  {professional.experience && (
                    <div className="flex items-center gap-1.5 text-white/60 text-sm">
                      <FiClock className="w-4 h-4" />
                      <span>{professional.experience} experience</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ Content ══════════ */}
      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ──── Left: Details ──── */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                {professional.bio ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{professional.bio}</p>
                ) : (
                  <p className="text-gray-400 italic">No bio provided.</p>
                )}
              </motion.div>

              {/* Specializations */}
              {professional.specializations.length > 0 && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiAward className="w-5 h-5 text-[#468AD1]" />
                    Specializations
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {professional.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="bg-[#514f63]/10 text-[#514f63] text-sm font-medium px-4 py-2 rounded-xl"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Service Areas */}
              {professional.serviceAreas.length > 0 && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiMapPin className="w-5 h-5 text-[#468AD1]" />
                    Service Areas
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {professional.serviceAreas.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl"
                      >
                        <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                        {area}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Credentials */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiFileText className="w-5 h-5 text-[#468AD1]" />
                  Credentials
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {professional.licenseNumber && (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <FiCheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">License Number</p>
                        <p className="font-semibold text-gray-900 text-sm">{professional.licenseNumber}</p>
                      </div>
                    </div>
                  )}
                  {professional.qualification && (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FiAward className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Qualification</p>
                        <p className="font-semibold text-gray-900 text-sm">{professional.qualification}</p>
                      </div>
                    </div>
                  )}
                  {professional.experience && (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <FiClock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Experience</p>
                        <p className="font-semibold text-gray-900 text-sm">{professional.experience}</p>
                      </div>
                    </div>
                  )}
                  {!professional.licenseNumber && !professional.qualification && !professional.experience && (
                    <p className="text-gray-400 italic col-span-2">No credentials provided yet.</p>
                  )}
                </div>
              </motion.div>

              {/* ══════════ Reviews Section ══════════ */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FiMessageSquare className="w-5 h-5 text-[#468AD1]" />
                    Reviews & Ratings
                  </h2>
                  {!showReviewForm && !reviewSubmitted && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#468AD1] text-white text-sm font-semibold rounded-xl hover:bg-[#2F6FAE] transition-colors"
                    >
                      <FiSend className="w-4 h-4" />
                      Write a Review
                    </button>
                  )}
                </div>

                {/* Rating Summary */}
                {!reviewsLoading && reviewsData && reviewsData.total > 0 && (
                  <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-6 border-b border-gray-100">
                    <div className="text-center sm:text-left">
                      <div className="text-5xl font-extrabold text-gray-900">
                        {reviewsData.averageRating.toFixed(1)}
                      </div>
                      <div className="flex items-center gap-1 mt-1 justify-center sm:justify-start">
                        {Array.from({ length: 5 }, (_, i) => (
                          <FiStar
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.round(reviewsData.averageRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {reviewsData.total} review{reviewsData.total !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviewsData.distribution[stars - 1];
                        const pct = reviewsData.total > 0 ? (count / reviewsData.total) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-3">{stars}</span>
                            <FiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {showReviewForm && !reviewSubmitted && (
                  <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Share Your Experience</h3>
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      {/* Star Rating Selector */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Your Rating *</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                              className="p-0.5 transition-transform hover:scale-110"
                            >
                              <FiStar
                                className={`w-7 h-7 ${
                                  star <= reviewForm.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300 hover:text-amber-300'
                                } transition-colors`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-500">
                            {reviewForm.rating}/5
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Your Name *</label>
                          <input
                            type="text"
                            required
                            value={reviewForm.reviewerName}
                            onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                          <input
                            type="email"
                            required
                            value={reviewForm.reviewerEmail}
                            onChange={(e) => setReviewForm({ ...reviewForm, reviewerEmail: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                            placeholder="you@email.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Review Title</label>
                        <input
                          type="text"
                          value={reviewForm.title}
                          onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                          placeholder="Summarize your experience"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Your Review *</label>
                        <textarea
                          required
                          rows={4}
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all resize-none"
                          placeholder="Tell others about your experience with this professional..."
                        />
                      </div>

                      {reviewError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">
                          {reviewError}
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={reviewSubmitting}
                          className="px-6 py-2.5 bg-[#468AD1] text-white rounded-xl hover:bg-[#2F6FAE] transition-colors font-semibold text-sm disabled:opacity-60 flex items-center"
                        >
                          {reviewSubmitting ? (
                            <>
                              <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Review'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Review Submitted Success */}
                {reviewSubmitted && (
                  <div className="bg-green-50 rounded-xl p-6 mb-8 border border-green-100 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <FiCheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Review Submitted!</h3>
                    <p className="text-gray-500 text-sm mb-3">
                      Thank you for your feedback. Your review helps other clients make informed decisions.
                    </p>
                    <button
                      onClick={() => setReviewSubmitted(false)}
                      className="text-sm text-[#468AD1] hover:underline font-medium"
                    >
                      Write another review
                    </button>
                  </div>
                )}

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200" />
                          <div className="h-4 bg-gray-200 rounded w-24" />
                          <div className="h-3 bg-gray-200 rounded w-16" />
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : reviewsData && reviewsData.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviewsData.reviews.map((review) => (
                      <div key={review.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#514f63] to-[#3d3b4e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {review.reviewerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {review.reviewerName}
                              </h4>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <FiStar
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < review.rating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {review.title && (
                              <p className="font-semibold text-gray-900 text-sm mt-1">{review.title}</p>
                            )}
                            {review.comment && (
                              <p className="text-gray-600 text-sm leading-relaxed mt-1">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !reviewSubmitted ? (
                  <div className="text-center py-8">
                    <FiMessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your experience!</p>
                  </div>
                ) : null}
              </motion.div>
            </div>

            {/* ──── Right: Sidebar ──── */}
            <div className="space-y-6">
              {/* Quick Info Card */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-28">
                <h3 className="font-bold text-gray-900 mb-4">Quick Info</h3>
                <div className="space-y-4">
                  {professional.hourlyRate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Hourly Rate</span>
                      <span className="font-bold text-gray-900">KES {professional.hourlyRate.toLocaleString()}/hr</span>
                    </div>
                  )}
                  {professional.consultationFee !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Consultation</span>
                      <span className="font-bold text-gray-900">
                        {professional.consultationFee > 0 ? `KES ${professional.consultationFee.toLocaleString()}` : 'Free'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      professional.availableOnline
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${professional.availableOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {professional.availableOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {professional.averageRating > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Rating</span>
                      <div className="flex items-center gap-1">
                        <FiStar className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-gray-900">{professional.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  {professional.contactPhone && (
                    <a
                      href={`tel:${professional.contactPhone}`}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#468AD1] transition-colors"
                    >
                      <FiPhone className="w-4 h-4 text-gray-400" />
                      {professional.contactPhone}
                    </a>
                  )}
                  {professional.contactEmail && (
                    <a
                      href={`mailto:${professional.contactEmail}`}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#468AD1] transition-colors"
                    >
                      <FiMail className="w-4 h-4 text-gray-400" />
                      {professional.contactEmail}
                    </a>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <FiMapPin className="w-4 h-4 text-gray-400" />
                    {professional.location}
                  </div>
                </div>
              </motion.div>

              {/* Contact Form Card */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Send a Message</h3>

                {contactSubmitted ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <FiCheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Message Sent!</h4>
                    <p className="text-gray-500 text-sm mb-4">
                      {professional.businessName} will get back to you shortly.
                    </p>
                    <button
                      onClick={() => {
                        setContactSubmitted(false);
                        setContactForm({ name: '', email: '', phone: '', message: '' });
                      }}
                      className="text-sm text-[#468AD1] hover:underline font-medium"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                        placeholder="+254 7XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
                      <textarea
                        required
                        rows={3}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all resize-none"
                        placeholder={`Hi, I'd like to inquire about your services...`}
                      />
                    </div>

                    {contactError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">
                        {contactError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={contactSubmitting}
                      className="w-full px-4 py-2.5 bg-[#468AD1] text-white rounded-xl hover:bg-[#2F6FAE] transition-all duration-200 font-semibold text-sm disabled:opacity-60 flex items-center justify-center shadow-lg shadow-[#468AD1]/15"
                    >
                      {contactSubmitting ? (
                        <>
                          <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <FiArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ Back CTA ══════════ */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4 text-center">
          <Link
            href="/surveyors-legal/professionals"
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm"
          >
            <FiArrowLeft className="mr-2 w-4 h-4" />
            Browse All Professionals
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function ProfessionalDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <FiLoader className="w-6 h-6 animate-spin text-[#468AD1]" />
            Loading profile...
          </div>
        </div>
      }
    >
      <ProfessionalDetailContent />
    </Suspense>
  );
}
