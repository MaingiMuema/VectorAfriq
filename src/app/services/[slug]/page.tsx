import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { services, getServiceBySlug, serviceSlugs } from '@/lib/services-config';
import ServicePageContent from '@/components/services/ServicePageContent';
import {
  getServicePageBySlug,
  findRedirectForSlug,
} from '@/lib/servicePages';
import { overlayPageOverride } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  // Try database config first
  const dbPage = await getServicePageBySlug(slug);
  if (dbPage) {
    const service = getServiceBySlug(dbPage.configKey);
    const title = dbPage.ogTitle || dbPage.metaTitle || `${service?.title || dbPage.title} | VectorAfriq Kenya`;
    const description = dbPage.ogDescription || dbPage.metaDescription || service?.metaDescription || '';
    const canonical = dbPage.canonicalUrl || `https://vectorafriqproperties.co.ke/services/${dbPage.slug}`;

    const baseMetadata: Metadata = {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title: dbPage.ogTitle || dbPage.metaTitle,
        description: dbPage.ogDescription || dbPage.metaDescription,
        type: 'website',
      },
    };

    return overlayPageOverride(`/services/${dbPage.slug}`, baseMetadata, { type: 'service', id: dbPage.id });
  }

  // Fallback to static config
  const service = getServiceBySlug(slug);
  if (!service) return {};

  const baseMetadata: Metadata = {
    title: `${service.title} | VectorAfriq Kenya`,
    description: service.metaDescription,
    openGraph: {
      title: `${service.title} | VectorAfriq Kenya`,
      description: service.metaDescription,
      type: 'website',
    },
  };

  return overlayPageOverride(`/services/${slug}`, baseMetadata, { type: 'service', id: slug });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Check if this slug matches a current active service page in DB
  const dbPage = await getServicePageBySlug(slug);

  if (dbPage) {
    // Use database config — map to the static service config for content
    const service = getServiceBySlug(dbPage.configKey);
    if (!service) notFound();
    return <ServicePageContent service={service} />;
  }

  // 2. Check if this is an old slug that needs a 301 redirect
  const redirectSlug = await findRedirectForSlug(slug);
  if (redirectSlug) {
    redirect(`/services/${redirectSlug}`);
  }

  // 3. Fallback: try matching against static config slugs directly
  const staticService = getServiceBySlug(slug);
  if (staticService) {
    return <ServicePageContent service={staticService} />;
  }

  // 4. Nothing found
  notFound();
}
