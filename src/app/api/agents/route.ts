import { NextResponse } from "next/server";
import { query, type DatabaseValue } from "@/lib/db";

import type { BadgeTier } from "@/types";

interface Agent {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  avatar: string | null;
  specialization: string | null;
  languages: string | null;
  socialMedia: string | null;
  badgeTier: BadgeTier;
  createdAt: Date;
  updatedAt: Date;
  properties_count: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const requestedLimit = parseInt(searchParams.get("limit") || "20") || 20;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";

    const skip = (page - 1) * limit;

    let whereClause = "WHERE u.role = 'AGENT'";
    const params: DatabaseValue[] = [];

    if (search) {
      whereClause += " AND (u.name LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (location) {
      whereClause += " AND EXISTS (SELECT 1 FROM property p2 WHERE p2.userId = u.id AND p2.location LIKE ?)";
      params.push(`%${location}%`);
    }

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `
      SELECT COUNT(*) as total 
      FROM user u
      ${whereClause}
    `,
      params
    );

    const total = countResult.total;

    // Get agents with property counts
    const agents = await query<Agent>(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.bio,
        u.avatar,
        u.specialization,
        u.languages,
        u.socialMedia,
        u.badgeTier,
        u.createdAt,
        u.updatedAt,
        COUNT(DISTINCT p.id) as properties_count
      FROM user u
      LEFT JOIN property p ON u.id = p.userId
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [...params, limit, skip]
    );

    // Format the response
    const formattedAgents = agents.map((agent) => ({
      id: agent.id,
      name: agent.name || 'Unknown Agent',
      email: agent.email,
      phone: agent.phone || '',
      bio: agent.bio || '',
      avatar: agent.avatar || '/images/placeholder.png',
      specialization: agent.specialization 
        ? JSON.parse(agent.specialization) 
        : ['General Properties'],
      languages: agent.languages 
        ? JSON.parse(agent.languages) 
        : ['English'],
      socialMedia: agent.socialMedia 
        ? JSON.parse(agent.socialMedia) 
        : {},
      properties_count: Number(agent.properties_count),
      badgeTier: agent.badgeTier || 'NONE',
      createdAt: agent.createdAt,
    }));

    return NextResponse.json({
      agents: formattedAgents,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
