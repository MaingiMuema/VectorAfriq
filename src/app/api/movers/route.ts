import { NextResponse } from "next/server";
import { query, type DatabaseValue } from "@/lib/db";
import { formatMoverProfile } from "@/lib/logistics";
import type { MoverProfile } from "@/types/logistics";

interface MoverRow extends Omit<MoverProfile, "serviceAreas"> {
  serviceAreas: string | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const location = searchParams.get("location")?.trim() || "";
    const minCapacity = Number(searchParams.get("minCapacity") || 0);
    const limit = Math.min(Number(searchParams.get("limit") || 30), 100);

    let whereClause =
      "WHERE mp.approvalStatus = 'APPROVED' AND mp.availabilityStatus <> 'OFFLINE'";
    const params: DatabaseValue[] = [];

    if (search) {
      whereClause +=
        " AND (mp.businessName LIKE ? OR mp.vehicleType LIKE ? OR mp.vehiclePlate LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (location) {
      whereClause += " AND (mp.baseLocation LIKE ? OR mp.serviceAreas LIKE ?)";
      params.push(`%${location}%`, `%${location}%`);
    }

    if (minCapacity > 0) {
      whereClause += " AND mp.vehicleCapacityKg >= ?";
      params.push(minCapacity);
    }

    const movers = await query<MoverRow>(
      `
      SELECT
        mp.*,
        u.name as userName,
        u.email as userEmail
      FROM mover_profiles mp
      INNER JOIN user u ON u.id = mp.userId
      ${whereClause}
      ORDER BY
        CASE mp.availabilityStatus WHEN 'AVAILABLE' THEN 0 WHEN 'BUSY' THEN 1 ELSE 2 END,
        mp.averageRating DESC,
        mp.createdAt DESC
      LIMIT ?
      `,
      [...params, limit]
    );

    return NextResponse.json({
      movers: movers.map((mover) => formatMoverProfile(mover)),
    });
  } catch (error) {
    console.error("[MOVERS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch movers" },
      { status: 500 }
    );
  }
}
