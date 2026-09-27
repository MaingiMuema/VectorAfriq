import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatMoverProfile } from "@/lib/logistics";
import { ensureMoverProfileSchema } from "@/lib/moverSchema";
import type { MoverProfile } from "@/types/logistics";

interface MoverRow extends Omit<MoverProfile, "serviceAreas"> {
  serviceAreas: string | null;
}

const requiredFields = [
  "businessName",
  "contactPhone",
  "driversLicense",
  "driversLicenseBackUrl",
  "idNumber",
  "idBackUrl",
  "vehicleImageUrl",
  "vehicleType",
  "vehiclePlate",
  "vehicleCapacityKg",
  "baseLocation",
];

function cleanPayload(body: Record<string, unknown>) {
  const serviceAreas = Array.isArray(body.serviceAreas)
    ? body.serviceAreas.map(String).filter(Boolean)
    : String(body.serviceAreas || "")
        .split(",")
        .map((area) => area.trim())
        .filter(Boolean);

  return {
    businessName: String(body.businessName || "").trim(),
    contactPhone: String(body.contactPhone || "").trim(),
    contactEmail: String(body.contactEmail || "").trim() || null,
    driversLicense: String(body.driversLicense || "").trim(),
    driversLicenseBackUrl:
      String(body.driversLicenseBackUrl || "").trim() || null,
    idNumber: String(body.idNumber || "").trim(),
    idBackUrl: String(body.idBackUrl || "").trim() || null,
    vehicleType: String(body.vehicleType || "").trim(),
    vehicleMake: String(body.vehicleMake || "").trim() || null,
    vehicleModel: String(body.vehicleModel || "").trim() || null,
    vehiclePlate: String(body.vehiclePlate || "").trim().toUpperCase(),
    vehicleImageUrl: String(body.vehicleImageUrl || "").trim() || null,
    vehicleCapacityKg: Number(body.vehicleCapacityKg || 0),
    vehicleVolumeCbm: body.vehicleVolumeCbm
      ? Number(body.vehicleVolumeCbm)
      : null,
    baseLocation: String(body.baseLocation || "").trim(),
    serviceAreas,
    baseRate: Number(body.baseRate || 1500),
    pricePerKm: Number(body.pricePerKm || 120),
    pricePerKg: Number(body.pricePerKg || 8),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureMoverProfileSchema();

    const [profile] = await query<MoverRow>(
      "SELECT * FROM mover_profiles WHERE userId = ?",
      [session.user.id]
    );

    return NextResponse.json({
      profile: profile ? formatMoverProfile(profile) : null,
    });
  } catch (error) {
    console.error("[CRM_MOVER_PROFILE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch mover profile" },
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

    await ensureMoverProfileSchema();

    const body = await request.json();
    const data = cleanPayload(body);
    const missing = requiredFields.filter(
      (field) => !data[field as keyof typeof data]
    );

    if (missing.length > 0 || data.vehicleCapacityKg <= 0) {
      return NextResponse.json(
        { error: "Missing required mover details" },
        { status: 400 }
      );
    }

    const [existing] = await query<{ id: string }>(
      "SELECT id FROM mover_profiles WHERE userId = ?",
      [session.user.id]
    );

    if (existing) {
      await query(
        `
        UPDATE mover_profiles
        SET businessName = ?, contactPhone = ?, contactEmail = ?,
          driversLicense = ?, driversLicenseBackUrl = ?, idNumber = ?, idBackUrl = ?,
          vehicleType = ?, vehicleMake = ?,
          vehicleModel = ?, vehiclePlate = ?, vehicleImageUrl = ?, vehicleCapacityKg = ?,
          vehicleVolumeCbm = ?, baseLocation = ?, serviceAreas = ?,
          baseRate = ?, pricePerKm = ?, pricePerKg = ?,
          approvalStatus = 'PENDING', reviewNotes = NULL, updatedAt = NOW()
        WHERE id = ? AND userId = ?
        `,
        [
          data.businessName,
          data.contactPhone,
          data.contactEmail,
          data.driversLicense,
          data.driversLicenseBackUrl,
          data.idNumber,
          data.idBackUrl,
          data.vehicleType,
          data.vehicleMake,
          data.vehicleModel,
          data.vehiclePlate,
          data.vehicleImageUrl,
          data.vehicleCapacityKg,
          data.vehicleVolumeCbm,
          data.baseLocation,
          JSON.stringify(data.serviceAreas),
          data.baseRate,
          data.pricePerKm,
          data.pricePerKg,
          existing.id,
          session.user.id,
        ]
      );
    } else {
      await query(
        `
        INSERT INTO mover_profiles (
          id, userId, businessName, contactPhone, contactEmail, driversLicense,
          driversLicenseBackUrl, idNumber, idBackUrl, vehicleType, vehicleMake, vehicleModel, vehiclePlate,
          vehicleImageUrl, vehicleCapacityKg, vehicleVolumeCbm, baseLocation, serviceAreas,
          baseRate, pricePerKm, pricePerKg, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          uuidv4(),
          session.user.id,
          data.businessName,
          data.contactPhone,
          data.contactEmail,
          data.driversLicense,
          data.driversLicenseBackUrl,
          data.idNumber,
          data.idBackUrl,
          data.vehicleType,
          data.vehicleMake,
          data.vehicleModel,
          data.vehiclePlate,
          data.vehicleImageUrl,
          data.vehicleCapacityKg,
          data.vehicleVolumeCbm,
          data.baseLocation,
          JSON.stringify(data.serviceAreas),
          data.baseRate,
          data.pricePerKm,
          data.pricePerKg,
        ]
      );
    }

    const [profile] = await query<MoverRow>(
      "SELECT * FROM mover_profiles WHERE userId = ?",
      [session.user.id]
    );

    return NextResponse.json({ profile: formatMoverProfile(profile) });
  } catch (error) {
    console.error("[CRM_MOVER_PROFILE_POST]", error);
    return NextResponse.json(
      { error: "Failed to submit mover profile" },
      { status: 500 }
    );
  }
}

export const PATCH = POST;
