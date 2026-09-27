import { NextResponse } from "next/server";
import { query } from "@/lib/db";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSurveyorProfileSchema();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Surveyor ID is required" },
        { status: 400 }
      );
    }

    const [surveyor] = await query<SurveyorRow>(
      `
      SELECT
        sp.*,
        u.name as userName,
        u.email as userEmail
      FROM surveyor_profiles sp
      INNER JOIN user u ON u.id = sp.userId
      WHERE sp.id = ? AND sp.approvalStatus = 'APPROVED'
      `,
      [id]
    );

    if (!surveyor) {
      return NextResponse.json(
        { error: "Professional not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ professional: formatSurveyor(surveyor) });
  } catch (error) {
    console.error("[SURVEYOR_BY_ID_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch professional" },
      { status: 500 }
    );
  }
}
