'use client';

import { useState } from 'react';
import {
  FiHelpCircle,
  FiMail,
  FiPhone,
  FiMessageSquare,
  FiChevronDown,
  FiExternalLink,
  FiBook,
  FiUsers,
  FiHome,
  FiTool,
  FiTruck,
  FiFileText,
} from 'react-icons/fi';
import Link from 'next/link';

/* ──────────── FAQ Data ──────────── */

const faqCategories = [
  {
    title: 'General',
    icon: <FiHelpCircle className="w-5 h-5" />,
    questions: [
      {
        q: 'What is VectorAfriq?',
        a: 'VectorAfriq is Kenya\'s leading property platform connecting buyers, sellers, tenants, landlords, and verified professionals for all property-related needs including valuation, legal, survey, mortgage, and moving services.',
      },
      {
        q: 'How do I create an account?',
        a: 'Click "Sign Up" on the top navigation bar and follow the registration process. You can register as a regular user or as an agent/company.',
      },
      {
        q: 'Is VectorAfriq free to use?',
        a: 'Browsing properties is free. Listing properties and using certain premium features may require a subscription. Service inquiries are always free.',
      },
    ],
  },
  {
    title: 'Properties',
    icon: <FiHome className="w-5 h-5" />,
    questions: [
      {
        q: 'How do I list my property?',
        a: 'Sign in to your account, go to "Create Listing" from your dashboard, fill in the property details, upload photos, and submit for review. Listings are typically approved within 24 hours.',
      },
      {
        q: 'How do I report a fake listing?',
        a: 'Click the "Report" button on any listing page or visit the Admin Reported Content section. Our team reviews all reports within 48 hours.',
      },
    ],
  },
  {
    title: 'Services & Inquiries',
    icon: <FiTool className="w-5 h-5" />,
    questions: [
      {
        q: 'How do service inquiries work?',
        a: 'Navigate to the Services page, select the service you need, fill out the inquiry form with your details and requirements. Our team reviews your inquiry and connects you with a verified professional within 24 hours.',
      },
      {
        q: 'What services does VectorAfriq offer?',
        a: 'We offer Property Valuation, Survey & Mapping, Legal/Conveyancing, Mortgage Assistance, Architectural & Construction, Movers, Property Management, and Diaspora Services.',
      },
      {
        q: 'How long does it take to get a response?',
        a: 'Our team typically responds to all service inquiries within 24 hours during business days. You will receive a confirmation email immediately and a detailed response shortly after.',
      },
    ],
  },
  {
    title: 'For Agents',
    icon: <FiUsers className="w-5 h-5" />,
    questions: [
      {
        q: 'How do I become a listed agent?',
        a: 'Create an account, complete your profile with company information and rate cards, then start creating listings. Your agent profile will be visible to potential clients.',
      },
      {
        q: 'How do lead management works?',
        a: 'When a user inquires about your listing, it appears in your Lead Management dashboard. You can track, respond to, and manage all leads from one place.',
      },
    ],
  },
];

/* ──────────── Support Page Component ──────────── */

export default function AdminSupportPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="mt-1 text-sm text-gray-500">
          Find answers to common questions, access resources, and get in touch with our support team.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/service-inquiries"
          className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-[#468AD1]/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#468AD1]/10 flex items-center justify-center text-[#468AD1] group-hover:bg-[#468AD1] group-hover:text-white transition-all">
            <FiMessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Service Inquiries</h3>
            <p className="text-xs text-gray-500">Manage client requests</p>
          </div>
        </Link>

        <Link
          href="/admin/surveyors"
          className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-[#468AD1]/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#514f63]/10 flex items-center justify-center text-[#514f63] group-hover:bg-[#514f63] group-hover:text-white transition-all">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Due Diligence</h3>
            <p className="text-xs text-gray-500">Surveyor & legal inquiries</p>
          </div>
        </Link>

        <Link
          href="/admin/reported-content"
          className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-[#468AD1]/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
            <FiTool className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Reported Content</h3>
            <p className="text-xs text-gray-500">Review flagged items</p>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-[#468AD1]/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all">
            <FiFileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">System Settings</h3>
            <p className="text-xs text-gray-500">Configure the platform</p>
          </div>
        </Link>
      </div>

      {/* FAQ Section */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <FiBook className="w-5 h-5 text-[#468AD1]" />
          <h2 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-6">
          {faqCategories.map((category, catIdx) => (
            <div key={catIdx}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#514f63]">{category.icon}</span>
                <h3 className="font-semibold text-gray-800">{category.title}</h3>
              </div>
              <div className="space-y-2 ml-7">
                {category.questions.map((faq, faqIdx) => {
                  const key = `${catIdx}-${faqIdx}`;
                  const isOpen = openFaq === key;
                  return (
                    <div key={faqIdx} className="border border-gray-100 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : key)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <FiChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FiMail className="w-5 h-5 text-[#468AD1]" />
          <h2 className="text-lg font-bold text-gray-900">Contact Support</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Can&apos;t find what you&apos;re looking for? Reach out to our support team directly.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="mailto:support@vectorafriqproperties.co.ke"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#468AD1]/30 hover:bg-gray-50 transition-all"
          >
            <FiMail className="w-5 h-5 text-[#468AD1]" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Email</p>
              <p className="text-xs text-gray-500">support@vectorafriqproperties.co.ke</p>
            </div>
          </a>
          <a
            href="tel:+254700000000"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#468AD1]/30 hover:bg-gray-50 transition-all"
          >
            <FiPhone className="w-5 h-5 text-[#468AD1]" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Phone</p>
              <p className="text-xs text-gray-500">+254 700 000 000</p>
            </div>
          </a>
          <Link
            href="/contact-us"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#468AD1]/30 hover:bg-gray-50 transition-all"
          >
            <FiExternalLink className="w-5 h-5 text-[#468AD1]" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Contact Page</p>
              <p className="text-xs text-gray-500">Visit our contact page</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
