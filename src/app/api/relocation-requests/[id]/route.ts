import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import type {
  RelocationRequest,
  RelocationRequestStatus,
} from "@/types/logistics";

interface RequestRow extends RelocationRequest {
  moverUserId: string | null;
  moverBusinessName: string | null;
  moverPhone: string | null;
  moverVehicleType: string | null;
  moverVehiclePlate: string | null;
  moverCapacityKg: number | null;
  moverLatitude: number | null;
  moverLongitude: number | null;
  moverLocationUpdate: string | null;
}

function getRequestId(url: string) {
  const segments = url.split("/").filter(Boolean);
  return segments[segments.length - 1];
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

async function getRequest(id: string) {
  const [request] = await query<RequestRow>(
    `
    SELECT
      rr.*,
      mp.userId as moverUserId,
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

  return request || null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestId = getRequestId(request.nextUrl.pathname);
    const relocationRequest = await getRequest(requestId);

    if (!relocationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isParticipant =
      relocationRequest.userId === session.user.id ||
      relocationRequest.moverUserId === session.user.id ||
      session.user.role === "ADMIN";

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const participantRole =
      session.user.role === "ADMIN"
        ? "ADMIN"
        : relocationRequest.moverUserId === session.user.id
          ? "MOVER"
          : "CUSTOMER";

    return NextResponse.json({
      request: formatRequest(relocationRequest),
      participantRole,
    });
  } catch (error) {
    console.error("[RELOCATION_REQUEST_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch relocation request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestId = getRequestId(request.nextUrl.pathname);
    const relocationRequest = await getRequest(requestId);

    if (!relocationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const body = await request.json();
    const action = String(body.action || "");
    const isCustomer = relocationRequest.userId === session.user.id;
    const isMover = relocationRequest.moverUserId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isCustomer && !isMover && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let nextStatus: RelocationRequestStatus | null = null;
    let agreedPrice = relocationRequest.agreedPrice;
    let counterPrice = relocationRequest.moverCounterPrice;
    let responseNotes = relocationRequest.moverResponseNotes;

    if (action === "counter" && isMover) {
      counterPrice = Number(body.moverCounterPrice || 0);
      responseNotes = String(body.moverResponseNotes || "").trim() || null;
      if (counterPrice <= 0) {
        return NextResponse.json(
          { error: "Counter price is required" },
          { status: 400 }
        );
      }
      nextStatus = "COUNTERED";
    } else if (action === "accept" && isMover) {
      agreedPrice =
        Number(body.agreedPrice || 0) ||
        relocationRequest.userOfferedPrice ||
        relocationRequest.estimatedPrice ||
        counterPrice ||
        null;
      responseNotes = String(body.moverResponseNotes || "").trim() || null;
      nextStatus = "ACCEPTED";
    } else if (action === "agree_counter" && isCustomer) {
      if (!counterPrice) {
        return NextResponse.json(
          { error: "No counter price to accept" },
          { status: 400 }
        );
      }
      agreedPrice = counterPrice;
      nextStatus = "PRICE_AGREED";
    } else if (action === "reject_counter" && isCustomer) {
      if (relocationRequest.status !== "COUNTERED") {
        return NextResponse.json(
          { error: "Only countered requests can be rejected by the customer" },
          { status: 400 }
        );
      }
      nextStatus = "CANCELLED";
    } else if (action === "start_trip" && isMover) {
      nextStatus = "IN_TRANSIT";
    } else if (action === "complete_trip" && isMover) {
      nextStatus = "DELIVERED";
    } else if (action === "reject" && (isMover || isAdmin)) {
      responseNotes = String(body.moverResponseNotes || "").trim() || null;
      nextStatus = "REJECTED";
    } else if (action === "cancel" && (isCustomer || isAdmin)) {
      nextStatus = "CANCELLED";
    } else if (action === "update_location" && isMover) {
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return NextResponse.json(
          { error: "Valid latitude and longitude are required" },
          { status: 400 }
        );
      }

      await query(
        `
        UPDATE mover_profiles
        SET currentLatitude = ?, currentLongitude = ?, lastLocationUpdate = NOW(), updatedAt = NOW()
        WHERE id = ?
        `,
        [latitude, longitude, relocationRequest.moverId]
      );

      const updated = await getRequest(requestId);
      return NextResponse.json({ request: formatRequest(updated!) });
    } else {
      return NextResponse.json(
        { error: "Invalid action for this request" },
        { status: 400 }
      );
    }

    await query(
      `
      UPDATE relocation_requests
      SET status = ?, moverCounterPrice = ?, agreedPrice = ?,
        moverResponseNotes = ?, updatedAt = NOW()
      WHERE id = ?
      `,
      [nextStatus, counterPrice, agreedPrice, responseNotes, requestId]
    );

    if (relocationRequest.moverId) {
      if (nextStatus === "ACCEPTED" || nextStatus === "IN_TRANSIT") {
        await query(
          "UPDATE mover_profiles SET availabilityStatus = 'BUSY', updatedAt = NOW() WHERE id = ?",
          [relocationRequest.moverId]
        );
      }

      if (
        nextStatus === "DELIVERED" ||
        nextStatus === "CANCELLED" ||
        nextStatus === "REJECTED"
      ) {
        await query(
          `
          UPDATE mover_profiles
          SET availabilityStatus = 'AVAILABLE',
            totalTrips = totalTrips + CASE WHEN ? = 'DELIVERED' THEN 1 ELSE 0 END,
            updatedAt = NOW()
          WHERE id = ?
          `,
          [nextStatus, relocationRequest.moverId]
        );
      }
    }

    const updated = await getRequest(requestId);
    return NextResponse.json({ request: formatRequest(updated!) });
  } catch (error) {
    console.error("[RELOCATION_REQUEST_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update relocation request" },
      { status: 500 }
    );
  }
}
