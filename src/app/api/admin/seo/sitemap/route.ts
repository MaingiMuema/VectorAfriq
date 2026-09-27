import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface SitemapUrl {
  id: string;
  url: string;
  priority: number;
  changeFreq: string;
  lastMod: string | null;
  isActive: boolean;
  urlType: string;
  entityId: string | null;
}

interface Property {
  id: string;
  title: string;
  updatedAt: string;
}

interface SitemapUrlData {
  url: string;
  priority: number;
  changeFreq: string;
  isActive: boolean;
}

interface SitemapEntry {
  url: string;
  priority: number;
  changefreq: string;
  lastmod: string;
}

// GET - Generate and return sitemap
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "xml";
    const download = searchParams.get("download") === "true";

    // Check if sitemap is enabled
    const [sitemapConfig] = await query<{ value: string }>(
      "SELECT value FROM seo_config WHERE `key` = 'SITEMAP_ENABLED'"
    );

    if (sitemapConfig?.value !== 'true') {
      return NextResponse.json(
        { error: "Sitemap generation is disabled" },
        { status: 403 }
      );
    }

    // Get site URL
    const [siteUrlConfig] = await query<{ value: string }>(
      "SELECT value FROM seo_config WHERE `key` = 'SITE_URL'"
    );
    const siteUrl = siteUrlConfig?.value || 'https://vectorafriqproperties.co.ke';

    // Fetch static URLs from sitemap_url table
    const staticUrls = await query<SitemapUrl>(
      "SELECT * FROM sitemap_url WHERE isActive = true ORDER BY priority DESC, url ASC"
    );

    // Fetch dynamic property URLs
    const properties = await query<Property>(
      `SELECT id, title, updatedAt FROM property 
       WHERE status = 'ACTIVE' 
       ORDER BY updatedAt DESC 
       LIMIT 1000`
    );

    // Combine all URLs
    const allUrls = [
      ...staticUrls.map(url => ({
        url: `${siteUrl}${url.url}`,
        priority: url.priority,
        changefreq: url.changeFreq,
        lastmod: url.lastMod || new Date().toISOString(),
      })),
      ...properties.map(property => ({
        url: `${siteUrl}/properties/${property.id}`,
        priority: 0.6,
        changefreq: 'weekly',
        lastmod: property.updatedAt,
      })),
    ];

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        sitemap: {
          urls: allUrls,
          totalUrls: allUrls.length,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Generate XML sitemap
    const xmlContent = generateSitemapXML(allUrls);

    if (download) {
      return new NextResponse(xmlContent, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="sitemap-${new Date().toISOString().split('T')[0]}.xml"`,
        },
      });
    }

    return new NextResponse(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

  } catch (error) {
    console.error("Error generating sitemap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update sitemap URLs
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      // If no JSON body, default to regenerate action
      body = { action: 'regenerate' };
    }
    
    const { action, urls } = body;

    if (action === 'regenerate' || !action) {
      // Regenerate dynamic URLs (properties)
      await regenerateDynamicUrls();
      
      return NextResponse.json({
        success: true,
        message: "Sitemap URLs regenerated successfully",
      });
    }

    if (action === 'update' && urls) {
      // Update specific URLs
      const updatePromises = urls.map(async (urlData: SitemapUrlData) => {
        const { url, priority, changeFreq, isActive } = urlData;
        
        return query(
          `UPDATE sitemap_url
           SET priority = ?, changeFreq = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP(3)
           WHERE url = ?`,
          [priority, changeFreq, isActive, url]
        );
      });

      await Promise.all(updatePromises);

      return NextResponse.json({
        success: true,
        message: "Sitemap URLs updated successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error updating sitemap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateSitemapXML(urls: SitemapEntry[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';

  const urlEntries = urls.map(url => {
    const lastmod = new Date(url.lastmod).toISOString().split('T')[0];
    return `  <url>
    <loc>${escapeXml(url.url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
  }).join('\n');

  return `${xmlHeader}
${urlsetOpen}
${urlEntries}
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

async function regenerateDynamicUrls(): Promise<void> {
  // Remove existing dynamic URLs
  await query("DELETE FROM sitemap_url WHERE urlType = 'property'");

  // Get all active properties
  const properties = await query<Property>(
    "SELECT id, title, updatedAt FROM property WHERE status = 'ACTIVE'"
  );

  // Insert property URLs
  const insertPromises = properties.map(property => {
    const id = `sitemap_prop_${property.id}`;
    return query(
      `INSERT INTO sitemap_url (id, url, priority, changeFreq, lastMod, urlType, entityId, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        `/properties/${property.id}`,
        0.6,
        'weekly',
        property.updatedAt,
        'property',
        property.id,
        true
      ]
    );
  });

  await Promise.all(insertPromises);
}
