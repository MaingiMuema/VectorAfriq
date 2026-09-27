"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FiUsers, FiHome, FiAward, FiSmile } from "react-icons/fi";

const stats = [
  { icon: <FiUsers />, value: "50K+", label: "Happy Clients" },
  { icon: <FiHome />, value: "100K+", label: "Properties Listed" },
  { icon: <FiAward />, value: "15+", label: "Years Experience" },
  { icon: <FiSmile />, value: "1000+", label: "Real Estate Agents" },
];

export default function AboutUs() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 mt-20">
        <h1 className="text-4xl font-bold text-[#514f63] mb-4">
          About VectorAfriq Kenya
        </h1>
        <p className="text-lg text-[#514f63]/80 max-w-3xl mx-auto">
          Your trusted partner in finding the perfect property in Kenya.
          We&apos;re revolutionizing the real estate industry through technology
          and innovation.
        </p>
      </div>

      {/* Vision & Mission */}
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-[#514f63] mb-4">Our Vision</h2>
          <p className="text-[#514f63]/80">
            To be Kenya&apos;s most trusted and innovative property marketplace,
            making property search and acquisition seamless for everyone.
          </p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-[#514f63] mb-4">
            Our Mission
          </h2>
          <p className="text-[#514f63]/80">
            To empower property seekers and real estate professionals with
            cutting-edge technology and market insights, creating transparent
            and efficient property transactions.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="text-center p-6 bg-white rounded-lg shadow-lg border border-gray-100"
          >
            <div className="text-[#468AD1] text-3xl mb-2 flex justify-center">
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-[#514f63]">
              {stat.value}
            </div>
            <div className="text-sm text-[#514f63]/80">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Company Overview */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-[#514f63] mb-6">Our Story</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative h-[400px]">
            <Image
              src="/vectorafriq-logo-removebg-preview.png"
              alt="VectorAfriq Kenya Office"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div>
            <p className="text-[#514f63]/80 mb-4">
              Founded in 2023, VectorAfriq Kenya has grown to become the
              country&apos;s leading property marketplace. We started with a
              simple mission: to make property search easier for everyone in
              Kenya.
            </p>
            <p className="text-[#514f63]/80 mb-4">
              Over the years, we&apos;ve evolved into a comprehensive property
              technology platform, serving thousands of property seekers, real
              estate agents, and property developers across the country.
            </p>
            <p className="text-[#514f63]/80">
              Today, we&apos;re proud to be at the forefront of innovation in
              Kenya&apos;s real estate industry, continuously developing new
              solutions to make property transactions more transparent,
              efficient, and accessible.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-[#514f63]/5 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-[#514f63] mb-4">
          Join the VectorAfriq Community
        </h2>
        <p className="text-[#514f63]/80 mb-6">
          Whether you&apos;re looking to buy, rent, or sell property in Kenya,
          we&apos;re here to help you every step of the way.
        </p>
        <button className="bg-[#468AD1] text-white px-8 py-3 rounded-lg hover:bg-[#2F6FAE] transition-colors">
          Get Started Today
        </button>
      </div>
    </div>
  );
}
