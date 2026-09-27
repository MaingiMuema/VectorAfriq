import { NextResponse } from "next/server";
import { getServicePageLinks } from "@/lib/servicePages";

// GET /api/service-pages/links — public endpoint for navbar/footer links
export async function GET() {
  try {
    const links = await getServicePageLinks();
    return NextResponse.json({ links });
  } catch {
    // Fallback to static links on DB error
    return NextResponse.json({
      links: [
        { slug: 'property-valuation', title: 'Property Valuation' },
        { slug: 'survey-mapping', title: 'Survey & Mapping' },
        { slug: 'legal-conveyancing', title: 'Legal / Conveyancing' },
        { slug: 'mortgage-assistance', title: 'Mortgage Assistance' },
        { slug: 'architectural-construction', title: 'Architectural & Construction' },
        { slug: 'movers', title: 'Movers' },
        { slug: 'property-management', title: 'Property Management' },
        { slug: 'diaspora-services', title: 'Diaspora Services' },
      ],
    });
  }
}
