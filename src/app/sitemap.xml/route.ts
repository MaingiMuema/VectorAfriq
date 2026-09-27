import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  buildSearchResultsPath,
  getPublicLocationSlug,
  SearchListingType,
} from "@/lib/search/searchUrl";
import { buildListingUrl } from "@/lib/seo/routes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SitemapUrl {
  url: string;
  priority: number;
  changeFreq: string;
  lastMod: string | null;
  isActive: boolean;
}

interface Property {
  id: string;
  title: string;
  updatedAt: string;
}

interface BlogPostSitemapRow {
  slug: string;
  updatedAt: string;
}

interface CountySitemapRow {
  slug: string;
  updatedAt: string;
}

interface CitySitemapRow {
  slug: string;
  countySlug: string;
  updatedAt: string;
}

interface NeighborhoodSitemapRow {
  slug: string;
  citySlug: string;
  countySlug: string;
  updatedAt: string;
}

interface ServicePageSitemapRow {
  slug: string;
  updatedAt: string;
}

export async function GET() {
  try {
    // Check if sitemap is enabled
    const [sitemapConfig] = await query<{ value: string }>(
      "SELECT value FROM seo_config WHERE `key` = 'SITEMAP_ENABLED'"
    );

    if (sitemapConfig?.value !== 'true') {
      return new NextResponse("Sitemap generation is disabled", { status: 403 });
    }

    // Get site URL
    const [siteUrlConfig] = await query<{ value: string }>(
      "SELECT value FROM seo_config WHERE `key` = 'SITE_URL'"
    );
    const siteUrl = siteUrlConfig?.value || 'https://vectorafriqproperties.co.ke';

    // Fetch static URLs from sitemap_url table
    const staticUrls = await query<SitemapUrl>(
      "SELECT url, priority, changeFreq, lastMod FROM sitemap_url WHERE isActive = true ORDER BY priority DESC, url ASC"
    );

    // Fetch dynamic property URLs (with title for SEO-friendly slug URLs)
    const properties = await query<Property>(
      `SELECT id, title, updatedAt FROM property
       WHERE status = 'ACTIVE'
       ORDER BY updatedAt DESC
       LIMIT 1000`
    );

    // Fetch published blog posts for sitemap
    const blogPosts = await query<BlogPostSitemapRow>(
      `SELECT slug, updatedAt FROM post WHERE published = true ORDER BY createdAt DESC`
    ).catch(() => [] as BlogPostSitemapRow[]);

    // Fetch active service pages with their custom slugs
    // Uses .catch() so the sitemap still works if the service_pages table doesn't exist yet
    const servicePages = await query<ServicePageSitemapRow>(
      `SELECT slug, updatedAt FROM service_pages WHERE isActive = 1 ORDER BY sortOrder ASC`
    ).catch(() => [] as ServicePageSitemapRow[]);

    // Fetch location URLs for dynamic search pages
    const [counties, cities, neighborhoods] = await Promise.all([
      query<CountySitemapRow>("SELECT slug, updatedAt FROM county LIMIT 50"),
      query<CitySitemapRow>(
        `
          SELECT c.slug, co.slug AS countySlug, c.updatedAt
          FROM city c
          JOIN county co ON c.countyId = co.id
          LIMIT 50
        `
      ),
      query<NeighborhoodSitemapRow>(
        `
          SELECT n.slug, c.slug AS citySlug, co.slug AS countySlug, n.updatedAt
          FROM neighborhood n
          JOIN city c ON n.cityId = c.id
          JOIN county co ON n.countyId = co.id
          LIMIT 50
        `
      ),
    ]);

    // Generate XML sitemap
    const xmlContent = generateSitemapXML(siteUrl, staticUrls, properties, counties, cities, neighborhoods, servicePages, blogPosts);

    return new NextResponse(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error("Error generating sitemap:", error);
    
    // Return a basic sitemap in case of error
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://vectorafriqproperties.co.ke/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(basicSitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}

function generateSitemapXML(
  siteUrl: string, 
  staticUrls: SitemapUrl[], 
  properties: Property[], 
  counties: CountySitemapRow[],
  cities: CitySitemapRow[],
  neighborhoods: NeighborhoodSitemapRow[],
  servicePages: ServicePageSitemapRow[],
  blogPosts: BlogPostSitemapRow[]
): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';

  // Static URLs
  const staticEntries = staticUrls.map(url => {
    const lastmod = url.lastMod ? new Date(url.lastMod).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return `  <url>
    <loc>${escapeXml(`${siteUrl}${url.url}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${url.changeFreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
  }).join('\n');

  // Service page URLs — uses the admin-configured slugs for SEO-friendly paths
  const serviceIndexDate = new Date().toISOString().split('T')[0];
  const servicePageEntries = [
    // The /services index page itself
    `  <url>
    <loc>${escapeXml(`${siteUrl}/services`)}</loc>
    <lastmod>${serviceIndexDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`,
    // Individual service pages from the database
    ...servicePages.map(sp => {
      const lastmod = new Date(sp.updatedAt).toISOString().split('T')[0];
      return `  <url>
    <loc>${escapeXml(`${siteUrl}/services/${sp.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }),
  ].join('\n');

  // Property URLs — use SEO-friendly /listings/{slug}/{id} pattern
  const propertyEntries = properties.map(property => {
    const lastmod = new Date(property.updatedAt).toISOString().split("T")[0];
    const listingPath = buildListingUrl(property);
    return `  <url>
    <loc>${escapeXml(`${siteUrl}${listingPath}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  // Blog post URLs — /blogs/{slug}
  const blogIndexDate = new Date().toISOString().split("T")[0];
  const blogEntries = [
    // Blog index page
    `  <url>
    <loc>${escapeXml(`${siteUrl}/blogs`)}</loc>
    <lastmod>${blogIndexDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    // Individual blog posts
    ...blogPosts.map(post => {
      const lastmod = new Date(post.updatedAt).toISOString().split("T")[0];
      return `  <url>
    <loc>${escapeXml(`${siteUrl}/blogs/${post.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }),
  ].join('\n');

  // Canonical search result URLs
  const inventoryTypes: SearchListingType[] = ["sale", "rent", "airbnb"];
  const locationEntries: string[] = [];

  counties.forEach((county) => {
    inventoryTypes.forEach((listingType) => {
      const lastmod = new Date(county.updatedAt).toISOString().split('T')[0];
      const path = buildSearchResultsPath({
        listingType,
        locationSegments: [getPublicLocationSlug(county.slug, "county")],
      });

      locationEntries.push(`  <url>
    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
    });
  });

  cities.forEach((city) => {
    inventoryTypes.forEach((listingType) => {
      const lastmod = new Date(city.updatedAt).toISOString().split('T')[0];
      const path = buildSearchResultsPath({
        listingType,
        locationSegments: [
          getPublicLocationSlug(city.countySlug, "county"),
          getPublicLocationSlug(city.slug, "city"),
        ],
      });

      locationEntries.push(`  <url>
    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
    });
  });

  neighborhoods.forEach((neighborhood) => {
    inventoryTypes.forEach((listingType) => {
      const lastmod = new Date(neighborhood.updatedAt).toISOString().split('T')[0];
      const path = buildSearchResultsPath({
        listingType,
        locationSegments: [
          getPublicLocationSlug(neighborhood.countySlug, "county"),
          getPublicLocationSlug(neighborhood.citySlug, "city"),
          getPublicLocationSlug(neighborhood.slug, "neighborhood"),
        ],
      });

      locationEntries.push(`  <url>
    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`);
    });
  });

  return `${xmlHeader}
${urlsetOpen}
${staticEntries}
${servicePageEntries}
${propertyEntries}
${blogEntries}
${locationEntries.join('\n')}
${urlsetClose}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
