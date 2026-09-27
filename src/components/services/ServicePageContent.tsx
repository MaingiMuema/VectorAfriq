'use client';

/* ServicePageContent - theme-driven service pages (built incrementally) */

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { services, themeStyleFor } from '@/lib/services-config';
import type { ServiceConfig } from '@/lib/services-config';
import {
  FiCheckCircle,
  FiShield,
  FiUsers,
  FiStar,
  FiClock,
  FiTrendingUp,
  FiArrowRight,
  FiMessageSquare,
  FiPhone,
  FiMapPin,
  FiClipboard,
  FiX,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
} from 'react-icons/fi';

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

/* ──────────── Service Page Component ──────────── */

interface ServicePageProps {
  service: ServiceConfig;
}

const inputBase =
  'w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all pf-input';

const processSteps = [
  { step: '1', title: 'Submit Inquiry', desc: 'Tell us about your needs', icon: <FiMessageSquare className="w-6 h-6" /> },
  { step: '2', title: 'Get a Quote', desc: 'VectorAfriq reviews & quotes', icon: <FiClipboard className="w-6 h-6" /> },
  { step: '3', title: 'Make Payment', desc: 'Pay securely through the platform', icon: <FiShield className="w-6 h-6" /> },
  { step: '4', title: 'Service Delivery', desc: 'Verified partner delivers', icon: <FiCheckCircle className="w-6 h-6" /> },
  { step: '5', title: 'Review & Close', desc: 'Confirm completion', icon: <FiStar className="w-6 h-6" /> },
];

export default function ServicePageContent({ service }: ServicePageProps) {
  const theme = service.theme;
  const layout = service.layout;
  const isSidecar = layout === 'sidecar';
  const isFeatured = layout === 'featured';

  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: service.slug,
    location: '',
    propertyUrl: '',
    message: '',
  });
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const activeService = services.find((s) => s.slug === inquiryForm.serviceType) || service;
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const heroStats = [
    { icon: <FiUsers className="w-5 h-5" />, value: '500+', label: 'Vetted Partners' },
    { icon: <FiStar className="w-5 h-5" />, value: '4.8', label: 'Average Rating' },
    { icon: <FiClock className="w-5 h-5" />, value: '24h', label: 'Response Time' },
    { icon: <FiTrendingUp className="w-5 h-5" />, value: '10K+', label: 'Jobs Completed' },
  ];

  const scrollToInquiry = () =>
    document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' });

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySubmitting(true);
    setInquiryError('');
    try {
      const res = await fetch('/api/services/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inquiryForm, servicePage: service.slug, extraFields: dynamicFields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry');
      setShowSuccessPopup(true);
      setInquiryForm({
        name: '',
        email: '',
        phone: '',
        serviceType: service.slug,
        location: '',
        propertyUrl: '',
        message: '',
      });
      setDynamicFields({});
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : 'Failed to submit inquiry. Please try again.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  const heroOverlay = `linear-gradient(135deg, ${theme.surface[0]}B3 0%, ${theme.surface[1]}A6 50%, ${theme.surface[2]}BF 100%)`;

  const renderBreadcrumbs = (alignLeft = false) => (
    <nav
      aria-label="Breadcrumb"
      className={`relative z-10 flex items-center gap-1.5 text-xs sm:text-sm text-white/60 mb-8 ${
        alignLeft ? 'justify-start' : 'justify-center'
      }`}
    >
      <Link href="/" className="hover:text-white transition-colors">Home</Link>
      <FiChevronRight className="w-3.5 h-3.5 text-white/40" />
      <Link href="/services" className="hover:text-white transition-colors">Services</Link>
      <FiChevronRight className="w-3.5 h-3.5 text-white/40" />
      <span className="text-white font-medium">{service.shortTitle}</span>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50" style={themeStyleFor(theme)}>
      {/* ═══════════════ Hero Section ═══════════════ */}
      <section
        className={`relative overflow-hidden text-white pt-24 sm:pt-28 ${
          isSidecar ? 'pb-16 sm:pb-20' : 'pb-20 sm:pb-24'
        }`}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={service.heroImage}
            alt={service.title}
            className="w-full h-full object-cover animate-ken-burns"
            draggable={false}
            fetchPriority="high"
          />
          <div className="absolute inset-0" style={{ background: heroOverlay }} />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>

        {/* Decorative blobs */}
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${theme.surface[1]} 0%, transparent 70%)` }}
        />

        <div className="relative z-10 container mx-auto px-4">
          {isSidecar ? (
            /* ── Sidecar hero: split content + floating included card ── */
            <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-center">
              <div>
                {renderBreadcrumbs(true)}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-5 py-2 rounded-full border border-white/10 mb-6">
                    <FiShield style={{ color: theme.glow }} />
                    Professional {service.title} Services in Kenya
                  </span>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-tight mb-6"
                >
                  {service.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-base sm:text-lg text-white/70 mb-8 leading-relaxed max-w-xl"
                >
                  {service.heroDescription}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4 mb-8"
                >
                  <button
                    onClick={scrollToInquiry}
                    className="pf-btn-primary inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold whitespace-nowrap"
                  >
                    Get Started
                    <FiArrowRight className="ml-2 w-5 h-5" />
                  </button>
                  <Link
                    href="/contact-us"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold border border-white/20 whitespace-nowrap"
                  >
                    <FiPhone className="mr-2 w-5 h-5" />
                    Contact Us
                  </Link>
                </motion.div>
                {/* Trust points */}
                <motion.ul
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-x-6 gap-y-2 mb-8"
                >
                  {['No commitment required', 'Response within 24 hours', 'Vetted professionals'].map((point) => (
                    <li key={point} className="flex items-center gap-2 text-sm text-white/75">
                      <FiCheck className="w-4 h-4 shrink-0" style={{ color: theme.glow }} />
                      {point}
                    </li>
                  ))}
                </motion.ul>
                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.45 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl p-3">
                      <div className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                        <span style={{ color: theme.glow }}>{stat.icon}</span>
                        {stat.value}
                      </div>
                      <div className="text-xs text-white/60 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Floating "What's included" card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="relative mt-10 lg:mt-0"
              >
                <div className="pf-panel-dark rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-white/10">
                  <div
                    className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }}
                  />
                  <h3 className="text-lg font-bold mb-5 relative z-10 flex items-center gap-2">
                    <FiCheckCircle className="w-5 h-5" style={{ color: theme.glow }} />
                    What&apos;s Included
                  </h3>
                  <ul className="space-y-3.5 relative z-10 mb-6">
                    {service.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-white/85">
                        <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center mt-0.5 shrink-0">
                          <FiCheck className="w-3 h-3" style={{ color: theme.glow }} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={scrollToInquiry}
                    className="pf-btn-primary w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold relative z-10"
                  >
                    Get a Quote
                    <FiArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          ) : isFeatured ? (
            /* ── Featured hero: centered + service-type pills ── */
            <div className="max-w-4xl mx-auto text-center">
              {renderBreadcrumbs()}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-5 py-2 rounded-full border border-white/10 mb-8">
                  <FiShield style={{ color: theme.glow }} />
                  Professional {service.title} Services in Kenya
                </span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6"
              >
                {service.title.split(' ').length > 1 ? (
                  <>
                    {service.title.split(' ').slice(0, -1).join(' ')}{' '}
                    <span
                      className="relative inline-block"
                      style={{
                        backgroundImage: `linear-gradient(90deg, ${theme.glow}, #ffffff)`,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                      }}
                    >
                      {service.title.split(' ').slice(-1)}
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${theme.glow}, #ffffff)`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {service.title}
                  </span>
                )}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg sm:text-xl text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed"
              >
                {service.heroDescription}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-wrap justify-center gap-2.5 mb-8"
              >
                {service.serviceTypes.map((type) => (
                  <span
                    key={type.value}
                    className="inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-sm text-white/90 text-sm px-4 py-2 rounded-full hover:bg-white/20 transition-colors cursor-default"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.glow }} />
                    {type.label}
                  </span>
                ))}
              </motion.div>
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                onClick={scrollToInquiry}
                className="pf-btn-primary inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold whitespace-nowrap"
              >
                Get Started
                <FiArrowRight className="ml-2 w-5 h-5" />
              </motion.button>
            </div>
          ) : (
            /* ── Centered hero ── */
            <div className="max-w-4xl mx-auto text-center">
              {renderBreadcrumbs()}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-5 py-2 rounded-full border border-white/10 mb-8">
                  <FiShield style={{ color: theme.glow }} />
                  Professional {service.title} Services in Kenya
                </span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6"
              >
                {service.title.split(' ').length > 1 ? (
                  <>
                    {service.title.split(' ').slice(0, -1).join(' ')}{' '}
                    <span className="relative inline-block">
                      <span className="relative z-10">{service.title.split(' ').slice(-1)}</span>
                      <span className="pf-underline absolute bottom-1 left-0 right-0 h-3 rounded-sm -z-0" />
                    </span>
                  </>
                ) : (
                  <span className="relative inline-block">
                    <span className="relative z-10">{service.title}</span>
                    <span className="pf-underline absolute bottom-1 left-0 right-0 h-3 rounded-sm -z-0" />
                  </span>
                )}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed"
              >
                {service.heroDescription}
              </motion.p>
              {/* Quick search bar */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xl max-w-3xl mx-auto"
              >
                <div className="flex flex-col md:flex-row gap-3 items-center justify-center">
                  <p className="text-gray-600 text-sm">Tell us about your property and the services you need.</p>
                  <button
                    onClick={scrollToInquiry}
                    className="pf-btn-primary px-8 py-3.5 rounded-xl font-semibold whitespace-nowrap flex items-center justify-center"
                  >
                    Get Started
                    <FiArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ Stats Bar (centered / featured) ═══════════════ */}
      {!isSidecar && (
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
                  <motion.div key={index} variants={scaleIn} className="text-center">
                    <div className="w-10 h-10 rounded-xl pf-chip-static flex items-center justify-center mx-auto mb-3">
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
      )}

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
            <span className="inline-flex items-center gap-2 pf-badge-dark text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <FiClock className="w-4 h-4" />
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Simple & Managed Process</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              VectorAfriq manages the entire transaction so you don&apos;t have to worry about finding or vetting professionals.
            </p>
          </motion.div>

          {isSidecar ? (
            /* Vertical timeline */
            <div className="max-w-3xl mx-auto">
              <div className="relative pl-16 sm:pl-20 space-y-8">
                <div className="absolute left-[1.55rem] sm:left-[1.95rem] top-3 bottom-3 w-0.5 bg-gray-200" />
                {processSteps.map((item, i) => (
                  <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="relative">
                    <div className="pf-bg-primary absolute -left-16 sm:-left-20 top-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {item.step}
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="pf-chip-static w-10 h-10 rounded-xl flex items-center justify-center mb-3">{item.icon}</div>
                      <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : isFeatured ? (
            /* Alternating rows */
            <div className="max-w-4xl mx-auto space-y-6">
              {processSteps.map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  className={`flex flex-col sm:flex-row items-center gap-6 bg-gray-50 rounded-2xl p-6 sm:p-7 border border-gray-100 hover:shadow-md transition-shadow ${
                    i % 2 === 1 ? 'sm:flex-row-reverse' : ''
                  }`}
                >
                  <div className="pf-chip-static w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                  <div className="hidden sm:flex pf-chip-static w-12 h-12 rounded-full items-center justify-center text-xl shrink-0">
                    {item.icon}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Horizontal 5-step */
            <div className="relative max-w-5xl mx-auto">
              <div className="hidden md:block absolute top-7 left-12 right-12 h-0.5 bg-gray-100" />
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-5 gap-6 relative"
              >
                {processSteps.map((item, i) => (
                  <motion.div key={i} variants={fadeUp} className="text-center relative">
                    <div className="pf-chip-static w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                      {item.icon}
                    </div>
                    <div className="pf-step-num w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                      {item.step}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ Features / What We Offer ═══════════════ */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 pf-chip-static text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              {service.icon}
              What We Offer
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{service.title} Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              All services are managed by VectorAfriq and delivered through our vetted partner network of certified professionals.
            </p>
          </motion.div>

          {isSidecar ? (
            /* Two-column checklist */
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto"
            >
              {service.features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  className="group flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-lg pf-chip flex items-center justify-center shrink-0">
                    <FiCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 pt-1.5">{feature}</h3>
                </motion.div>
              ))}
            </motion.div>
          ) : isFeatured ? (
            /* Bento grid */
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
            >
              {service.features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  className={`group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 ${
                    index === 0 ? 'sm:col-span-2' : ''
                  }`}
                >
                  <span className="absolute -right-2 -bottom-5 text-7xl font-extrabold text-gray-100 select-none">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="pf-chip-static w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative">
                    <FiCheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className={`font-bold text-gray-900 relative ${index === 0 ? 'text-xl' : ''}`}>{feature}</h3>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Card grid */
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {service.features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="pf-chip w-14 h-14 rounded-xl flex items-center justify-center mb-5">
                    <FiCheckCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{feature}</h3>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══════════════ Why VectorAfriq ═══════════════ */}
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
              <span className="inline-flex items-center gap-2 pf-badge-dark text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                <FiShield className="w-4 h-4" />
                Why VectorAfriq
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Your Trusted Service Partner</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                We connect you with verified professionals while managing the entire process for your peace of mind.
              </p>
            </motion.div>

            {isFeatured ? (
              /* Glass tiles inside a dark panel */
              <div className="pf-panel-dark rounded-2xl p-8 sm:p-10 relative overflow-hidden">
                <div
                  className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                  {service.benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="bg-white/10 border border-white/10 rounded-xl p-6 hover:bg-white/15 transition-colors"
                    >
                      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                        <FiCheckCircle className="w-5 h-5" style={{ color: theme.glow }} />
                      </div>
                      <h3 className="font-bold text-white mb-2">{benefit.title}</h3>
                      <p className="text-white/70 text-sm leading-relaxed">{benefit.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={`grid grid-cols-1 gap-6 mb-12 ${
                  isSidecar ? 'sm:grid-cols-2' : 'sm:grid-cols-2 md:grid-cols-4'
                }`}
              >
                {service.benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    variants={fadeUp}
                    className={`${isSidecar ? 'flex items-start gap-4 text-left p-6 bg-gray-50 rounded-2xl border border-gray-100' : 'text-center p-6'}`}
                  >
                    <div className={`pf-chip-dark w-14 h-14 rounded-2xl flex items-center justify-center ${isSidecar ? 'shrink-0 mb-0' : 'mx-auto mb-4'}`}>
                      <FiCheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Mid-page CTA panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className={`${isFeatured ? 'pf-panel-cta' : 'pf-panel-dark'} rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden`}
            >
              <div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }}
              />
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 relative z-10">Ready to Get Started?</h3>
              <p className="text-white/75 mb-8 max-w-xl mx-auto relative z-10 text-lg">
                Submit an inquiry and VectorAfriq will match you with the right verified professional for your {service.title.toLowerCase()} needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <button
                  onClick={scrollToInquiry}
                  className={`inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold shadow-lg text-base ${
                    isFeatured
                      ? 'bg-white text-gray-900 hover:bg-gray-100 transition-colors'
                      : 'pf-btn-primary'
                  }`}
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

      {/* ═══════════════ Inquiry Form ═══════════════ */}
      <section id="inquiry-form" className="py-16 sm:py-20 scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="pf-panel-dark p-8 relative overflow-hidden">
                <div
                  className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }}
                />
                <h2 className="text-2xl font-bold mb-2 relative z-10">Request {service.title}</h2>
                <p className="text-white/75 relative z-10">
                  Tell us about your property and the services you need. VectorAfriq will review your request, provide a quote, and assign a verified professional.
                </p>
              </div>

              <form onSubmit={handleSubmitInquiry} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      className={inputBase}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                      className={inputBase}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                      className={inputBase}
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                    <select
                      required
                      value={inquiryForm.serviceType}
                      onChange={(e) => {
                        const newSlug = e.target.value;
                        setInquiryForm({ ...inquiryForm, serviceType: newSlug });
                        setDynamicFields({});
                      }}
                      className={inputBase}
                    >
                      {services.map((s) => (
                        <option key={s.slug} value={s.slug}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dynamic fields based on selected service */}
                {activeService.inquiryFields.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      {activeService.title} Details
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {activeService.inquiryFields.map((field) => (
                        <div key={field.name} className={field.gridSpan === 'full' ? 'md:col-span-2' : ''}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}{field.required ? ' *' : ''}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              required={field.required}
                              value={dynamicFields[field.name] || ''}
                              onChange={(e) => setDynamicFields({ ...dynamicFields, [field.name]: e.target.value })}
                              className={inputBase}
                            >
                              <option value="">Select...</option>
                              {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              required={field.required}
                              rows={3}
                              value={dynamicFields[field.name] || ''}
                              onChange={(e) => setDynamicFields({ ...dynamicFields, [field.name]: e.target.value })}
                              className={inputBase}
                              placeholder={field.placeholder}
                            />
                          ) : (
                            <input
                              type={field.type}
                              required={field.required}
                              value={dynamicFields[field.name] || ''}
                              onChange={(e) => setDynamicFields({ ...dynamicFields, [field.name]: e.target.value })}
                              className={inputBase}
                              placeholder={field.placeholder}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Location *</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={inquiryForm.location}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, location: e.target.value })}
                      className={`${inputBase} pl-11`}
                      placeholder="e.g., Kilimani, Nairobi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property URL (Optional)</label>
                  <input
                    type="url"
                    value={inquiryForm.propertyUrl}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, propertyUrl: e.target.value })}
                    className={inputBase}
                    placeholder="https://vectorafriqproperties.co.ke/property/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Describe Your Needs *</label>
                  <textarea
                    required
                    rows={4}
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    className={inputBase}
                    placeholder={`Tell us about your ${service.title.toLowerCase()} needs...`}
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
                  className="pf-btn-primary w-full px-6 py-3.5 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center"
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
              <span className="inline-flex items-center gap-2 pf-badge-dark text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                <FiMessageSquare className="w-4 h-4" />
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
            </motion.div>

            <div className="space-y-4">
              {service.faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left"
                    aria-expanded={openFaq === index}
                    aria-controls={`faq-panel-${index}`}
                    id={`faq-button-${index}`}
                  >
                    <h3 className="font-bold text-gray-900">{faq.question}</h3>
                    <span
                      className={`w-8 h-8 rounded-full pf-chip-static flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    >
                      <FiChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === index && (
                      <motion.div
                        key="answer"
                        id={`faq-panel-${index}`}
                        role="region"
                        aria-labelledby={`faq-button-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ Related Services ═══════════════ */}
      {(() => {
        const related = services.filter((s) => s.slug !== service.slug).slice(0, 4);
        return (
          <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
              >
                <span className="inline-flex items-center gap-2 pf-chip-static text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                  <FiTrendingUp className="w-4 h-4" />
                  Explore More
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Other Services You Might Need</h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                  Complete your property journey with our full range of managed professional services.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {related.map((s, index) => (
                  <motion.div key={s.slug} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                    <Link
                      href={`/services/${s.slug}`}
                      style={themeStyleFor(s.theme)}
                      className="group block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full"
                    >
                      <div className="pf-chip w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                        {s.icon}
                      </div>
                      <h3 className="pf-card-title font-bold text-gray-900 mb-2">{s.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">{s.heroDescription}</p>
                      <span className="pf-link-primary inline-flex items-center text-sm font-semibold">
                        Learn more
                        <FiArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ═══════════════ Bottom CTA ═══════════════ */}
      <section className="py-16 sm:py-20 pf-panel-cta relative overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Need {service.title}?</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto text-lg">
            VectorAfriq has you covered with our network of verified professionals for {service.title.toLowerCase()} across Kenya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact-us"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold shadow-lg text-base"
            >
              <FiPhone className="mr-2 w-5 h-5" />
              Contact Us
            </Link>
            <button
              onClick={scrollToInquiry}
              className="inline-flex items-center justify-center px-8 py-4 bg-white/15 text-white rounded-xl hover:bg-white/25 transition-all duration-200 font-semibold border border-white/25 text-base"
            >
              <FiMessageSquare className="mr-2 w-5 h-5" />
              Submit Inquiry
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ Success Popup Modal ═══════════════ */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSuccessPopup(false)}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Inquiry Received!</h3>
            <p className="text-gray-600 mb-2">
              Thank you for your inquiry. Our team has received your request and will review it shortly.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              A confirmation email has been sent to your inbox. We will get back to you within 24 hours with a quote and professional match.
            </p>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="pf-btn-primary w-full px-6 py-3 rounded-xl font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
