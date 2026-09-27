import { NextResponse } from "next/server";
import { query, DatabaseValue } from "@/lib/db";

interface Partner {
  id: string;
  name: string;
  logo: string;
  link: string;
  createdAt: Date;
  updatedAt: Date;
}

function normalizePartnerLink(link: string): string {
  if (!link) return link;
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `https://${link}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (search) {
      whereClause += " AND (name LIKE ? OR link LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `
      SELECT COUNT(*) as total 
      FROM partner 
      ${whereClause}
    `,
      params
    );

    const total = countResult.total;

    // Get partners
    const partners = await query<Partner>(
      `
      SELECT * FROM partner
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [...params, limit, skip]
    );

    const normalizedPartners = partners.map((p) => ({
      ...p,
      link: normalizePartnerLink(p.link),
    }));

    return NextResponse.json({
      partners: normalizedPartners,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}