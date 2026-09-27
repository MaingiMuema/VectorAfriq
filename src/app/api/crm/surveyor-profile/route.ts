import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { ensureSurveyorProfileSchema } from "@/lib/surveyorSchema";
import type { SurveyorProfile } from "@/types/surveyor";
import { parseServiceAreas } from "@/lib/logistics";

interface SurveyorRow extends Omit<SurveyorProfile, "serviceAreas" | "specializations"> {
  serviceAreas: string | null;
  specializations: string | null;
}

function formatSurveyorProfile(row: SurveyorRow): Omit<SurveyorRow, 'serviceAreas' | 'specializations'> & {
  serviceAreas: string[];
  specializations: string[];
  availableOnline: boolean;
} {
  return {
    ...row,
    serviceAreas: parseServiceAreas(row.serviceAreas as string | null),
    specializations: parseServiceAreas(row.specializations as string | null),
    availableOnline: Boolean(row.availableOnline),
  };
}

const requiredFields = [
  "professionalType",
  "businessName",
  "contactPhone",
  "idNumber",
  "location",
];

function cleanPayload(body: Record<string, unknown>) {
  const serviceAreas = Array.isArray(body.serviceAreas)
    ? body.serviceAreas.map(String).filter(Boolean)
    : String(body.serviceAreas || "")
        .split(",")
        .map((area) => area.trim())
        .filter(Boolean);

  const specializations = Array.isArray(body.specializations)
    ? body.specializations.map(String).filter(Boolean)
    : String(body.specializations || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  return {
    professionalType: String(body.professionalType || "SURVEYOR").trim(),
    businessName: String(body.businessName || "").trim(),
    contactPhone: String(body.contactPhone || "").trim(),
    contactEmail: String(body.contactEmail || "").trim() || null,
    licenseNumber: String(body.licenseNumber || "").trim() || null,
    licenseDocumentUrl: String(body.licenseDocumentUrl || "").trim() || null,
    idNumber: String(body.idNumber || "").trim(),
    idDocumentUrl: String(body.idDocumentUrl || "").trim() || null,
    qualification: String(body.qualification || "").trim() || null,
    experience: String(body.experience || "").trim() || null,
    bio: String(body.bio || "").trim() || null,
    profileImageUrl: String(body.profileImageUrl || "").trim() || null,
    location: String(body.location || "").trim(),
    serviceAreas,
    specializations,
    hourlyRate: body.hourlyRate ? Number(body.hourlyRate) : null,
    consultationFee: body.consultationFee ? Number(body.consultationFee) : null,
    availableOnline: Boolean(body.availableOnline),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSurveyorProfileSchema();

    const [profile] = await query<SurveyorRow>(
      "SELECT * FROM surveyor_profiles WHERE userId = ?",
      [session.user.id]
    );

    return NextResponse.json({
      profile: profile ? formatSurveyorProfile(profile) : null,
    });
  } catch (error) {
    console.error("[CRM_SURVEYOR_PROFILE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch surveyor profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSurveyorProfileSchema();

    const body = await request.json();
    const data = cleanPayload(body);
    const missing = requiredFields.filter(
      (field) => !data[field as keyof typeof data]
    );

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const [existing] = await query<{ id: string }>(
      "SELECT id FROM surveyor_profiles WHERE userId = ?",
      [session.user.id]
    );

    if (existing) {
      await query(
        `
        UPDATE surveyor_profiles
        SET professionalType = ?, businessName = ?, contactPhone = ?, contactEmail = ?,
          licenseNumber = ?, licenseDocumentUrl = ?, idNumber = ?, idDocumentUrl = ?,
          qualification = ?, experience = ?, bio = ?, profileImageUrl = ?,
          location = ?, serviceAreas = ?, specializations = ?,
          hourlyRate = ?, consultationFee = ?, availableOnline = ?,
          approvalStatus = 'PENDING', reviewNotes = NULL, updatedAt = NOW()
        WHERE id = ? AND userId = ?
        `,
        [
          data.professionalType,
          data.businessName,
          data.contactPhone,
          data.contactEmail,
          data.licenseNumber,
          data.licenseDocumentUrl,
          data.idNumber,
          data.idDocumentUrl,
          data.qualification,
          data.experience,
          data.bio,
          data.profileImageUrl,
          data.location,
          JSON.stringify(data.serviceAreas),
          JSON.stringify(data.specializations),
          data.hourlyRate,
          data.consultationFee,
          data.availableOnline ? 1 : 0,
          existing.id,
          session.user.id,
        ]
      );
    } else {
      await query(
        `
        INSERT INTO surveyor_profiles (
          id, userId, professionalType, businessName, contactPhone, contactEmail,
          licenseNumber, licenseDocumentUrl, idNumber, idDocumentUrl,
          qualification, experience, bio, profileImageUrl,
          location, serviceAreas, specializations,
          hourlyRate, consultationFee, availableOnline,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          uuidv4(),
          session.user.id,
          data.professionalType,
          data.businessName,
          data.contactPhone,
          data.contactEmail,
          data.licenseNumber,
          data.licenseDocumentUrl,
          data.idNumber,
          data.idDocumentUrl,
          data.qualification,
          data.experience,
          data.bio,
          data.profileImageUrl,
          data.location,
          JSON.stringify(data.serviceAreas),
          JSON.stringify(data.specializations),
          data.hourlyRate,
          data.consultationFee,
          data.availableOnline ? 1 : 0,
        ]
      );
    }

    const [profile] = await query<SurveyorRow>(
      "SELECT * FROM surveyor_profiles WHERE userId = ?",
      [session.user.id]
    );

    return NextResponse.json({ profile: formatSurveyorProfile(profile) });
  } catch (error) {
    console.error("[CRM_SURVEYOR_PROFILE_POST]", error);
    return NextResponse.json(
      { error: "Failed to submit surveyor profile" },
      { status: 500 }
    );
  }
}

export const PATCH = POST;
