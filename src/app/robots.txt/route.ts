import { NextResponse } from "next/server";

export async function GET() {
  // Return a simple, reliable robots.txt
  const robotsContent = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /crm/
Disallow: /api/
Disallow: /_next/
Disallow: /static/

Sitemap: https://vectorafriqproperties.co.ke/sitemap.xml`;

  return new NextResponse(robotsContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}
