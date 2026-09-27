import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, type DatabaseValue } from "@/lib/db";
import { parseServiceAreas } from "@/lib/logistics";
import { ensureSurveyorProfileSchema } from "@/lib/surveyorSchema";
import type { SurveyorApprovalStatus } from "@/types/surveyor";

interface SurveyorRow {
  id: string;
  userId: string;
  professionalType: string;
  businessName: string;
  contactPhone: string;
  contactEmail: string | null;
  licenseNumber: string | null;
  licenseDocumentUrl: string | null;
  idNumber: string;
  idDocumentUrl: string | null;
  qualification: string | null;
  experience: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  location: string;
  serviceAreas: string | null;
  specializations: string | null;
  hourlyRate: number | null;
  consultationFee: number | null;
  availableOnline: boolean;
  availabilityStatus: string;
  approvalStatus: string;
  reviewNotes: string | null;
  averageRating: number;
  totalReviews: number;
  totalJobs: number;
  createdAt: string;
  updatedAt: string;
  userName?: string | null;
  userEmail?: string | null;
}

const allowedStatuses: SurveyorApprovalStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
  "BANNED",
];

function formatSurveyorRow(row: SurveyorRow) {
  return {
    ...row,
    serviceAreas: parseServiceAreas(row.serviceAreas),
    specializations: parseServiceAreas(row.specializations),
    availableOnline: Boolean(row.availableOnline),
  };
}

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
    await ensureSurveyorProfileSchema();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search")?.trim() || "";
    const professionalType = searchParams.get("professionalType") || "ALL";
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (status !== "ALL") {
      whereClause += " AND sp.approvalStatus = ?";
      params.push(status);
    }

    if (professionalType !== "ALL") {
      whereClause += " AND sp.professionalType = ?";
      params.push(professionalType);
    }

    if (search) {
      whereClause +=
        " AND (sp.businessName LIKE ? OR sp.location LIKE ? OR u.email LIKE ? OR u.name LIKE ? OR sp.licenseNumber LIKE ?)";
      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    const [count] = await query<{ total: number }>(
      `
      SELECT COUNT(*) as total
      FROM surveyor_profiles sp
      INNER JOIN user u ON u.id = sp.userId
      ${whereClause}
      `,
      params
    );

    const surveyors = await query<SurveyorRow>(
      `
      SELECT
        sp.*,
        u.name as userName,
        u.email as userEmail
      FROM surveyor_profiles sp
      INNER JOIN user u ON u.id = sp.userId
      ${whereClause}
      ORDER BY
        CASE sp.approvalStatus WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 ELSE 2 END,
        sp.createdAt DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return NextResponse.json({
      surveyors: surveyors.map(formatSurveyorRow),
      total: Number(count.total),
      pages: Math.ceil(Number(count.total) / limit),
    });
  } catch (error) {
    console.error("[ADMIN_SURVEYORS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch surveyors" },
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
    await ensureSurveyorProfileSchema();

    const body = await request.json();
    const id = String(body.id || "");
    const approvalStatus = String(
      body.approvalStatus || ""
    ) as SurveyorApprovalStatus;
    const reviewNotes = String(body.reviewNotes || "").trim() || null;

    if (!id || !allowedStatuses.includes(approvalStatus)) {
      return NextResponse.json(
        { error: "Invalid surveyor status update" },
        { status: 400 }
      );
    }

    await query(
      `
      UPDATE surveyor_profiles
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

    const [surveyor] = await query<SurveyorRow>(
      `
      SELECT sp.*, u.name as userName, u.email as userEmail
      FROM surveyor_profiles sp
      INNER JOIN user u ON u.id = sp.userId
      WHERE sp.id = ?
      `,
      [id]
    );

    if (!surveyor) {
      return NextResponse.json(
        { error: "Surveyor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ surveyor: formatSurveyorRow(surveyor) });
  } catch (error) {
    console.error("[ADMIN_SURVEYORS_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update surveyor" },
      { status: 500 }
    );
  }
}
