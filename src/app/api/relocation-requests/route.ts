import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/lib/auth";
import { query, type DatabaseValue } from "@/lib/db";
import {
  estimateTripWithGoogle,
  formatMoverProfile,
  geocodeLocation,
} from "@/lib/logistics";
import type { MoverProfile, RelocationRequest } from "@/types/logistics";

interface RequestRow extends RelocationRequest {
  moverBusinessName: string | null;
  moverPhone: string | null;
  moverVehicleType: string | null;
  moverVehiclePlate: string | null;
  moverCapacityKg: number | null;
  moverLatitude: number | null;
  moverLongitude: number | null;
  moverLocationUpdate: string | null;
}

interface MoverRow extends Omit<MoverProfile, "serviceAreas"> {
  serviceAreas: string | null;
}

function formatRequest(row: RequestRow): RelocationRequest {
  return {
    ...row,
    mover: row.moverId
      ? {
          id: row.moverId,
          businessName: row.moverBusinessName || "Mover",
          contactPhone: row.moverPhone || "",
          vehicleType: row.moverVehicleType || "",
          vehiclePlate: row.moverVehiclePlate || "",
          vehicleCapacityKg: Number(row.moverCapacityKg || 0),
          currentLatitude: row.moverLatitude,
          currentLongitude: row.moverLongitude,
          lastLocationUpdate: row.moverLocationUpdate,
        }
      : null,
  };
}

async function getMoverRecommendations({
  pickupLocation,
  loadWeightKg,
  vehicleType,
}: {
  pickupLocation: string;
  loadWeightKg: number;
  vehicleType?: string | null;
}) {
  const area = `%${pickupLocation.split(",")[0].trim() || pickupLocation}%`;
  const params: DatabaseValue[] = [loadWeightKg, area, area];
  let vehicleClause = "";

  if (vehicleType) {
    vehicleClause = " AND mp.vehicleType LIKE ?";
    params.push(`%${vehicleType}%`);
  }

  const movers = await query<MoverRow>(
    `
    SELECT mp.*, u.name as userName, u.email as userEmail
    FROM mover_profiles mp
    INNER JOIN user u ON u.id = mp.userId
    WHERE mp.approvalStatus = 'APPROVED'
      AND mp.availabilityStatus = 'AVAILABLE'
      AND mp.vehicleCapacityKg >= ?
      AND (mp.baseLocation LIKE ? OR mp.serviceAreas LIKE ?)
      ${vehicleClause}
    ORDER BY mp.averageRating DESC, mp.totalTrips DESC, mp.createdAt DESC
    LIMIT 12
    `,
    params
  );

  return movers.map((mover) => formatMoverProfile(mover));
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "customer";
    const status = searchParams.get("status") || "ALL";
    const params: DatabaseValue[] = [];
    let whereClause = "";

    if (view === "mover") {
      const [profile] = await query<{ id: string }>(
        "SELECT id FROM mover_profiles WHERE userId = ?",
        [session.user.id]
      );

      if (!profile) {
        return NextResponse.json({ requests: [] });
      }

      whereClause = "WHERE rr.moverId = ?";
      params.push(profile.id);
    } else {
      whereClause = "WHERE rr.userId = ?";
      params.push(session.user.id);
    }

    if (status !== "ALL") {
      whereClause += " AND rr.status = ?";
      params.push(status);
    }

    const requests = await query<RequestRow>(
      `
      SELECT
        rr.*,
        mp.businessName as moverBusinessName,
        mp.contactPhone as moverPhone,
        mp.vehicleType as moverVehicleType,
        mp.vehiclePlate as moverVehiclePlate,
        mp.vehicleCapacityKg as moverCapacityKg,
        mp.currentLatitude as moverLatitude,
        mp.currentLongitude as moverLongitude,
        mp.lastLocationUpdate as moverLocationUpdate,
        u.name as customerName,
        u.email as customerEmail
      FROM relocation_requests rr
      LEFT JOIN mover_profiles mp ON mp.id = rr.moverId
      LEFT JOIN user u ON u.id = rr.userId
      ${whereClause}
      ORDER BY rr.createdAt DESC
      LIMIT 50
      `,
      params
    );

    return NextResponse.json({ requests: requests.map(formatRequest) });
  } catch (error) {
    console.error("[RELOCATION_REQUESTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch relocation requests" },
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

    const body = await request.json();
    const pickupLocation = String(body.pickupLocation || "").trim();
    const dropoffLocation = String(body.dropoffLocation || "").trim();
    const pickupTime = String(body.pickupTime || "").trim();
    const moverId = String(body.moverId || "").trim();
    const loadWeightKg = Number(body.loadWeightKg || 0);
    const loadVolumeCbm = body.loadVolumeCbm ? Number(body.loadVolumeCbm) : null;
    const userOfferedPrice = body.userOfferedPrice
      ? Number(body.userOfferedPrice)
      : null;
    const vehicleType = String(body.vehicleType || "").trim() || null;
    const loadDescription = String(body.loadDescription || "").trim() || null;
    const notes = String(body.notes || "").trim() || null;

    if (!pickupLocation || !dropoffLocation || !pickupTime || !moverId) {
      return NextResponse.json(
        { error: "Pickup, dropoff, pickup time, and mover are required" },
        { status: 400 }
      );
    }

    const [mover] = await query<MoverRow>(
      `
      SELECT *
      FROM mover_profiles
      WHERE id = ?
        AND approvalStatus = 'APPROVED'
        AND availabilityStatus = 'AVAILABLE'
        AND vehicleCapacityKg >= ?
      `,
      [moverId, loadWeightKg]
    );

    if (!mover) {
      return NextResponse.json(
        { error: "Selected mover is not available for this load" },
        { status: 400 }
      );
    }

    const formattedMover = formatMoverProfile(mover);
    const [estimate, pickupCoordinates, dropoffCoordinates] = await Promise.all([
      estimateTripWithGoogle({
        pickupLocation,
        dropoffLocation,
        loadWeightKg,
        mover: formattedMover,
      }),
      geocodeLocation(pickupLocation),
      geocodeLocation(dropoffLocation),
    ]);
    const id = uuidv4();

    await query(
      `
      INSERT INTO relocation_requests (
        id, userId, moverId, status, pickupLocation, dropoffLocation,
        pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude,
        pickupTime, loadDescription, loadWeightKg, loadVolumeCbm, vehicleType,
        estimatedDistanceKm, estimatedDurationMinutes, estimatedPrice,
        userOfferedPrice, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        id,
        session.user.id,
        moverId,
        "PENDING_MOVER",
        pickupLocation,
        dropoffLocation,
        pickupCoordinates?.latitude || null,
        pickupCoordinates?.longitude || null,
        dropoffCoordinates?.latitude || null,
        dropoffCoordinates?.longitude || null,
        new Date(pickupTime),
        loadDescription,
        loadWeightKg,
        loadVolumeCbm,
        vehicleType || mover.vehicleType,
        estimate.distanceKm,
        estimate.durationMinutes,
        estimate.estimatedPrice,
        userOfferedPrice,
        notes,
      ]
    );

    const [created] = await query<RequestRow>(
      `
      SELECT
        rr.*,
        mp.businessName as moverBusinessName,
        mp.contactPhone as moverPhone,
        mp.vehicleType as moverVehicleType,
        mp.vehiclePlate as moverVehiclePlate,
        mp.vehicleCapacityKg as moverCapacityKg,
        mp.currentLatitude as moverLatitude,
        mp.currentLongitude as moverLongitude,
        mp.lastLocationUpdate as moverLocationUpdate,
        u.name as customerName,
        u.email as customerEmail
      FROM relocation_requests rr
      LEFT JOIN mover_profiles mp ON mp.id = rr.moverId
      LEFT JOIN user u ON u.id = rr.userId
      WHERE rr.id = ?
      `,
      [id]
    );

    return NextResponse.json({ request: formatRequest(created) });
  } catch (error) {
    console.error("[RELOCATION_REQUESTS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create relocation request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const pickupLocation = String(body.pickupLocation || "").trim();
    const vehicleType = String(body.vehicleType || "").trim() || null;
    const loadWeightKg = Number(body.loadWeightKg || 0);

    if (!pickupLocation) {
      return NextResponse.json(
        { error: "Pickup location is required" },
        { status: 400 }
      );
    }

    const movers = await getMoverRecommendations({
      pickupLocation,
      loadWeightKg,
      vehicleType,
    });

    return NextResponse.json({ movers });
  } catch (error) {
    console.error("[RELOCATION_RECOMMENDATIONS]", error);
    return NextResponse.json(
      { error: "Failed to recommend movers" },
      { status: 500 }
    );
  }
}
