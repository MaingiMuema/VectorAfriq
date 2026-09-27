'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiCheckCircle,
  FiUsers,
  FiShield,
  FiAward,
  FiClipboard,
  FiArrowRight,
  FiMessageSquare,
  FiStar,
  FiClock,
  FiTrendingUp,
} from 'react-icons/fi';

/* ─────────────────── Data ─────────────────── */

interface ServiceCategory {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

const serviceCategories: ServiceCategory[] = [
  {
    icon: <FiAward className="w-8 h-8" />,
    title: 'Property Surveying',
    description: 'Professional land and property surveying services managed and delivered through VectorAfriq\'s vetted partner network.',
    features: [
      'Boundary confirmation',
      'Beacon placement & verification',
      'Land subdivision',
      'Mapping & site analysis',
      'Topographic mapping',
    ],
  },
  {
    icon: <FiShield className="w-8 h-8" />,
    title: 'Legal Services',
    description: 'Expert legal services for property transactions, ensuring ownership legitimacy and security through verified professionals.',
    features: [
      'Title deed verification',
      'Sale agreement drafting',
      'Land search via ArdhiSasa',
      'Ownership transfer processing',
      'Land dispute resolution',
    ],
  },
  {
    icon: <FiFileText className="w-8 h-8" />,
    title: 'Documentation',
    description: 'Comprehensive documentation services for all property-related legal requirements, handled by our certified partners.',
    features: [
      'Title deed processing',
      'Land control board applications',
      'Survey plan preparation',
      'Stamp duty assessment',
      'Transfer documentation',
    ],
  },
  {
    icon: <FiClipboard className="w-8 h-8" />,
    title: 'Valuation Services',
    description: 'Certified property valuation services for informed decision-making, delivered through VectorAfriq\'s trusted network.',
    features: [
      'Market valuation',
      'Forced sale valuation',
      'Investment advisory',
      'Mortgage valuations',
      'Insurance valuations',
    ],
  },
];

const benefits = [
  {
    icon: <FiCheckCircle className="w-6 h-6" />,
    title: 'Vetted Professionals',
    description: 'All partners are verified and aligned with Law Society of Kenya, Institution of Surveyors of Kenya, and Valuers Registration Board.',
  },
  {
    icon: <FiShield className="w-6 h-6" />,
    title: 'Managed Process',
    description: 'VectorAfriq manages the entire transaction — from quote to payment to final report delivery.',
  },
  {
    icon: <FiMessageSquare className="w-6 h-6" />,
    title: 'Simple Inquiry',
    description: 'Submit one inquiry and we match you with the right verified professional for your needs.',
  },
  {
    icon: <FiCheckCircle className="w-6 h-6" />,
    title: 'Quality Guarantee',
    description: 'Professional reports delivered on time with our quality assurance and dispute resolution support.',
  },
];

const heroStats = [
  { icon: <FiUsers className="w-5 h-5" />, value: '500+', label: 'Vetted Partners' },
  { icon: <FiStar className="w-5 h-5" />, value: '4.8', label: 'Average Rating' },
  { icon: <FiClock className="w-5 h-5" />, value: '24h', label: 'Response Time' },
  { icon: <FiTrendingUp className="w-5 h-5" />, value: '10K+', label: 'Jobs Completed' },
];

/* ─────────────── Animation Variants ─────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

/* ──────────────── Component ──────────────── */

function SurveyorsLegalContent() {
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: '',
    location: '',
    propertyUrl: '',
    message: '',
  });
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  const searchParams = useSearchParams();
  const propertyParam = searchParams.get('property');
  const locationParam = searchParams.get('location');
  const typeParam = searchParams.get('type');

  useEffect(() => {
    if (typeParam === 'verification' && propertyParam) {
      setInquiryForm((prev) => ({
        ...prev,
        location: locationParam || prev.location,
        message: `I would like to verify the property: "${propertyParam}". Please provide a professional survey and/or legal consultation for this property.`,
        serviceType: 'title-verification',
      }));
      document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [typeParam, propertyParam, locationParam]);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySubmitting(true);
    setInquiryError('');
    try {
      const res = await fetch('/api/surveyors/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry');
      setInquirySubmitted(true);
      setInquiryForm({
        name: '',
        email: '',
        phone: '',
        serviceType: '',
        location: '',
        propertyUrl: '',
        message: '',
      });
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : 'Failed to submit inquiry. Please try again.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══════════════ Hero Section ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#514f63] via-[#454358] to-[#3d3b4e] text-white pt-28 pb-20 sm:pt-32 sm:pb-24">
        {/* Decorative blobs */}
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #468AD1 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />

        {/* Floating grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-5 py-2 rounded-full border border-white/10 mb-8">
                <FiShield className="text-[#468AD1]" />
                Trusted Due Diligence Services in Kenya
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6"
            >
              Property{' '}
              <span className="relative inline-block">
                <span className="relative z-10">Due Diligence</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#468AD1]/30 rounded-sm -z-0" />
              </span>{' '}
              & Services
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              VectorAfriq connects you with verified surveyors, legal experts, and valuers.
              We manage the entire process — from inquiry to final report delivery.
            </motion.p>

            {/* Quick Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xl max-w-3xl mx-auto"
            >
              <div className="flex flex-col md:flex-row gap-3 items-center justify-center">
                <p className="text-gray-600 text-sm">Tell us about your property and the services you need.</p>
                <button
                  onClick={() => document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-3.5 bg-[#468AD1] text-white rounded-xl hover:bg-[#2F6FAE] transition-all duration-200 font-semibold whitespace-nowrap shadow-lg shadow-[#468AD1]/20 hover:shadow-xl hover:shadow-[#468AD1]/30 flex items-center justify-center"
                >
                  Get Started
                  <FiArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ Stats Bar ═══════════════ */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative z-10 -mt-8"
      >
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {heroStats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className="text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#468AD1]/10 flex items-center justify-center text-[#468AD1] mx-auto mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════ How It Works ═══════════════ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 bg-[#514f63]/5 text-[#514f63] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <FiClock className="w-4 h-4" />
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Simple & Managed Process
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              VectorAfriq manages the entire transaction so you don&apos;t have to worry about finding or vetting professionals.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-5xl mx-auto"
          >
            {[
              { step: '1', title: 'Find a Property', desc: 'Identify a property on VectorAfriq', icon: <FiSearch className="w-6 h-6" /> },
              { step: '2', title: 'Request Services', desc: 'Submit a due diligence inquiry', icon: <FiMessageSquare className="w-6 h-6" /> },
              { step: '3', title: 'Get a Quote', desc: 'VectorAfriq reviews & provides a quote', icon: <FiFileText className="w-6 h-6" /> },
              { step: '4', title: 'Make Payment', desc: 'Pay securely through the platform', icon: <FiShield className="w-6 h-6" /> },
              { step: '5', title: 'Receive Report', desc: 'Verified partner delivers the report', icon: <FiCheckCircle className="w-6 h-6" /> },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#468AD1]/10 flex items-center justify-center text-[#468AD1] mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="w-7 h-7 rounded-full bg-[#514f63] text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ Services Section ═══════════════ */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 bg-[#468AD1]/10 text-[#468AD1] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <FiAward className="w-4 h-4" />
              Our Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Comprehensive Due Diligence Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              All services are managed by VectorAfriq and delivered through our vetted partner network of certified professionals.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {serviceCategories.map((category, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#468AD1]/10 flex items-center justify-center text-[#468AD1] mb-5 group-hover:bg-[#468AD1] group-hover:text-white transition-all duration-300">
                  {category.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm mb-5 leading-relaxed">{category.description}</p>
                <ul className="space-y-2.5">
                  {category.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-600">
                      <FiCheckCircle className="w-4 h-4 text-green-500 mr-2.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ Why VectorAfriq Section ═══════════════ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="inline-flex items-center gap-2 bg-[#514f63]/5 text-[#514f63] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                <FiShield className="w-4 h-4" />
                Why VectorAfriq
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                Your Trusted Transaction Partner
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                We connect you with verified professionals while managing the entire process for your peace of mind.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  className="text-center p-6"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#514f63]/10 flex items-center justify-center text-[#514f63] mx-auto mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-[#514f63] via-[#454358] to-[#3d3b4e] rounded-2xl p-8 sm:p-10 text-white text-center relative overflow-hidden"
            >
              <div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #468AD1 0%, transparent 70%)' }}
              />

              <h3 className="text-2xl sm:text-3xl font-bold mb-4 relative z-10">Ready to Get Started?</h3>
              <p className="text-gray-300 mb-8 max-w-xl mx-auto relative z-10 text-lg">
                Submit an inquiry and VectorAfriq will match you with the right verified professional for your property needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <button
                  onClick={() => document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#468AD1] text-white rounded-xl hover:bg-[#2F6FAE] transition-all duration-200 font-semibold shadow-lg shadow-[#468AD1]/25 text-base"
                >
                  Submit Inquiry
                  <FiArrowRight className="ml-2 w-5 h-5" />
                </button>
                <Link
                  href="/contact-us"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold border border-white/20 text-base"
                >
                  <FiPhone className="mr-2 w-5 h-5" />
                  Contact Us
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ Inquiry Form Section ═══════════════ */}
      <section id="inquiry-form" className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-[#514f63] via-[#454358] to-[#3d3b4e] p-8 text-white relative overflow-hidden">
                <div
                  className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle, #468AD1 0%, transparent 70%)' }}
                />
                <h2 className="text-2xl font-bold mb-2 relative z-10">Request Due Diligence Services</h2>
                <p className="text-gray-300 relative z-10">
                  Tell us about your property and the services you need. VectorAfriq will review your request, provide a quote, and assign a verified professional.
                </p>
              </div>

              {inquirySubmitted ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Inquiry Submitted!</h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for your inquiry. VectorAfriq will review your request and get back to you within 24 hours with a quote and professional match.
                  </p>
                  <button
                    onClick={() => setInquirySubmitted(false)}
                    className="px-6 py-2.5 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors font-medium"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                        placeholder="+254 7XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Type *
                      </label>
                      <select
                        required
                        value={inquiryForm.serviceType}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, serviceType: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                      >
                        <option value="">Select a service</option>
                        <option value="title-verification">Title Verification</option>
                        <option value="property-surveying">Property Surveying</option>
                        <option value="boundary-survey">Boundary Survey</option>
                        <option value="legal-consultation">Legal Consultation</option>
                        <option value="conveyancing">Conveyancing</option>
                        <option value="documentation">Documentation Services</option>
                        <option value="property-valuation">Property Valuation</option>
                        <option value="land-search">Land Search (ArdhiSasa)</option>
                        <option value="ownership-transfer">Ownership Transfer</option>
                        <option value="land-dispute">Land Dispute Resolution</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Location *
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={inquiryForm.location}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, location: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                        placeholder="e.g., Kilimani, Nairobi"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={inquiryForm.propertyUrl}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, propertyUrl: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                      placeholder="https://vectorafriqproperties.co.ke/property/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Describe Your Needs *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#468AD1] focus:ring-2 focus:ring-[#468AD1]/20 transition-all"
                      placeholder="Tell us about the property and what due diligence services you need..."
                    />
                  </div>

                  {inquiryError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                      {inquiryError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="w-full px-6 py-3.5 bg-[#468AD1] text-white rounded-xl hover:bg-[#2F6FAE] transition-all duration-200 font-semibold disabled:opacity-60 flex items-center justify-center shadow-lg shadow-[#468AD1]/15 hover:shadow-xl hover:shadow-[#468AD1]/25"
                  >
                    {inquirySubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Inquiry
                        <FiArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ Section ═══════════════ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="inline-flex items-center gap-2 bg-[#514f63]/5 text-[#514f63] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                <FiMessageSquare className="w-4 h-4" />
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                Frequently Asked Questions
              </h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {[
                {
                  question: 'How does VectorAfriq connect me with professionals?',
                  answer: 'When you submit an inquiry, VectorAfriq reviews your request, provides a quote, and assigns a verified partner (lawyer, surveyor, or valuer) from our vetted network. You don\'t need to find or vet professionals yourself.',
                },
                {
                  question: 'What legal services are available?',
                  answer: 'Our verified legal professionals handle title deed verification, sale agreement drafting, land search via ArdhiSasa, ownership transfer processing, conveyancing, and land dispute resolution.',
                },
                {
                  question: 'How are professionals verified?',
                  answer: 'All professionals in our network are vetted and aligned with industry standards, including the Law Society of Kenya, Institution of Surveyors of Kenya, and Valuers Registration Board.',
                },
                {
                  question: 'How does payment work?',
                  answer: 'You make payment through the VectorAfriq platform. Payment is held in escrow and released to the professional only after the service is completed and the final report is delivered to you.',
                },
                {
                  question: 'How long does a typical due diligence process take?',
                  answer: 'Timelines vary by service. Title verification typically takes 1-2 weeks, boundary surveys 1-2 weeks, and comprehensive due diligence 2-4 weeks. VectorAfriq will provide estimated timelines with your quote.',
                },
                {
                  question: 'What survey services are available?',
                  answer: 'Our survey partners handle boundary confirmation, beacon placement and verification, land subdivision, mapping and site analysis, and topographic surveys.',
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-sm transition-shadow"
                >
                  <h3 className="font-bold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA Section ═══════════════ */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#468AD1] to-[#2F6FAE] relative overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Need Help with Your Property?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto text-lg">
            Whether you need a surveyor, legal advice, or valuation — VectorAfriq has you covered with our network of verified professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact-us"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#468AD1] rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold shadow-lg text-base"
            >
              <FiPhone className="mr-2 w-5 h-5" />
              Contact Us
            </Link>
            <button
              onClick={() => document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center px-8 py-4 bg-white/15 text-white rounded-xl hover:bg-white/25 transition-all duration-200 font-semibold border border-white/25 text-base"
            >
              <FiMessageSquare className="mr-2 w-5 h-5" />
              Submit Inquiry
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SurveyorsLegalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <SurveyorsLegalContent />
    </Suspense>
  );
}
