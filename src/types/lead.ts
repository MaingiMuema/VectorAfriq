export interface Lead {
  id: string;
  type: "CHAT" | "PHONE" | "EMAIL";
  status: "BASIC" | "SILVER" | "GOLD";
  description: string;
  propertyId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    title: string;
    price: number;
    location: string;
    type: string;
    category: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}
