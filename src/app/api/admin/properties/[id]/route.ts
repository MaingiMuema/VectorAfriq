import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  normalizeListingDetailsForCategory,
  PropertyCategory,
} from "@/lib/propertyCategories";

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
  userId: string;
  status: string;
  featured: boolean;
  images: string;
  createdAt: Date;
  userName: string;
  userEmail: string;
  userPhone: string;
}

// Get property ID from URL
function getPropertyId(url: string) {
  const segments = url.split("/").filter(Boolean);
  return segments[segments.length - 1];
}

// GET endpoint to fetch a single property for admin editing
export async function GET(request: NextRequest) {
  try {
    const propertyId = getPropertyId(request.nextUrl.pathname);

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get property details with user and company info
    const getPropertyQuery = `
      SELECT
        p.*,
        u.name as userName,
        u.email as userEmail,
        u.phone as userPhone
      FROM property p
      LEFT JOIN user u ON p.userId = u.id
      WHERE p.id = ?
    `;

    const [property] = await query<DbProperty>(getPropertyQuery, [propertyId]);

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Parse location string to extract location names
    const locationParts = property.location
      ? property.location.split(",").map((part) => part.trim().toLowerCase())
      : [];

    // Find matching location IDs from names with fuzzy matching
    const locationQuery = `
      WITH location_search AS (
        SELECT
          n.id as neighborhoodId,
          n.name as neighborhoodName,
          c.id as cityId,
          c.name as cityName,
          co.id as countyId,
          co.name as countyName,
          1 as priority
        FROM neighborhood n
        JOIN city c ON c.id = n.cityId
        JOIN county co ON co.id = c.countyId
        WHERE LOWER(n.name) LIKE LOWER(?)

        UNION ALL

        SELECT
          NULL as neighborhoodId,
          NULL as neighborhoodName,
          c.id as cityId,
          c.name as cityName,
          co.id as countyId,
          co.name as countyName,
          2 as priority
        FROM city c
        JOIN county co ON co.id = c.countyId
        WHERE LOWER(c.name) LIKE LOWER(?)

        UNION ALL

        SELECT
          NULL as neighborhoodId,
          NULL as neighborhoodName,
          NULL as cityId,
          NULL as cityName,
          co.id as countyId,
          co.name as countyName,
          3 as priority
        FROM county co
        WHERE LOWER(co.name) LIKE LOWER(?)
      )
      SELECT * FROM location_search
      ORDER BY priority ASC
      LIMIT 1
    `;

    let locationData = null;
    if (locationParts.length > 0) {
      // Extract location parts in correct order (neighborhood, city, county)
      const [neighborhoodName = "", cityName = "", countyName = ""] =
        locationParts;

      // Add wildcards for fuzzy matching
      const wildcardParams = [
        `%${neighborhoodName}%`,
        `%${cityName}%`,
        `%${countyName}%`,
      ];

      const [location] = await query(locationQuery, wildcardParams);
      locationData = location;
    }

    // Format images with full URLs
    let imageUrls: string[] = [];
    try {
      if (property.images && property.images !== "[]") {
        const imagePaths = JSON.parse(property.images);
        imageUrls = Array.isArray(imagePaths)
          ? imagePaths
              .filter((path): path is string => typeof path === "string")
              .map((path) => {
                if (path.startsWith("/properties/")) {
                  return `https://uat.com.vectorafriqproperties.co.ke${path}`;
                }
                return path;
              })
          : [];
      }
    } catch (error) {
      console.error(
        `Error processing images for property ${property.id}:`,
        error
      );
    }

    // Parse the features JSON to get metadata
    let features;
    let metadata;
    try {
      const parsedFeatures = JSON.parse(property.features || "{}");

      // Handle new storage format: { features: [...], metadata: {...} }
      if (parsedFeatures.features && parsedFeatures.metadata) {
        features = Array.isArray(parsedFeatures.features) ? parsedFeatures.features : [];
        metadata = parsedFeatures.metadata || {};
      }
      // Handle legacy formats
      else if (Array.isArray(parsedFeatures)) {
        // If features is directly an array
        features = parsedFeatures;
        metadata = {};
      } else if (parsedFeatures.metadata) {
        // If features object contains metadata but features are mixed in
        metadata = parsedFeatures.metadata;
        const featuresObj = { ...parsedFeatures };
        delete featuresObj.metadata;

        // Convert object values to array (not keys!)
        features = Object.values(featuresObj).filter(value => typeof value === 'string');
      } else {
        // Legacy object format - convert values to array (not keys!)
        features = Object.values(parsedFeatures).filter(value => typeof value === 'string');
        metadata = {};
      }
    } catch (error) {
      console.error("Error parsing features:", error);
      features = [];
      metadata = {};
    }

    // Check if we have locationIds in metadata, prioritize those over parsed location string
    let finalLocationData = locationData;
    if (metadata.locationIds) {
      // Fetch location names using the IDs from metadata
      try {
        const locationQuery = `
          SELECT
            n.id as neighborhoodId,
            n.name as neighborhoodName,
            c.id as cityId,
            c.name as cityName,
            co.id as countyId,
            co.name as countyName
          FROM county co
          LEFT JOIN city c ON c.countyId = co.id AND c.id = ?
          LEFT JOIN neighborhood n ON n.cityId = c.id AND n.id = ?
          WHERE co.id = ?
        `;

        const [metadataLocationData] = await query(locationQuery, [
          metadata.locationIds.city || null,
          metadata.locationIds.neighborhood || null,
          metadata.locationIds.county || null,
        ]);

        if (metadataLocationData) {
          finalLocationData = metadataLocationData;
        }
      } catch (error) {
        console.error("Error fetching metadata location data:", error);
      }
    }

    // Format property response with enhanced location data
    const formattedProperty = {
      ...property,
      images: JSON.stringify(imageUrls),
      location: {
        county: finalLocationData?.countyName || locationParts[2] || "",
        city: finalLocationData?.cityName || locationParts[1] || "",
        neighborhood: finalLocationData?.neighborhoodName || locationParts[0] || "",
        address: metadata.address || property.location || "",
        ids: {
          county: finalLocationData?.countyId || metadata.locationIds?.county || "",
          city: finalLocationData?.cityId || metadata.locationIds?.city || "",
          neighborhood: finalLocationData?.neighborhoodId || metadata.locationIds?.neighborhood || "",
        },
      },
      features: JSON.stringify(features),
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

// PATCH endpoint to update a property (admin can edit any property)
export async function PATCH(request: NextRequest) {
  try {
    const propertyId = getPropertyId(request.nextUrl.pathname);

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if property exists
    const [property] = await query<DbProperty>(
      "SELECT * FROM property WHERE id = ?",
      [propertyId]
    );

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const data = await request.json();
    const requestedCategory = data.category as PropertyCategory;

    if (!Object.values(PropertyCategory).includes(requestedCategory)) {
      return NextResponse.json(
        {
          error: "Invalid property category",
          details: "Please select a supported property category.",
        },
        { status: 400 }
      );
    }

    const normalizedDetails = normalizeListingDetailsForCategory(
      requestedCategory,
      {
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        area: Number(data.floorSize),
        plotSize: Number(data.plotSize),
      }
    );

    // Get complete location data to validate hierarchy
    const [locationData] = await query<{
      neighborhoodId: string;
      neighborhoodName: string;
      cityId: string;
      cityName: string;
      countyId: string;
      countyName: string;
    }>(
      `SELECT
        ci.id as cityId,
        ci.name as cityName,
        c.id as countyId,
        c.name as countyName,
        n.id as neighborhoodId,
        n.name as neighborhoodName
      FROM city ci
      JOIN county c ON ci.countyId = c.id
      LEFT JOIN neighborhood n ON n.cityId = ci.id AND n.id = ?
      WHERE ci.id = ? AND c.id = ?
      AND ci.countyId = c.id`,
      [data.neighborhood || null, data.city, data.county]
    );

    // Validate and update location data
    let locationString = property.location; // Default to current location

    // Function to validate location text format
    function isValidLocationFormat(text: string): boolean {
      const parts = text.split(",").map((part) => part.trim());
      // Allow either 2 parts (city, county) or 3 parts (neighborhood, city, county)
      return (
        (parts.length === 2 || parts.length === 3) &&
        parts.every((part) => part.length > 0)
      );
    }

    // Handle location updates
    if (data.city || data.county) {
      // Verify required location fields (city and county)
      if (!data.city || !data.county) {
        return NextResponse.json(
          {
            error: "City and county are required when updating location.",
            provided: {
              city: !!data.city,
              county: !!data.county,
            },
          },
          { status: 400 }
        );
      }

      // Only verify neighborhood hierarchy if one is provided
      if (data.neighborhood && !locationData?.neighborhoodId) {
        return NextResponse.json(
          {
            error: "Invalid location hierarchy.",
            details:
              "The selected neighborhood must belong to the selected city.",
            provided: {
              neighborhood: data.neighborhood,
              city: data.city,
              county: data.county,
            },
          },
          { status: 400 }
        );
      }

      // Format location string, handling cases where locationData might be null
      if (!locationData) {
        // If no location data found but we have city/county, use the raw values
        const cityResult = await query("SELECT name FROM city WHERE id = ?", [
          data.city,
        ]);
        const countyResult = await query(
          "SELECT name FROM county WHERE id = ?",
          [data.county]
        );

        locationString = `${cityResult[0]?.name || ""}, ${
          countyResult[0]?.name || ""
        }`;
      } else {
        locationString = locationData.neighborhoodName
          ? `${locationData.neighborhoodName}, ${locationData.cityName}, ${locationData.countyName}`
          : `${locationData.cityName}, ${locationData.countyName}`;
      }
    }

    // Validate final location string
    if (locationString && !isValidLocationFormat(locationString)) {
      return NextResponse.json(
        {
          error: "Location string format is invalid",
          expected: "neighborhood, city, county",
        },
        { status: 500 }
      );
    }

    // Validate and process images
    let imageUrls: string[] = [];
    try {
      if (data.images) {
        const parsed = JSON.parse(data.images);
        imageUrls = Array.isArray(parsed)
          ? parsed.filter((url: string) => {
              if (typeof url !== "string") return false;
              try {
                if (url.startsWith("http")) {
                  const urlObj = new URL(url);
                  return urlObj.pathname.startsWith("/properties/");
                }
                return url.startsWith("/properties/");
              } catch {
                return false;
              }
            })
          : [];
      }
    } catch (error) {
      console.error("Failed to parse images:", error);
      imageUrls = [];
    }

    // Update property
    const updateQuery = `
      UPDATE property
      SET title = ?,
          description = ?,
          category = ?,
          type = ?,
          location = ?,
          price = ?,
          paymentTerms = ?,
          bedrooms = ?,
          bathrooms = ?,
          floorSize = ?,
          plotSize = ?,
          features = ?,
          images = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(updateQuery, [
      data.title,
      data.description,
      requestedCategory,
      data.type,
      locationString,
      data.price,
      data.paymentTerms,
      normalizedDetails.bedrooms,
      normalizedDetails.bathrooms,
      normalizedDetails.area,
      normalizedDetails.plotSize,
      data.features,
      JSON.stringify(imageUrls),
      propertyId,
    ]);

    return NextResponse.json({
      success: true,
      message: "Property updated successfully",
    });
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      {
        error: "Failed to update property",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
