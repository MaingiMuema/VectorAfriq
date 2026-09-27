import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// Types for database operations
export interface DbLead {
  id: string;
  type: "CHAT" | "PHONE" | "EMAIL";
  status: "BASIC" | "SILVER" | "GOLD";
  description: string;
  propertyId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  property_title: string;
  property_price: number;
  property_location: string;
  property_type: string;
  property_category: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build the WHERE clause
    const whereClause = ["1 = 1"]; // Always true to start the WHERE clause
    const params: (string | number)[] = [];

    if (status && status !== "all") {
      whereClause.push("l.status = ?");
      params.push(status);
    }

    if (type && type !== "all") {
      whereClause.push("l.type = ?");
      params.push(type);
    }

    if (search) {
      whereClause.push(
        "(p.title LIKE ? OR u.name LIKE ? OR l.description LIKE ?)"
      );
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add pagination parameters
    params.push(limit, skip);

    // Query for leads count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM lead l
      LEFT JOIN property p ON l.propertyId = p.id
      LEFT JOIN user u ON l.userId = u.id
      WHERE ${whereClause.join(" AND ")}
    `;

    // Query for leads with property and user details
    const leadsQuery = `
      SELECT 
        l.*,
        p.title as property_title,
        p.price as property_price,
        p.location as property_location,
        p.type as property_type,
        p.category as property_category,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM lead l
      LEFT JOIN property p ON l.propertyId = p.id
      LEFT JOIN user u ON l.userId = u.id
      WHERE ${whereClause.join(" AND ")}
      ORDER BY l.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const [totalResult, leads] = await Promise.all([
      query<{ total: number }>(countQuery, params.slice(0, -2)), // Remove pagination params
      query<DbLead>(leadsQuery, params),
    ]);

    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error("[Leads Fetch Error]:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch leads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
