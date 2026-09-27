export type SurveyorApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "BANNED";

export type SurveyorAvailabilityStatus = "AVAILABLE" | "BUSY" | "OFFLINE";

export type ProfessionalType = "SURVEYOR" | "LEGAL" | "BOTH";

export interface SurveyorProfile {
  id: string;
  userId: string;
  professionalType: ProfessionalType;
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
  serviceAreas: string[];
  specializations: string[];
  hourlyRate: number | null;
  consultationFee: number | null;
  availableOnline: boolean;
  availabilityStatus: SurveyorAvailabilityStatus;
  approvalStatus: SurveyorApprovalStatus;
  reviewNotes: string | null;
  averageRating: number;
  totalReviews: number;
  totalJobs: number;
  createdAt: string;
  updatedAt: string;
  userName?: string | null;
  userEmail?: string | null;
}
