/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface DbProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  type: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  floorSize: number;
  plotSize: number;
  paymentTerms: string;
  features: string;
  status: string;
  images: string;
  userId: string;
  featured: boolean;
  createdAt: Date;
}

function splitLocation(location: string) {
  const parts = (location || "").split(",").map((part) => part.trim());
  return {
    neighborhood: parts[0] || "",
    city: parts[1] || "",
    county: parts[2] || "",
  };
}

// Get property ID from URL
function getPropertyId(url: string) {
  const segments = url.split("/").filter(Boolean);
  return segments[segments.length - 1];
}

// GET endpoint to fetch a single property
export async function GET(request: NextRequest) {
  try {
    const propertyId = getPropertyId(request.nextUrl.pathname);

    // Fetch property with agent details. Location (county/city/neighborhood)
    // is stored on the property as a single "neighborhood, city, county"
    // string rather than FK columns, so it's parsed here instead of joined.
    const getPropertyQuery = `
      SELECT p.*, u.name as agentName, u.phone as agentPhone, u.avatar as agentLogo
      FROM property p
      LEFT JOIN user u ON p.userId = u.id
      WHERE p.id = ? AND p.status = 'AVAILABLE'
    `;

    const [property] = await query<
      DbProperty & {
        agentName: string;
        agentPhone: string | null;
        agentLogo: string | null;
      }
    >(getPropertyQuery, [propertyId]);

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const { city: cityName, county: countyName, neighborhood: neighborhoodName } =
      splitLocation(property.location);

    // Format images with full URLs
    let imageUrls: string[] = [];
    try {
      if (property.images && property.images !== "[]") {
        const imagePaths = JSON.parse(property.images);
        imageUrls = Array.isArray(imagePaths)
          ? imagePaths
              .filter((path): path is string => typeof path === "string")
              .map((path) => `https://uat.com.vectorafriqproperties.co.ke${path}`)
          : [];
      }
    } catch (error) {
      console.error(
        `Error processing images for property ${property.id}:`,
        error
      );
    }

    // Get similar properties (same category/type, same city or neighborhood)
    const similarPropertiesQuery = `
      SELECT p.id, p.title, p.price, p.type, p.bedrooms, p.bathrooms, p.images, p.location
      FROM property p
      WHERE p.id != ?
        AND p.category = ?
        AND p.type = ?
        AND p.status = 'AVAILABLE'
        AND (p.location LIKE ? OR p.location LIKE ?)
      LIMIT 3
    `;

    const similarProperties = await query<{
      id: string;
      title: string;
      price: number;
      type: string;
      bedrooms: number;
      bathrooms: number;
      images: string;
      location: string;
    }>(similarPropertiesQuery, [
      propertyId,
      property.category,
      property.type,
      `%${cityName}%`,
      `%${neighborhoodName}%`,
    ]);

    // Format response
    const formattedProperty = {
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price,
      type: property.type,
      category: property.category,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFeet: property.floorSize,
      amenities: (() => {
        try {
          const parsedFeatures = JSON.parse(property.features || "[]");
          
          // Handle new storage format: { features: [...], metadata: {...} }
          if (parsedFeatures.features && Array.isArray(parsedFeatures.features)) {
            return parsedFeatures.features;
          }
          // Handle legacy array format
          else if (Array.isArray(parsedFeatures)) {
            return parsedFeatures;
          }
          // Handle legacy object format - extract values, not keys
          else if (typeof parsedFeatures === 'object' && parsedFeatures !== null) {
            const featuresObj = { ...parsedFeatures };
            delete featuresObj.metadata; // Remove metadata if present
            return Object.values(featuresObj).filter(value => typeof value === 'string');
          }
          
          return [];
        } catch (error) {
          console.error("Error parsing amenities:", error);
          return [];
        }
      })(),
      location: {
        county: countyName,
        city: cityName,
        neighborhood: neighborhoodName || "",
        address: property.location,
      },
      features: (() => {
        try {
          const parsedFeatures = JSON.parse(property.features || "[]");
          
          // Handle new storage format: { features: [...], metadata: {...} }
          if (parsedFeatures.features && Array.isArray(parsedFeatures.features)) {
            return parsedFeatures.features;
          }
          // Handle legacy array format
          else if (Array.isArray(parsedFeatures)) {
            return parsedFeatures;
          }
          // Handle legacy object format - extract values, not keys
          else if (typeof parsedFeatures === 'object' && parsedFeatures !== null) {
            const featuresObj = { ...parsedFeatures };
            delete featuresObj.metadata; // Remove metadata if present
            return Object.values(featuresObj).filter(value => typeof value === 'string');
          }
          
          return [];
        } catch (error) {
          console.error("Error parsing features:", error);
          return [];
        }
      })(),
      images: imageUrls.map((url, id) => ({ id, url })),
      agent: {
        name: property.agentName,
        company: "VectorAfriq",
        logo: property.agentLogo || "/images/default-agent.png",
        phone: property.agentPhone || "",
        whatsapp: property.agentPhone || "",
      },
      similarProperties: similarProperties.map((similar) => {
        const similarLocation = splitLocation(similar.location);
        return {
          id: similar.id,
          title: similar.title,
          type: similar.type,
          price: similar.price,
          bedrooms: similar.bedrooms,
          bathrooms: similar.bathrooms,
          location: {
            city: similarLocation.city,
            neighborhood: similarLocation.neighborhood || "",
          },
          images: similar.images
            ? JSON.parse(similar.images).map((path: string, id: number) => ({
                id,
                url: `https://uat.com.vectorafriqproperties.co.ke${path}`,
              }))
            : [{ id: 0, url: "/images/placeholder.png" }],
        };
      }),
    };

    return NextResponse.json(formattedProperty);
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
