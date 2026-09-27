'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FiGrid,
  FiList,
  FiUsers,
  FiBookmark,
  FiHeart,
  FiPlusCircle,
  FiBriefcase,
  FiDollarSign,
  FiSettings,
  FiMail,
  FiCreditCard,
  FiAward,
  FiShield
} from 'react-icons/fi';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function DashboardNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems: NavItem[] = [
    { href: '/crm/dashboard', label: 'Dashboard', icon: <FiGrid className="w-5 h-5" /> },
    { href: '/crm/listing-management', label: 'Listing Management', icon: <FiList className="w-5 h-5" /> },
    { href: '/crm/lead-management', label: 'Lead Management', icon: <FiUsers className="w-5 h-5" /> },
    { href: '/crm/messages', label: 'Messages', icon: <FiMail className="w-5 h-5" /> },
    { href: '/crm/user-profile', label: 'User Profile', icon: <FiSettings className="w-5 h-5" /> },
    { href: '/crm/company-information', label: 'Company Information', icon: <FiBriefcase className="w-5 h-5" /> },
    { href: '/crm/wallet-management', label: 'Wallet Management', icon: <FiDollarSign className="w-5 h-5" /> },
    { href: '/crm/rate-cards', label: 'Rate Cards', icon: <FiCreditCard className="w-5 h-5" /> },
    { href: '/crm/badges', label: 'Agent Badges', icon: <FiShield className="w-5 h-5" /> },

    { href: '/crm/surveyor-registration', label: 'Due Diligence Inquiries', icon: <FiAward className="w-5 h-5" /> },
    { href: '/crm/saved-searches', label: 'Saved Searches', icon: <FiBookmark className="w-5 h-5" /> },
    { href: '/crm/favorites', label: 'Favorites', icon: <FiHeart className="w-5 h-5" /> },
  ];

  return (
    <nav className="bg-white shadow-sm w-full max-w-screen-2xl mx-auto px-4 pt-24">
      {/* Header with Logo, Welcome and Add Listing */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/vectorafriq-logo-removebg-preview.png"
              alt="VectorAfriq"
              width={100}
              height={32}
              className="h-14 w-auto"
            />
          </Link>
          <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 truncate">
            Welcome {session?.user?.name || 'User'}
          </h1>
        </div>
        <Link
          href="/crm/create-listing"
          className="inline-flex items-center justify-center px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors whitespace-nowrap"
        >
          <FiPlusCircle className="w-5 h-5 mr-2" />
          Add listing
        </Link>
      </div>

      {/* Scrollable Navigation */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex items-center space-x-1 min-w-max">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${pathname === item.href
                  ? 'bg-[#468AD1] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-2 sm:hidden" />
    </nav>
  );
}
