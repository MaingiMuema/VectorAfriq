import type { MoverProfile, TripEstimate } from "@/types/logistics";

const DEFAULT_BASE_RATE = 1500;
const DEFAULT_PRICE_PER_KM = 120;
const DEFAULT_PRICE_PER_KG = 8;
const MIN_TRIP_PRICE = 2500;

export function parseServiceAreas(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean);
    }
  } catch {
    return value
      .split(",")
      .map((area) => area.trim())
      .filter(Boolean);
  }

  return [];
}

export function formatMoverProfile<T extends { serviceAreas?: unknown }>(
  row: T
): Omit<T, "serviceAreas"> & { serviceAreas: string[] } {
  return {
    ...row,
    serviceAreas: parseServiceAreas(row.serviceAreas as string | null),
  };
}

export function estimateRelocationPrice({
  distanceKm,
  loadWeightKg,
  baseRate = DEFAULT_BASE_RATE,
  pricePerKm = DEFAULT_PRICE_PER_KM,
  pricePerKg = DEFAULT_PRICE_PER_KG,
}: {
  distanceKm?: number | null;
  loadWeightKg?: number | null;
  baseRate?: number | null;
  pricePerKm?: number | null;
  pricePerKg?: number | null;
}): number {
  const billableDistance = Math.max(distanceKm ?? 8, 3);
  const billableWeight = Math.max(loadWeightKg ?? 0, 0);
  const price =
    (baseRate ?? DEFAULT_BASE_RATE) +
    billableDistance * (pricePerKm ?? DEFAULT_PRICE_PER_KM) +
    billableWeight * (pricePerKg ?? DEFAULT_PRICE_PER_KG);

  return Math.round(Math.max(price, MIN_TRIP_PRICE) / 50) * 50;
}

export async function estimateTripWithGoogle({
  pickupLocation,
  dropoffLocation,
  loadWeightKg,
  mover,
}: {
  pickupLocation: string;
  dropoffLocation: string;
  loadWeightKg?: number | null;
  mover?: Partial<MoverProfile> | null;
}): Promise<TripEstimate> {
  const apiKey =
    process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API;

  if (!apiKey || !pickupLocation || !dropoffLocation) {
    return {
      distanceKm: null,
      durationMinutes: null,
      estimatedPrice: estimateRelocationPrice({
        loadWeightKg,
        baseRate: mover?.baseRate,
        pricePerKm: mover?.pricePerKm,
        pricePerKg: mover?.pricePerKg,
      }),
      source: "fallback",
    };
  }

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/distancematrix/json"
    );
    url.searchParams.set("origins", pickupLocation);
    url.searchParams.set("destinations", dropoffLocation);
    url.searchParams.set("units", "metric");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Distance Matrix failed: ${response.status}`);
    }

    const data = await response.json();
    const element = data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      throw new Error("No route found");
    }

    const distanceKm = Number(element.distance.value) / 1000;
    const durationMinutes = Math.round(Number(element.duration.value) / 60);

    return {
      distanceKm,
      durationMinutes,
      estimatedPrice: estimateRelocationPrice({
        distanceKm,
        loadWeightKg,
        baseRate: mover?.baseRate,
        pricePerKm: mover?.pricePerKm,
        pricePerKg: mover?.pricePerKg,
      }),
      source: "google",
    };
  } catch (error) {
    console.error("[LOGISTICS_ESTIMATE]", error);
    return {
      distanceKm: null,
      durationMinutes: null,
      estimatedPrice: estimateRelocationPrice({
        loadWeightKg,
        baseRate: mover?.baseRate,
        pricePerKm: mover?.pricePerKm,
        pricePerKg: mover?.pricePerKg,
      }),
      source: "fallback",
    };
  }
}

export async function geocodeLocation(location: string): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const apiKey =
    process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API;

  if (!apiKey || !location) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", location);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    const coordinates = data?.results?.[0]?.geometry?.location;
    if (!coordinates) return null;

    return {
      latitude: Number(coordinates.lat),
      longitude: Number(coordinates.lng),
    };
  } catch (error) {
    console.error("[LOGISTICS_GEOCODE]", error);
    return null;
  }
}

export function normalizePickupSearch(value: string) {
  return `%${value.trim().split(",")[0] || value.trim()}%`;
}
