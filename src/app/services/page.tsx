'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { services, themeStyleFor } from '@/lib/services-config';
import { FiArrowRight, FiShield } from 'react-icons/fi';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#514f63] via-[#454358] to-[#3d3b4e] text-white pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #468AD1 0%, transparent 70%)' }}
        />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-5 py-2 rounded-full border border-white/10 mb-8"
          >
            <FiShield className="text-[#468AD1]" />
            Professional Property Services in Kenya
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6"
          >
            Our{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Services</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#468AD1]/30 rounded-sm -z-0" />
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            From valuation to legal, mortgage to movers — VectorAfriq connects you with verified professionals for every property need.
          </motion.p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto"
          >
            {services.map((service) => (
              <motion.div key={service.slug} variants={fadeUp}>
                <Link
                  href={`/services/${service.slug}`}
                  style={themeStyleFor(service.theme)}
                  className="group block bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden"
                >
                  {/* Theme accent strip */}
                  <div
                    className="h-1.5 w-full"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${service.theme.primary}, ${service.theme.glow})`,
                    }}
                  />
                  <div className="p-6">
                    <div className="pf-chip w-14 h-14 rounded-xl flex items-center justify-center mb-5">
                      {service.icon}
                    </div>
                    <h2 className="pf-card-title text-xl font-bold text-gray-900 mb-2">
                      {service.title}
                    </h2>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                      {service.heroDescription}
                    </p>
                    <div className="pf-link-primary flex items-center text-sm font-semibold">
                      Learn more
                      <FiArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
