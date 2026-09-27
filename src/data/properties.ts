import { Property } from "../types/property";

export const properties: Property[] = [
  {
    id: "1",
    title: "2 Bed Apartment with En Suite at Nyali",
    slug: "2-bed-apartment-with-en-suite-at-nyali",
    price: 9000000,
    location: {
      city: "Nyali",
      county: "Mombasa",
      neighborhood: "Nyali Area",
      address: "Nyali, Mombasa",
    },
    description:
      "Luxurious 2 bedroom apartment with en-suite bathrooms, modern finishes, and spectacular ocean views. Located in the heart of Nyali.",
    features: [
      "En-suite bathrooms",
      "Modern finishes",
      "Ocean view",
      "Spacious balcony",
      "Fitted kitchen",
    ],
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
      },
      {
        id: 2,
        url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
      },
      {
        id: 3,
        url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
      },
      {
        id: 4,
        url: "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8",
      },
    ],
    agent: {
      name: "Benford Homes",
      company: "Benford Homes",
      logo: "/benford-homes-logo.png",
      phone: "+254 723 7890",
      whatsapp: "+254723789012",
    },
    type: "for-sale",
    category: "Apartments",
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
    amenities: [
      "Swimming pool",
      "Gym",
      "Security",
      "Parking",
      "Elevator",
      "Backup generator",
    ],
    similarProperties: [
      {
        id: "2",
        title: "3 Bedroom Apartment with Ocean View",
        type: "for-sale",
        price: 12000000,
        location: {
          city: "Nyali",
          county: "Mombasa",
          neighborhood: "Nyali Area",
          address: "Nyali, Mombasa",
        },
        bedrooms: 3,
        bathrooms: 3,
        images: [
          {
            id: 1,
            url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
          },
        ],
      },
      {
        id: "3",
        title: "2 Bedroom Modern Apartment",
        type: "for-sale",
        price: 8500000,
        location: {
          city: "Nyali",
          county: "Mombasa",
          neighborhood: "Nyali Links",
          address: "Nyali Links, Mombasa",
        },
        bedrooms: 2,
        bathrooms: 2,
        images: [
          {
            id: 1,
            url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
          },
        ],
      },
      {
        id: "4",
        title: "Luxury 2 Bed Apartment with Pool",
        type: "for-sale",
        price: 9500000,
        location: {
          city: "Nyali",
          county: "Mombasa",
          neighborhood: "Nyali Beach",
          address: "Nyali Beach, Mombasa",
        },
        bedrooms: 2,
        bathrooms: 2,
        images: [
          {
            id: 1,
            url: "https://images.unsplash.com/photo-1484154218962-a197022b5858",
          },
        ],
      },
    ],
  },
];
