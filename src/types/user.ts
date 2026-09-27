export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent" | "user";
  /** @deprecated Prefer isActive */
  status?: "active" | "inactive" | "suspended";
  isActive: boolean;
  deactivatedAt?: Date | null;
  deactivatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
