/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FiGrid,
  FiUsers,
  FiHome,
  FiFileText,
  FiSettings,
  FiDollarSign,
  FiFlag,
  FiBarChart2,
  FiMapPin,
  FiUsers as FiPartners,
  FiTrendingUp,
  FiSearch,
  FiCreditCard,
  FiMail,
  FiAward,
  FiInbox,
  FiGlobe,
  FiVideo
} from 'react-icons/fi';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function AdminNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems: NavItem[] = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <FiGrid className="w-5 h-5" /> },
    { href: '/admin/users', label: 'User Management', icon: <FiUsers className="w-5 h-5" /> },
    { href: '/admin/properties', label: 'Property Management', icon: <FiHome className="w-5 h-5" /> },

    { href: '/admin/surveyors', label: 'Surveyor & Legal', icon: <FiAward className="w-5 h-5" /> },
    { href: '/admin/service-pages', label: 'Service Pages', icon: <FiGlobe className="w-5 h-5" /> },
    { href: '/admin/service-inquiries', label: 'Service Inquiries', icon: <FiInbox className="w-5 h-5" /> },
    { href: '/admin/inquiries', label: 'Help & Support', icon: <FiInbox className="w-5 h-5" /> },
    { href: '/admin/agent-rate-cards', label: 'Rate Cards', icon: <FiCreditCard className="w-5 h-5" /> },
    { href: '/admin/badges', label: 'Badge Config', icon: <FiAward className="w-5 h-5" /> },
    { href: '/admin/blogs', label: 'Blog Management', icon: <FiFileText className="w-5 h-5" /> },
    { href: '/admin/partners', label: 'Partner Management', icon: <FiPartners className="w-5 h-5" /> },
    { href: '/admin/reports', label: 'Reports & Analytics', icon: <FiBarChart2 className="w-5 h-5" /> },
    { href: '/admin/analytics', label: 'Google Analytics', icon: <FiTrendingUp className="w-5 h-5" /> },
    { href: '/admin/seo', label: 'SEO Management', icon: <FiSearch className="w-5 h-5" /> },
    { href: '/admin/promo-video', label: 'Promo Video', icon: <FiVideo className="w-5 h-5" /> },
    { href: '/admin/locations', label: 'Location Management', icon: <FiMapPin className="w-5 h-5" /> },
    { href: '/admin/banners', label: 'Banner Management', icon: <FiFileText className="w-5 h-5" /> },
    { href: '/admin/transactions', label: 'Transactions', icon: <FiDollarSign className="w-5 h-5" /> },
    { href: '/admin/reported-content', label: 'Reported Content', icon: <FiFlag className="w-5 h-5" /> },
    { href: '/admin/settings', label: 'System Settings', icon: <FiSettings className="w-5 h-5" /> },
    { href: '/admin/webmail', label: 'Webmail Access', icon: <FiMail className="w-5 h-5" /> },
  ];

  return (
    <nav className="bg-white shadow-sm w-full max-w-screen-2xl mx-auto px-4 pt-24">
      {/* Header with Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 truncate">
            Admin Control Panel
          </h1>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <div className="overflow-x-auto scrollbar-thin pb-2 -mx-4 px-4">
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

      <style jsx global>{`
        /* Webkit browsers like Chrome, Safari */
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 2px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 2px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #666;
        }

        /* Firefox */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #888 #f1f1f1;
        }
      `}</style>

      {/* Scroll Indicator */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-2 sm:hidden" />
    </nav>
  );
}
