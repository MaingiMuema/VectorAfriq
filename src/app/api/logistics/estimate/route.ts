import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { estimateTripWithGoogle } from "@/lib/logistics";
import type { MoverProfile } from "@/types/logistics";

interface MoverRate
  extends Pick<MoverProfile, "baseRate" | "pricePerKm" | "pricePerKg"> {}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pickupLocation = String(body.pickupLocation || "").trim();
    const dropoffLocation = String(body.dropoffLocation || "").trim();
    const loadWeightKg = Number(body.loadWeightKg || 0);
    const moverId = body.moverId ? String(body.moverId) : null;

    if (!pickupLocation || !dropoffLocation) {
      return NextResponse.json(
        { error: "Pickup and dropoff locations are required" },
        { status: 400 }
      );
    }

    let mover: MoverRate | null = null;
    if (moverId) {
      const [row] = await query<MoverRate>(
        "SELECT baseRate, pricePerKm, pricePerKg FROM mover_profiles WHERE id = ? AND approvalStatus = 'APPROVED'",
        [moverId]
      );
      mover = row || null;
    }

    const estimate = await estimateTripWithGoogle({
      pickupLocation,
      dropoffLocation,
      loadWeightKg,
      mover,
    });

    return NextResponse.json({ estimate });
  } catch (error) {
    console.error("[LOGISTICS_ESTIMATE_POST]", error);
    return NextResponse.json(
      { error: "Failed to estimate relocation price" },
      { status: 500 }
    );
  }
}
