import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, type DatabaseValue } from "@/lib/db";
import { formatMoverProfile } from "@/lib/logistics";
import { ensureMoverProfileSchema } from "@/lib/moverSchema";
import type { MoverApprovalStatus, MoverProfile } from "@/types/logistics";

interface MoverRow extends Omit<MoverProfile, "serviceAreas"> {
  serviceAreas: string | null;
}

const allowedStatuses: MoverApprovalStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
  "BANNED",
];

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureMoverProfileSchema();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (status !== "ALL") {
      whereClause += " AND mp.approvalStatus = ?";
      params.push(status);
    }

    if (search) {
      whereClause +=
        " AND (mp.businessName LIKE ? OR mp.vehiclePlate LIKE ? OR u.email LIKE ? OR u.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [count] = await query<{ total: number }>(
      `
      SELECT COUNT(*) as total
      FROM mover_profiles mp
      INNER JOIN user u ON u.id = mp.userId
      ${whereClause}
      `,
      params
    );

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
        CASE mp.approvalStatus WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 ELSE 2 END,
        mp.createdAt DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return NextResponse.json({
      movers: movers.map((mover) => formatMoverProfile(mover)),
      total: Number(count.total),
      pages: Math.ceil(Number(count.total) / limit),
    });
  } catch (error) {
    console.error("[ADMIN_MOVERS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch movers" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureMoverProfileSchema();

    const body = await request.json();
    const id = String(body.id || "");
    const approvalStatus = String(body.approvalStatus || "") as MoverApprovalStatus;
    const reviewNotes = String(body.reviewNotes || "").trim() || null;

    if (!id || !allowedStatuses.includes(approvalStatus)) {
      return NextResponse.json(
        { error: "Invalid mover status update" },
        { status: 400 }
      );
    }

    await query(
      `
      UPDATE mover_profiles
      SET approvalStatus = ?,
        reviewNotes = ?,
        availabilityStatus = CASE
          WHEN ? IN ('SUSPENDED', 'BANNED', 'REJECTED') THEN 'OFFLINE'
          ELSE availabilityStatus
        END,
        updatedAt = NOW()
      WHERE id = ?
      `,
      [approvalStatus, reviewNotes, approvalStatus, id]
    );

    const [mover] = await query<MoverRow>(
      `
      SELECT mp.*, u.name as userName, u.email as userEmail
      FROM mover_profiles mp
      INNER JOIN user u ON u.id = mp.userId
      WHERE mp.id = ?
      `,
      [id]
    );

    if (!mover) {
      return NextResponse.json({ error: "Mover not found" }, { status: 404 });
    }

    return NextResponse.json({ mover: formatMoverProfile(mover) });
  } catch (error) {
    console.error("[ADMIN_MOVERS_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update mover" },
      { status: 500 }
    );
  }
}
