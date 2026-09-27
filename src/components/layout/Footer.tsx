"use client";

import Link from 'next/link';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaYoutube } from 'react-icons/fa';
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { setLoading } = useNavigationLoading();

  const handleLinkClick = () => {
    setLoading(true);
  };

  const quickLinks = [
    { href: '/about-us', text: 'About Us' },
    { href: '/contact-us', text: 'Contact Us' },
    { href: '/services', text: 'Services' },
    { href: '/privacy-policy', text: 'Privacy Policy' },
    { href: '/terms-conditions', text: 'Terms & Conditions' },
    { href: '/faqs', text: 'FAQs' },
    { href: '/sitemap', text: 'Sitemap' },
  ];

  const propertyTypes = [
    { href: '/apartments-for-sale', text: 'Apartments for Sale' },
    { href: '/houses-for-sale', text: 'Houses for Sale' },
    { href: '/apartments-for-rent', text: 'Apartments for Rent' },
    { href: '/houses-for-rent', text: 'Houses for Rent' },
    { href: '/land-for-sale', text: 'Land for Sale' },
  ];

  const popularLocations = [
    { href: '/for-sale/nairobi', text: 'Nairobi' },
    { href: '/for-sale/mombasa', text: 'Mombasa' },
    { href: '/for-sale/kisumu', text: 'Kisumu' },
    { href: '/for-sale/nakuru', text: 'Nakuru' },
    { href: '/for-sale/eldoret', text: 'Eldoret' },
  ];

  const resources = [
    { href: '/blogs', text: 'Property Advice' },
    { href: '/mortgage-calculator', text: 'Mortgage Calculator' },
    { href: '/property-valuation', text: 'Property Valuation' },
    { href: '/market-trends', text: 'Market Trends' },
    { href: '/investment-guide', text: 'Investment Guide' },
  ];

  return (
    <footer className="bg-[#1c3a59] text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center mb-6" onClick={handleLinkClick}>
              <span className="text-xl font-bold text-white">Vector</span>
              <span className="text-xl font-bold text-[#2FB3C7]">Afriq</span>
              <span className="ml-2 text-sm font-medium text-gray-400">Properties Ltd</span>
            </Link>
            <p className="mb-6 text-gray-300">
              Kenya&apos;s leading real estate marketplace, connecting buyers, sellers, and renters with the best properties across the country.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <FaMapMarkerAlt className="text-[#2FB3C7] mr-3" />
                <p className="text-gray-300">Kitengela : Tarikiville Mall, Mezzanine Floor, Suite M17</p>
              </div>
              <div className="flex items-center">
                <FaPhone className="text-[#2FB3C7] mr-3" />
                <a href="tel:0723310245" className="text-gray-300 hover:text-white transition-colors">
                  +254 723310245
                </a>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="text-[#2FB3C7] mr-3" />
                <a href="mailto:info@vectorafriqproperties.co.ke" className="text-gray-300 hover:text-white transition-colors">
                  info@vectorafriqproperties.co.ke
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-300 hover:text-white transition-colors" onClick={handleLinkClick}>
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Property Types</h3>
            <ul className="space-y-3">
              {propertyTypes.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-300 hover:text-white transition-colors" onClick={handleLinkClick}>
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Resources</h3>
            <ul className="space-y-3">
              {resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-300 hover:text-white transition-colors" onClick={handleLinkClick}>
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="text-lg font-semibold mt-8 mb-4">Popular Locations</h3>
            <ul className="space-y-3">
              {popularLocations.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-300 hover:text-white transition-colors" onClick={handleLinkClick}>
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex space-x-6">
              <a href="https://www.facebook.com/p/Property-Finder-KE-100063636204360/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                <FaFacebook size={24} />
              </a>
              <a href="https://www.youtube.com/@vectorafriqproperties" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                <FaYoutube size={24} />
              </a>
            </div>
            <div className="flex items-center gap-3 text-gray-300 text-sm">
              <p>
                © {currentYear} VectorAfriq. All rights reserved.
              </p>
              <span className="hidden sm:inline text-gray-500">·</span>
              <Link href="/sitemap" className="hover:text-white transition-colors" onClick={handleLinkClick}>
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
