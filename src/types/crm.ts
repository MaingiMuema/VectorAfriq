// Database types
export type LeadType = "PHONE" | "EMAIL" | "CHAT";
export type LeadStatus = "GOLD" | "SILVER" | "BASIC";
export type RevenueType = "COMMISSION" | "LISTING_FEE" | "OTHER";

export interface LeadCount {
  type: LeadType;
  count: number;
  month: string;
}

export interface LeadActivity {
  id: string;
  type: LeadType;
  status: LeadStatus;
  description: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  type: LeadType;
  status: LeadStatus;
  description: string;
  propertyId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Revenue {
  id: string;
  amount: number;
  type: RevenueType;
  description?: string;
  propertyId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
interface ChartData {
  labels: string[];
  values: number[];
}

// Maps for case conversion
export const LeadTypeMap = {
  PHONE: "phone",
  EMAIL: "email",
  CHAT: "chat",
} as const;

export const LeadStatusMap = {
  GOLD: "gold",
  SILVER: "silver",
  BASIC: "basic",
} as const;

export type LowercaseLeadType = (typeof LeadTypeMap)[LeadType];
export type LowercaseLeadStatus = (typeof LeadStatusMap)[LeadStatus];

export interface DashboardStats {
  totalLeads: number;
  phoneLeads: number;
  emailLeads: number;
  totalRevenue: number;
  trends: {
    leads: number;
    phone: number;
    email: number;
    revenue: number;
  };
  monthlyTrends: {
    leads: ChartData;
  };
  recentActivities: Array<{
    id: string;
    type: LowercaseLeadType;
    status: LowercaseLeadStatus;
    timestamp: string;
    description: string;
  }>;
}
