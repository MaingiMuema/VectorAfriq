export interface Property {
  id: string;
  title: string;
  slug: string;
  price: number;
  location: {
    county: string;
    city: string;
    neighborhood: string;
    address: string;
  };
  description: string;
  features: string[];
  images: {
    id: number;
    url: string;
  }[];
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    image?: string;
  };
  company?: {
    id: string;
    name: string;
    logo: string;
    email: string;
    phone: string;
    website?: string;
  };
  type: "for-sale" | "for-rent" | "airbnb";
  category: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  amenities: string[];
  agent?: {
    name: string;
    company: string;
    logo: string;
    phone: string;
    whatsapp: string;
  };
  similarProperties?: {
    id: string;
    title: string;
    type: "for-sale" | "for-rent" | "airbnb";
    price: number;
    location: {
      county: string;
      city: string;
      neighborhood: string;
      address: string;
    };
    bedrooms: number;
    bathrooms: number;
    images: {
      id: number;
      url: string;
    }[];
  }[];
}
