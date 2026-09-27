import SchemaMarkup, { buildBreadcrumbSchema } from "./SchemaMarkup";

interface PropertyData {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  category: string;
  bedrooms: number;
  bathrooms: number;
  location: {
    county: string;
    city: string;
    neighborhood: string;
    address: string;
  };
  images: string[];
  features: string[];
  user: {
    name: string;
    email: string;
    phone: string;
  };
  company: {
    name: string;
    logo: string;
    phone: string;
  } | null;
}

interface PropertyStructuredDataProps {
  property: PropertyData;
  url: string;
}

const mapCategoryToType = (category: string) => {
  const normalized = category.toLowerCase();
  if (normalized.includes("apartment")) return "Apartment";
  if (normalized.includes("house") || normalized.includes("villa") || normalized.includes("townhouse")) return "House";
  if (normalized.includes("airbnb")) return "Accommodation"; // Or LodgingBusiness
  return "Accommodation";
};

export default function PropertyStructuredData({
  property,
  url,
}: PropertyStructuredDataProps) {
  // Use specific accommodation type (e.g., Apartment, House) for Google Rich Results
  const itemType = mapCategoryToType(property.category);
  const sellerType = property.company ? "Organization" : "Person";
  const sellerName = property.company?.name || property.user.name;

  const propertySchema = {
    "@context": "https://schema.org",
    "@type": itemType,
    "@id": `${url}#property`,
    "name": property.title,
    "description": property.description,
    "url": url,
    "image": property.images.slice(0, 5), // Include up to 5 images
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.location.address,
      "addressLocality": property.location.neighborhood || property.location.city,
      "addressRegion": property.location.city,
      "addressCountry": "KE",
    },
    // Only add rooms/bathrooms if it's an Accommodation type that supports it and value > 0
    ...(property.bedrooms > 0 ? { "numberOfRooms": property.bedrooms } : {}),
    ...(property.bathrooms > 0 ? { "numberOfBathroomsTotal": property.bathrooms } : {}),
    "amenityFeature": property.features.map(feature => ({
      "@type": "LocationFeatureSpecification",
      "name": feature,
      "value": true,
    })),
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "KES",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString(),
      "url": url,
      "seller": {
        "@type": sellerType,
        "name": sellerName,
        ...(property.company?.logo ? { "image": property.company.logo } : {}),
      }
    },
  };

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://vectorafriqproperties.co.ke" },
    {
      name: property.type === "SALE" ? `${property.category} For Sale` : `${property.category} For Rent`,
      url: property.type === "SALE" ? `https://vectorafriqproperties.co.ke/${property.category}-for-sale` : `https://vectorafriqproperties.co.ke/${property.category}-for-rent`
    },
    { name: property.title, url: url }
  ]);

  return (
    <SchemaMarkup
      id={`property-schema-${property.id}`}
      schema={[
        propertySchema,
        breadcrumbSchema,
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${url}#webpage`,
          "url": url,
          "name": `${property.title} | VectorAfriq Kenya`,
          "description": property.description,
          "mainEntity": { "@id": `${url}#property` }
        }
      ]}
    />
  );
}