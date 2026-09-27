export type BadgeTier = "NONE" | "VERIFIED" | "TRUSTED" | "ELITE";

/** Full badge tier configuration from the agent_badge_tier table */
export interface BadgeTierConfig {
  id: string;
  tier: BadgeTier;
  name: string;
  subtitle: string | null;
  description: string | null;
  features: string[];
  price: number;
  sortOrder: number;
  isActive: boolean;
  autoAssignEnabled: boolean;
  minListings: number;
  bgGradient: string | null;
  iconColor: string | null;
  accentColor: string | null;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: "SALE" | "RENT" | "AIRBNB";
  category:
    | "apartments"
    | "bungalows"
    | "commercial-plots"
    | "duplex"
    | "houses"
    | "penthouses"
    | "residential-plots"
    | "studios"
    | "townhouses";
  bedrooms: number;
  bathrooms: number;
  size: number;
  images: string[];
  features: string[];
  userId: string;
  status: string;
  agent?: {
    name: string;
    image: string | null;
    company?: string;
    phone?: string;
    whatsapp?: string;
    badgeTier?: BadgeTier;
    rateCardTier?: string;
  };
  /** Agent rate-card tier used for search visibility weighting */
  rateCardTier?: string;
  company?: {
    id: string;
    name: string;
    logo: string;
    email: string;
    phone: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "agent" | "admin";
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent extends User {
  properties: Property[];
  bio?: string;
  company?: string;
  license?: string;
}
