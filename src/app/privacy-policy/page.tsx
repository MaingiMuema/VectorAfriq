import Link from "next/link";
import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for VectorAfriq - Learn how we collect, use, and protect your personal information.",
  alternates: {
    canonical: '/privacy-policy',
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/privacy-policy#webpage`,
      "name": "Privacy Policy | VectorAfriq Kenya",
      "url": `${SITE_URL}/privacy-policy`,
      "description": "VectorAfriq Kenya's privacy policy — how we collect, use, and protect your personal data.",
      "publisher": { "@id": `${SITE_URL}/#organization` },
      "inLanguage": "en-KE",
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": `${SITE_URL}/privacy-policy` },
      ],
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/privacy-policy", baseMetadata);
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <script
        id="privacy-policy-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-12 mt-20">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-600 mb-8">Last updated: January 23, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Overview
            </h2>
            <p className="text-gray-600 mb-4">
              VectorAfriq Kenya we are committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you visit our website and use our
              services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Information We Collect
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-gray-900">
                Personal Information
              </h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Name and contact information</li>
                <li>Email address and phone number</li>
                <li>User account credentials</li>
                <li>Property preferences and search history</li>
                <li>Communication history with agents and other users</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mt-6">
                Technical Information
              </h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>IP address and browser information</li>
                <li>Device information</li>
                <li>Cookies and usage data</li>
                <li>Location data (if permitted)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Provide and improve our services</li>
              <li>Process your requests and transactions</li>
              <li>Send you updates and marketing communications</li>
              <li>Analyze and improve our platform&apos;s performance</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Information Sharing
            </h2>
            <p className="text-gray-600 mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Real estate agents and property owners (with your consent)</li>
              <li>Service providers and business partners</li>
              <li>Legal authorities when required by law</li>
              <li>Third-party analytics services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your Rights
            </h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Security
            </h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate security measures to protect your
              information from unauthorized access, alteration, disclosure, or
              destruction. However, no internet transmission is completely secure,
              and we cannot guarantee the security of your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 mb-4">
              If you have questions about this Privacy Policy, please contact us
              at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Email: info@vectorafriqproperties.co.ke</p>
              <p className="text-gray-600">Phone: +254 23310245</p>
              <p className="text-gray-600">Address: Kitengela, Kenya</p>
            </div>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              By using VectorAfriq, you agree to this Privacy Policy. We may
              update this policy periodically, and will notify you of any material
              changes.
            </p>
            <div className="mt-4">
              <Link
                href="/terms-conditions"
                className="text-sm text-[#468AD1] hover:text-[#2F6FAE]"
              >
                View Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
