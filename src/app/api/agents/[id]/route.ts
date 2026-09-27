import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { BadgeTier } from "@/types";

interface AgentRow {
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
  properties_count: number;
  available_count: number;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
    }

    const [agent] = await query<AgentRow>(
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
        COUNT(DISTINCT p.id) as properties_count,
        COUNT(DISTINCT CASE WHEN p.status = 'AVAILABLE' THEN p.id END) as available_count
      FROM user u
      LEFT JOIN property p ON u.id = p.userId
      WHERE u.id = ? AND u.role = 'AGENT'
      GROUP BY u.id
      `,
      [id]
    );

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name || "Unknown Agent",
        email: agent.email,
        phone: agent.phone || "",
        bio: agent.bio || "",
        avatar: agent.avatar || "/images/placeholder.png",
        specialization: agent.specialization ? JSON.parse(agent.specialization) : ["General Properties"],
        languages: agent.languages ? JSON.parse(agent.languages) : ["English"],
        socialMedia: agent.socialMedia ? JSON.parse(agent.socialMedia) : {},
        badgeTier: agent.badgeTier || "NONE",
        createdAt: agent.createdAt,
        propertiesCount: Number(agent.properties_count),
        availableCount: Number(agent.available_count),
      },
    });
  } catch (error) {
    console.error("[AGENT_BY_ID_GET]", error);
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 });
  }
}
