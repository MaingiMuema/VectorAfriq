"use client";

import { useState } from "react";
import Link from "next/link";

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: `By accessing and using VectorAfriq's website and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.`,
  },
  {
    id: "account",
    title: "Account Registration",
    content: `To access certain features of our platform, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to maintain its accuracy.`,
  },
  {
    id: "listings",
    title: "Property Listings",
    content: `All property listings must be accurate and comply with local laws. VectorAfriq reserves the right to remove any listings that violate our policies or receive legitimate complaints.`,
  },
  {
    id: "intellectual",
    title: "Intellectual Property",
    content: `All content on VectorAfriq, including but not limited to text, graphics, logos, and software, is the property of VectorAfriq and is protected by copyright and other intellectual property laws.`,
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    content: `Your use of VectorAfriq is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.`,
  },
  {
    id: "limitation",
    title: "Limitation of Liability",
    content: `VectorAfriq shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use our services.`,
  },
  {
    id: "termination",
    title: "Account Termination",
    content: `We reserve the right to terminate or suspend your account and access to our services at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users or us.`,
  },
  {
    id: "modifications",
    title: "Modifications to Terms",
    content: `VectorAfriq reserves the right to modify these Terms at any time. We will notify users of any material changes through our website or via email.`,
  },
];

export default function TermsAndConditionsPage() {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b mt-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Terms and Conditions
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Last updated: January 2025
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sticky top-24">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? "bg-[#468AD1] text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
              <div className="prose max-w-none">
                <p className="text-gray-600 mb-8">
                  Welcome to VectorAfriq. These Terms and Conditions govern
                  your use of our website and services. Please read them
                  carefully before using our platform.
                </p>

                {sections.map((section) => (
                  <div
                    key={section.id}
                    id={section.id}
                    className={`scroll-mt-24 ${
                      activeSection === section.id ? "" : "opacity-60"
                    }`}
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {section.title}
                    </h2>
                    <p className="text-gray-600 mb-8">{section.content}</p>
                  </div>
                ))}

                <div className="mt-12 pt-8 border-t">
                  <p className="text-gray-600 text-sm">
                    For any questions about these Terms and Conditions, please{" "}
                    <Link
                      href="/contact-us"
                      className="text-[#468AD1] hover:underline"
                    >
                      contact us
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
