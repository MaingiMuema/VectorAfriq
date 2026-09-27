'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

interface Partner {
  id: string;
  name: string;
  logo: string;
  link: string;
}

export const dynamic = 'force-dynamic';

function normalizePartnerLink(link: string): string {
  if (!link) return "#";
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `https://${link}`;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch('/api/partners');
        if (!response.ok) throw new Error('Failed to fetch partners');
        const data = await response.json();
        
        const partnersList = Array.isArray(data.partners) ? data.partners.map((partner: Partner) => {
          const logo = partner.logo;
          if (!logo) return { ...partner, logo: '/images/placeholder.png' };
          
          if (logo.startsWith('/api/images/serve/')) return partner;
          
          if (logo.startsWith('/api/images/partners/')) {
            const filename = logo.split('/api/images/partners/')[1];
            return { ...partner, logo: `/api/images/serve/partners/${filename}` };
          }
          
          let filename = logo;
          if (logo.includes('/')) {
            const pathParts = logo.split('/');
            filename = pathParts[pathParts.length - 1];
          }
          
          return { ...partner, logo: `/api/images/serve/partners/${filename}` };
        }) : [];
        
        setPartners(partnersList);
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center gap-2 mb-8">
          <Link
            href="/"
            className="text-[#514f63] hover:text-[#468AD1] transition-colors flex items-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-8 h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex items-center gap-2 mb-8">
        <Link
          href="/"
          className="text-[#514f63] hover:text-[#468AD1] transition-colors flex items-center gap-2"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[#514f63] mb-4">Our Partners</h1>
        <p className="text-gray-600 text-lg max-w-3xl">
          We collaborate with Kenya&apos;s leading real estate companies to bring you the best properties and services. Our partners are carefully selected based on their reputation, quality of service, and commitment to excellence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {partners.map((partner) => (
          <Link
            key={partner.id}
            href={normalizePartnerLink(partner.link)}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 h-64 flex flex-col items-center justify-center gap-6 group-hover:border-[#468AD1] transition-colors">
              <div className="relative w-full h-32">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  sizes="400px"
                  className="object-contain filter group-hover:brightness-110 transition-all"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder.png';
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-[#514f63] group-hover:text-[#468AD1] transition-colors">
                  {partner.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">View Partner Website</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!partners.length && (
        <div className="text-center text-gray-600 py-12">
          No partners found.
        </div>
      )}
    </div>
  );
}