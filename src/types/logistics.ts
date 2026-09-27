export type MoverApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "BANNED";

export type MoverAvailabilityStatus = "AVAILABLE" | "BUSY" | "OFFLINE";

export type RelocationRequestStatus =
  | "PENDING_MOVER"
  | "COUNTERED"
  | "PRICE_AGREED"
  | "ACCEPTED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export interface MoverProfile {
  id: string;
  userId: string;
  businessName: string;
  contactPhone: string;
  contactEmail: string | null;
  driversLicense: string;
  driversLicenseBackUrl: string | null;
  idNumber: string;
  idBackUrl: string | null;
  vehicleType: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehiclePlate: string;
  vehicleImageUrl: string | null;
  vehicleCapacityKg: number;
  vehicleVolumeCbm: number | null;
  baseLocation: string;
  serviceAreas: string[];
  baseRate: number;
  pricePerKm: number;
  pricePerKg: number;
  availabilityStatus: MoverAvailabilityStatus;
  approvalStatus: MoverApprovalStatus;
  reviewNotes: string | null;
  averageRating: number;
  totalTrips: number;
  currentLatitude: number | null;
  currentLongitude: number | null;
  lastLocationUpdate: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string | null;
  userEmail?: string | null;
}

export interface RelocationRequest {
  id: string;
  userId: string;
  moverId: string | null;
  status: RelocationRequestStatus;
  pickupLocation: string;
  dropoffLocation: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  dropoffLatitude: number | null;
  dropoffLongitude: number | null;
  pickupTime: string;
  loadDescription: string | null;
  loadWeightKg: number;
  loadVolumeCbm: number | null;
  vehicleType: string | null;
  estimatedDistanceKm: number | null;
  estimatedDurationMinutes: number | null;
  estimatedPrice: number | null;
  userOfferedPrice: number | null;
  moverCounterPrice: number | null;
  agreedPrice: number | null;
  notes: string | null;
  moverResponseNotes: string | null;
  createdAt: string;
  updatedAt: string;
  mover?: Pick<
    MoverProfile,
    | "id"
    | "businessName"
    | "contactPhone"
    | "vehicleType"
    | "vehiclePlate"
    | "vehicleCapacityKg"
    | "currentLatitude"
    | "currentLongitude"
    | "lastLocationUpdate"
  > | null;
  customerName?: string | null;
  customerEmail?: string | null;
}

export interface RelocationRequestMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string | null;
  senderRole: "CUSTOMER" | "MOVER" | "ADMIN";
  message: string;
  createdAt: string;
}

export interface TripEstimate {
  distanceKm: number | null;
  durationMinutes: number | null;
  estimatedPrice: number;
  source: "google" | "fallback";
}
