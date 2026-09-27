import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { unstable_cache } from "next/cache";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SessionProvider from "@/components/providers/SessionProvider";
import { AnalyticsProvider } from "@/components/analytics/VisitorTracker";
import { NavigationLoadingProvider } from "@/contexts/NavigationLoadingContext";
import { Toaster } from "react-hot-toast";
import SchemaMarkup, { buildOrganizationSchema, buildWebSiteSchema } from "@/components/seo/SchemaMarkup";
import { query } from "@/lib/db";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
});

// Base URL for all canonical URLs and metadata
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vectorafriqproperties.co.ke';

// Literal fallbacks — used whenever seo_config is unreachable or a key is unset.
const FALLBACK_DEFAULTS = {
  SITE_NAME: 'VectorAfriq',
  DEFAULT_TITLE: 'VectorAfriq | Find Your Dream Property in Kenya',
  DEFAULT_DESCRIPTION:
    'Browse through a wide selection of properties for sale and rent in Kenya. Find houses, apartments, land, and commercial properties.',
  DEFAULT_KEYWORDS: 'real estate, property, Kenya, houses for sale, apartments for rent, land for sale',
  DEFAULT_OG_IMAGE: '/images/og-default.jpg',
  GOOGLE_SITE_VERIFICATION: 'IPBjYdlhjja9F8sjHXWrLQMdbyAdeBEhpfxWQEXnaG4',
  BING_SITE_VERIFICATION: '',
};

type SiteDefaults = typeof FALLBACK_DEFAULTS;

const fetchSiteDefaults = unstable_cache(
  async (): Promise<SiteDefaults> => {
    const rows = await query<{ key: string; value: string | null }>(
      "SELECT `key`, `value` FROM seo_config WHERE `key` IN (?, ?, ?, ?, ?, ?, ?) AND isActive = true",
      [
        "SITE_NAME",
        "DEFAULT_TITLE",
        "DEFAULT_DESCRIPTION",
        "DEFAULT_KEYWORDS",
        "DEFAULT_OG_IMAGE",
        "GOOGLE_SITE_VERIFICATION",
        "BING_SITE_VERIFICATION",
      ]
    );
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      SITE_NAME: map.get("SITE_NAME") || FALLBACK_DEFAULTS.SITE_NAME,
      DEFAULT_TITLE: map.get("DEFAULT_TITLE") || FALLBACK_DEFAULTS.DEFAULT_TITLE,
      DEFAULT_DESCRIPTION: map.get("DEFAULT_DESCRIPTION") || FALLBACK_DEFAULTS.DEFAULT_DESCRIPTION,
      DEFAULT_KEYWORDS: map.get("DEFAULT_KEYWORDS") || FALLBACK_DEFAULTS.DEFAULT_KEYWORDS,
      DEFAULT_OG_IMAGE: map.get("DEFAULT_OG_IMAGE") || FALLBACK_DEFAULTS.DEFAULT_OG_IMAGE,
      GOOGLE_SITE_VERIFICATION: map.get("GOOGLE_SITE_VERIFICATION") || FALLBACK_DEFAULTS.GOOGLE_SITE_VERIFICATION,
      BING_SITE_VERIFICATION: map.get("BING_SITE_VERIFICATION") || FALLBACK_DEFAULTS.BING_SITE_VERIFICATION,
    };
  },
  ["root-layout-seo-config"],
  { tags: ["seo-config"], revalidate: 300 }
);

async function getSiteDefaults(): Promise<SiteDefaults> {
  try {
    return await fetchSiteDefaults();
  } catch (error) {
    console.error("[SEO] Failed to load seo_config defaults, using fallback literals:", error);
    return FALLBACK_DEFAULTS;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const d = await getSiteDefaults();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: d.DEFAULT_TITLE,
      template: `%s | ${d.SITE_NAME}`,
    },
    description: d.DEFAULT_DESCRIPTION,
    keywords: d.DEFAULT_KEYWORDS,
    verification: {
      google: d.GOOGLE_SITE_VERIFICATION || undefined,
      other: d.BING_SITE_VERIFICATION ? { "msvalidate.01": d.BING_SITE_VERIFICATION } : undefined,
    },
    icons: {
      icon: "/icon.png",
      shortcut: "/favicon.ico",
      apple: "/icon.png",
    },
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      siteName: d.SITE_NAME,
      title: d.DEFAULT_TITLE,
      description: d.DEFAULT_DESCRIPTION,
      images: [
        {
          url: d.DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: d.SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: d.DEFAULT_TITLE,
      description: d.DEFAULT_DESCRIPTION,
      images: [d.DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

interface RootLayoutProps {
  children: React.ReactNode;
  parallel?: React.ReactNode;
}

export default function RootLayout({ children, parallel }: RootLayoutProps) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en">
      <head>
        {/* Sitewide JSON-LD: Organization + WebSite (Searchbox) */}
        <SchemaMarkup id="schema-organization" schema={buildOrganizationSchema()} />
        <SchemaMarkup id="schema-website" schema={buildWebSiteSchema()} />
      </head>
      <body className={inter.className}>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}

        <Toaster position="top-right" />
        <SessionProvider>
          <AnalyticsProvider>
            <NavigationLoadingProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  {children}
                  {parallel}
                </main>
                <Footer />
              </div>
            </NavigationLoadingProvider>
          </AnalyticsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}