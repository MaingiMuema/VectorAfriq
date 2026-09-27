export interface Banner {
  id: string;
  imageUrl: string;
  linkUrl?: string | null;
  locations: string[];
  active: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
