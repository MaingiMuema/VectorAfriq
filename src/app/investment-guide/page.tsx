import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
  title: "Property Investment Guide Kenya",
  description:
    "Comprehensive guide to investing in Kenyan real estate. Learn about market trends, legal requirements, financing options, and investment strategies.",
  alternates: {
    canonical: '/investment-guide',
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${SITE_URL}/investment-guide#article`,
      "headline": "Kenya Property Investment Guide",
      "description": "Comprehensive guide to investing in Kenyan real estate — market trends, legal requirements, financing options, and investment strategies.",
      "url": `${SITE_URL}/investment-guide`,
      "author": {
        "@type": "Organization",
        "name": "VectorAfriq Kenya",
        "url": SITE_URL,
      },
      "publisher": {
        "@type": "Organization",
        "name": "VectorAfriq Kenya",
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_URL}/vectorafriq-logo-removebg-preview.png`,
        },
      },
      "mainEntityOfPage": { "@type": "WebPage", "@id": `${SITE_URL}/investment-guide` },
      "inLanguage": "en-KE",
      "about": "Real estate investment in Kenya",
      "keywords": "property investment Kenya, real estate investment, Kenya market trends, property legal requirements",
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Investment Guide", "item": `${SITE_URL}/investment-guide` },
      ],
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/investment-guide", baseMetadata);
}

export default function InvestmentGuide() {
  return (
    <>
      <script
        id="investment-guide-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <div className="bg-[#514f63] text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 pt-5">
              Property Investment Guide
            </h1>
            <p className="text-xl text-gray-200 max-w-3xl">
              Your comprehensive resource for understanding real estate investment
              opportunities in Kenya
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Why Invest Section */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-[#514f63]">
                Why Invest in Kenyan Real Estate?
              </h2>
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <p>
                  The Kenyan real estate market offers numerous opportunities for
                  investors:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Rapid urbanization and population growth</li>
                  <li>Growing middle class with increasing purchasing power</li>
                  <li>Strong rental yields in major cities</li>
                  <li>Strategic location as East Africa&apos;s business hub</li>
                  <li>Improving infrastructure and connectivity</li>
                </ul>
              </div>
            </section>

            {/* Investment Options */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-[#514f63]">
                Types of Property Investments
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-[#468AD1]">
                    Residential Properties
                  </h3>
                  <ul className="space-y-2">
                    <li>• Apartments and condominiums</li>
                    <li>• Single-family homes</li>
                    <li>• Townhouses</li>
                    <li>• High-rise developments</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-[#468AD1]">
                    Commercial Properties
                  </h3>
                  <ul className="space-y-2">
                    <li>• Office spaces</li>
                    <li>• Retail outlets</li>
                    <li>• Industrial warehouses</li>
                    <li>• Mixed-use developments</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Legal Considerations */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-[#514f63]">
                Legal Considerations
              </h2>
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <p>
                  Key legal aspects to consider when investing in Kenyan real
                  estate:
                </p>
                <ul className="space-y-3">
                  <li>• Due diligence on property ownership and documentation</li>
                  <li>• Understanding land tenure systems</li>
                  <li>• Property registration and transfer processes</li>
                  <li>• Tax implications and obligations</li>
                  <li>• Building codes and zoning regulations</li>
                </ul>
              </div>
            </section>

            {/* Investment Strategy */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-[#514f63]">
                Building Your Investment Strategy
              </h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#468AD1]">
                      1. Market Research
                    </h3>
                    <p>
                      Understand local market trends, pricing, and growth
                      potential
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#468AD1]">
                      2. Financial Planning
                    </h3>
                    <p>
                      Evaluate financing options, calculate potential returns, and
                      assess risks
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#468AD1]">
                      3. Property Selection
                    </h3>
                    <p>
                      Choose properties based on location, condition, and growth
                      prospects
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#468AD1]">
                      4. Professional Support
                    </h3>
                    <p>
                      Work with real estate agents, lawyers, and property managers
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="bg-[#514f63] text-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Start Investing?
              </h2>
              <p className="mb-6">
                Browse our selection of investment properties or contact our
                experts for guidance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/properties"
                  className="bg-[#468AD1] text-white px-6 py-3 rounded-lg hover:bg-[#2F6FAE] transition-colors"
                >
                  View Properties
                </Link>
                <Link
                  href="/contact-us"
                  className="bg-white text-[#514f63] px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
