import { NextResponse } from "next/server";
import { query, type DatabaseValue } from "@/lib/db";
import { parseServiceAreas } from "@/lib/logistics";
import { ensureSurveyorProfileSchema } from "@/lib/surveyorSchema";

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

function formatSurveyor(row: SurveyorRow) {
  return {
    id: row.id,
    userId: row.userId,
    professionalType: row.professionalType,
    businessName: row.businessName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    licenseNumber: row.licenseNumber,
    qualification: row.qualification,
    experience: row.experience,
    bio: row.bio,
    profileImageUrl: row.profileImageUrl,
    location: row.location,
    serviceAreas: parseServiceAreas(row.serviceAreas),
    specializations: parseServiceAreas(row.specializations),
    hourlyRate: row.hourlyRate,
    consultationFee: row.consultationFee,
    availableOnline: Boolean(row.availableOnline),
    availabilityStatus: row.availabilityStatus,
    averageRating: row.averageRating,
    totalReviews: row.totalReviews,
    totalJobs: row.totalJobs,
    createdAt: row.createdAt,
    userName: row.userName,
  };
}

export async function GET(request: Request) {
  try {
    await ensureSurveyorProfileSchema();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const location = searchParams.get("location")?.trim() || "";
    const professionalType = searchParams.get("professionalType") || "ALL";
    const specialization = searchParams.get("specialization")?.trim() || "";
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(Number(searchParams.get("limit") || 12), 50);
    const offset = (page - 1) * limit;
    const featured = searchParams.get("featured") === "true";

    let whereClause =
      "WHERE sp.approvalStatus = 'APPROVED' AND sp.availabilityStatus <> 'OFFLINE'";
    const params: DatabaseValue[] = [];

    if (search) {
      whereClause +=
        " AND (sp.businessName LIKE ? OR sp.location LIKE ? OR sp.specializations LIKE ? OR u.name LIKE ? OR sp.bio LIKE ?)";
      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    if (location) {
      whereClause += " AND (sp.location LIKE ? OR sp.serviceAreas LIKE ?)";
      params.push(`%${location}%`, `%${location}%`);
    }

    if (professionalType !== "ALL") {
      whereClause += " AND sp.professionalType = ?";
      params.push(professionalType);
    }

    if (specialization) {
      whereClause += " AND sp.specializations LIKE ?";
      params.push(`%${specialization}%`);
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
        sp.averageRating DESC,
        sp.totalJobs DESC,
        sp.createdAt DESC
      LIMIT ? OFFSET ?
      `,
      [...params, featured ? 6 : limit, featured ? 0 : offset]
    );

    return NextResponse.json({
      surveyors: surveyors.map(formatSurveyor),
      total: Number(count.total),
      page,
      pages: Math.ceil(Number(count.total) / limit),
      limit: featured ? 6 : limit,
    });
  } catch (error) {
    console.error("[SURVEYORS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch surveyors" },
      { status: 500 }
    );
  }
}
