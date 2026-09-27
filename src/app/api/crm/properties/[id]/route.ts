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
  videos?: string;
  createdAt: Date;
  userName: string;
  userEmail: string;
  userPhone: string;
  companyPhone: string | null;
  companyName: string | null;
  companyLogo: string | null;
  // Location related fields from JOINs with explicit IDs
  neighborhoodId: string | null;
  neighborhoodName: string | null;
  cityId: string | null;
  cityName: string | null;
  countyId: string | null;
  countyName: string | null;
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

    const session = await getServerSession(authOptions);
    console.log("[API Debug] Auth session:", {
      userId: session?.user?.id,
      role: session?.user?.role,
      authenticated: !!session,
    });

    // Allow public access to property details
    // Remove auth check as this seems to be a public endpoint based on the page component

    // Get property details with user and company info
    const getPropertyQuery = `
      SELECT
        p.*,
        u.id as userId,
        u.name as userName,
        u.email as userEmail,
        u.phone as userPhone,
        c.phone as companyPhone,
        c.name as companyName,
        c.logo as companyLogo
      FROM property p
      LEFT JOIN user u ON p.userId = u.id
      LEFT JOIN company c ON u.id = c.userId
      WHERE p.id = ?
    `;

    console.log("[API Debug] SQL Query:", getPropertyQuery);

    console.log("[API Debug] Executing property query:", {
      id: propertyId,
      timestamp: new Date().toISOString(),
    });

    console.log("[API Debug] Fetching property:", propertyId);
    console.log("[API Debug] Running query:", getPropertyQuery);
    console.log("[API Debug] Executing query with propertyId:", propertyId);
    const [property] = await query<DbProperty>(getPropertyQuery, [propertyId]);

    // Log raw database result to verify phone number
    if (property) {
      console.log("[API Debug] Database result contains phone:", {
        userPhone: property.userPhone,
        userName: property.userName,
        userId: property.userId,
      });
    }
    console.log("[API Debug] Query result:", {
      id: property?.id,
      userId: property?.userId,
      userPhone: property?.userPhone,
      rawProperty: property,
    });

    if (!property) {
      console.log("[API Debug] Property not found");
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
    let locationData = null;

    // Helper function to execute search
    const executeLocationSearch = async (neighborhood: string, city: string, county: string) => {
      // Strategy 1: Precise Hierarchy Match (Best Quality)
      if (neighborhood && city && county) {
        const queryN = `
            SELECT
              n.id as neighborhoodId,
              n.name as neighborhoodName,
              c.id as cityId,
              c.name as cityName,
              co.id as countyId,
              co.name as countyName
            FROM neighborhood n
            JOIN city c ON c.id = n.cityId
            JOIN county co ON co.id = c.countyId
            WHERE LOWER(n.name) LIKE ? AND LOWER(c.name) LIKE ? AND LOWER(co.name) LIKE ?
            LIMIT 1
          `;
        const [match] = await query(queryN, [`%${neighborhood}%`, `%${city}%`, `%${county}%`]);
        if (match) return { ...match, priority: 1 };
      }

      // Strategy 2: City + County Match (High Quality)
      // This is crucial for "City, County" formats or when neighborhood is missing/invalid
      if (city && county) {
        const queryC = `
            SELECT
              NULL as neighborhoodId,
              NULL as neighborhoodName,
              c.id as cityId,
              c.name as cityName,
              co.id as countyId,
              co.name as countyName
            FROM city c
            JOIN county co ON co.id = c.countyId
            WHERE LOWER(c.name) LIKE ? AND LOWER(co.name) LIKE ?
            LIMIT 1
          `;
        const [match] = await query(queryC, [`%${city}%`, `%${county}%`]);
        if (match) return { ...match, priority: 2 };
      }

      // Strategy 3: Loose Search (Fallback)
      // Search individually and try to reconstruct
      // Only do this if we haven't found a match yet
      const searchTerms = [];
      const queries = [];

      if (neighborhood) {
        queries.push(`
            SELECT n.id as neighborhoodId, n.name as neighborhoodName, c.id as cityId, c.name as cityName, co.id as countyId, co.name as countyName, 3 as priority
            FROM neighborhood n JOIN city c ON c.id = n.cityId JOIN county co ON co.id = c.countyId
            WHERE LOWER(n.name) LIKE ?
          `);
        searchTerms.push(`%${neighborhood}%`);
      }

      if (city) {
        queries.push(`
            SELECT NULL as neighborhoodId, NULL as neighborhoodName, c.id as cityId, c.name as cityName, co.id as countyId, co.name as countyName, 4 as priority
            FROM city c JOIN county co ON co.id = c.countyId
            WHERE LOWER(c.name) LIKE ?
          `);
        searchTerms.push(`%${city}%`);
      }

      if (queries.length > 0) {
        const finalQuery = queries.join(' UNION ALL ') + ' ORDER BY priority ASC LIMIT 1';
        const [match] = await query(finalQuery, searchTerms);
        if (match) return match;
      }

      return null;
    };

    if (locationParts.length > 0) {
      let neighborhoodName = "";
      let cityName = "";
      let countyName = "";

      // Intelligent parsing based on length
      if (locationParts.length >= 3) {
        neighborhoodName = locationParts[0];
        cityName = locationParts[1];
        countyName = locationParts[2];
      } else if (locationParts.length === 2) {
        cityName = locationParts[0];
        countyName = locationParts[1];
      } else {
        // Single part - could be anything, but assume City or County
        cityName = locationParts[0];
      }

      console.log("[API Debug] advanced search inputs:", { neighborhoodName, cityName, countyName });
      locationData = await executeLocationSearch(neighborhoodName, cityName, countyName);
    }

    // Property existence already checked above

    // Public endpoint - no authorization required for GET
    // Only log access info if there's an authenticated user
    if (session?.user) {
      const isOwner = property.userId === session.user.id;
      const isAdmin = session.user.role === "ADMIN";

      console.log("[API Debug] Access check:", {
        isOwner,
        isAdmin,
        propertyUserId: property.userId,
      });
    }

    // Format images with full URLs
    let imageUrls: string[] = [];
    try {
      if (property.images && property.images !== "[]") {
        const imagePaths = JSON.parse(property.images);
        imageUrls = Array.isArray(imagePaths)
          ? imagePaths
            .filter((path): path is string => typeof path === "string")
            .map((path) => path)
          : [];
      }
    } catch (error) {
      console.error(
        `Error processing images for property ${property.id}:`,
        error
      );
    }

    // Format videos with full URLs
    let videoUrls: string[] = [];
    try {
      if (property.videos && property.videos !== "[]") {
        const videoPaths = JSON.parse(property.videos);
        videoUrls = Array.isArray(videoPaths)
          ? videoPaths
            .filter((path): path is string => typeof path === "string")
            .map((path) => path)
          : [];
      }
    } catch (error) {
      console.error(
        `Error processing videos for property ${property.id}:`,
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
      console.log("[API Debug] Found locationIds in metadata:", metadata.locationIds);

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
          console.log("[API Debug] Using metadata location data:", finalLocationData);
        }
      } catch (error) {
        console.error("[API Debug] Error fetching metadata location data:", error);
      }
    }

    // Debug user and company data before formatting
    console.log("[API Debug] User and company data:", {
      userId: property.userId,
      userName: property.userName,
      userEmail: property.userEmail,
      userPhone: property.userPhone,
      companyPhone: property.companyPhone,
      companyName: property.companyName,
      companyLogo: property.companyLogo,
    });

    // Format property response with enhanced location data
    const formattedProperty = {
      ...property,
      images: JSON.stringify(imageUrls),
      videos: JSON.stringify(videoUrls),
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
      user: {
        id: property.userId || "",
        name: property.userName || "",
        email: property.userEmail || "",
        phone: property.userPhone || "",
      },
      company: property.companyName ? {
        id: property.userId || "", // Using userId as company identifier for now
        name: property.companyName,
        logo: property.companyLogo || "",
        email: property.userEmail || "",
        phone: property.companyPhone || "",
        website: "",
      } : null,
      // Enhanced location debugging info
      _debug: {
        location: {
          original: property.location,
          parts: locationParts,
          processed: {
            neighborhood: locationParts[0] || null,
            city: locationParts[1] || null,
            county: locationParts[2] || null,
          },
        },
        matching: {
          success: !!finalLocationData,
          priority: finalLocationData?.priority,
          source: metadata.locationIds ? 'metadata' : 'parsed',
          matched: finalLocationData
            ? {
              neighborhood: finalLocationData.neighborhoodName,
              city: finalLocationData.cityName,
              county: finalLocationData.countyName,
              ids: {
                neighborhood: finalLocationData.neighborhoodId,
                city: finalLocationData.cityId,
                county: finalLocationData.countyId,
              },
            }
            : null,
          metadata: metadata.locationIds || null,
        },
      },
    };
    // Log final response data
    console.log("[API Debug] Property response:", {
      user: formattedProperty.user,
      location_data: {
        original: property.location,
        source: metadata.locationIds ? 'metadata' : 'parsed',
        found: finalLocationData && {
          id: finalLocationData.neighborhoodId,
          neighborhood: finalLocationData.neighborhoodName,
          city: finalLocationData.cityName,
          county: finalLocationData.countyName,
          score: finalLocationData.match_score,
        },
        metadata_ids: metadata.locationIds,
      },
      metadata,
      features: features,
      amenities: features, // Same data for both since form combines them
    });

    return NextResponse.json(formattedProperty);
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a property
export async function PATCH(request: NextRequest) {
  try {
    const propertyId = getPropertyId(request.nextUrl.pathname);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if property exists and user has permission
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

    if (property.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();
    const requestedCategory = data.category as PropertyCategory;

    // Handle featured toggle if it's the only field being updated
    if (data.hasOwnProperty("featured") && Object.keys(data).length === 1) {
      const updateFeaturedQuery = `
        UPDATE property
        SET featured = ?,
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await query(updateFeaturedQuery, [data.featured, propertyId]);

      const [updatedProperty] = await query<DbProperty>(
        `
        SELECT p.*, u.id as userId, u.name as userName, u.email as userEmail, u.phone as userPhone
        FROM property p
        LEFT JOIN user u ON p.userId = u.id
        WHERE p.id = ?
      `,
        [propertyId]
      );

      return NextResponse.json({
        success: true,
        property: {
          ...updatedProperty,
          user: {
            id: updatedProperty.userId,
            name: updatedProperty.userName,
            email: updatedProperty.userEmail,
            phone: updatedProperty.userPhone || "",
          },
        },
      });
    }

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

    // Handle full property update
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
      AND ci.countyId = c.id  -- Ensure valid hierarchy`,
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
        // This could happen when neighborhood is not provided
        const cityResult = await query("SELECT name FROM city WHERE id = ?", [
          data.city,
        ]);
        const countyResult = await query(
          "SELECT name FROM county WHERE id = ?",
          [data.county]
        );

        locationString = `${cityResult[0]?.name || ""}, ${countyResult[0]?.name || ""
          }`;
      } else {
        locationString = locationData.neighborhoodName
          ? `${locationData.neighborhoodName}, ${locationData.cityName}, ${locationData.countyName}`
          : `${locationData.cityName}, ${locationData.countyName}`;
      }
      console.log("[API Debug] Location updated:", {
        hierarchy: {
          neighborhood: {
            id: locationData.neighborhoodId,
            name: locationData.neighborhoodName,
          },
          city: { id: locationData.cityId, name: locationData.cityName },
          county: { id: locationData.countyId, name: locationData.countyName },
        },
        text: locationString,
      });
    }

    // Log location update details
    console.log("[API Debug] Location update:", {
      previous: property.location,
      current: locationString,
      changed: locationString !== property.location,
      validation: {
        requested: {
          neighborhood: data.neighborhood,
          city: data.city,
          county: data.county,
        },
        found: locationData && {
          neighborhood: locationData.neighborhoodName,
          city: locationData.cityName,
          county: locationData.countyName,
          ids: {
            neighborhood: locationData.neighborhoodId,
            city: locationData.cityId,
            county: locationData.countyId,
          },
        },
      },
    });

    // Validate final location string
    if (locationString && !isValidLocationFormat(locationString)) {
      console.error("[API Error] Malformed location string:", {
        location: locationString,
        expected: "neighborhood, city, county",
      });
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
        const parsed = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
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
      } else {
        imageUrls = property.images ? JSON.parse(property.images) : [];
      }
    } catch (error) {
      console.error("Failed to parse images:", error);
      imageUrls = property.images ? JSON.parse(property.images) : [];
    }

    // Validate and process videos
    let videoUrls: string[] = [];
    try {
      if (data.videos) {
        const parsed = typeof data.videos === 'string' ? JSON.parse(data.videos) : data.videos;
        videoUrls = Array.isArray(parsed)
          ? parsed.filter((url: string) => {
            if (typeof url !== "string") return false;
            try {
              if (url.startsWith("/api/videos/")) return true;
              if (url.startsWith("http")) {
                const urlObj = new URL(url);
                return urlObj.pathname.startsWith("/api/videos/");
              }
              return false;
            } catch {
              return false;
            }
          })
          : [];
      } else {
        // If videos not provided, keep existing
        videoUrls = property.videos ? JSON.parse(property.videos) : [];
      }
    } catch (error) {
      console.error("Failed to parse videos:", error);
      videoUrls = property.videos ? JSON.parse(property.videos) : [];
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
          videos = ?,
          virtualTour = ?,
          youtubeUrl = ?,
          tiktokUrl = ?,
          facebookUrl = ?,
          featured = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(updateQuery, [
      data.title,
      data.description,
      requestedCategory,
      data.type,
      locationString, // Store the full location text string
      data.price,
      data.paymentTerms,
      normalizedDetails.bedrooms,
      normalizedDetails.bathrooms,
      normalizedDetails.area,
      normalizedDetails.plotSize,
      data.features,
      JSON.stringify(imageUrls),
      JSON.stringify(videoUrls),
      data.virtualTour,
      data.youtubeUrl,
      data.tiktokUrl,
      data.facebookUrl,
      data.featured || false,
      propertyId,
    ]);

    // Fetch updated property with location info
    const [updatedProperty] = await query<DbProperty>(
      `
      SELECT
        p.*,
        u.id as userId,
        u.name as userName,
        u.email as userEmail,
        n.name as neighborhoodName,
        ci.id as cityId,
        ci.name as cityName,
        c.id as countyId,
        c.name as countyName
      FROM property p
      LEFT JOIN user u ON p.userId = u.id
      LEFT JOIN neighborhood n ON n.id = p.location
      LEFT JOIN city ci ON ci.id = n.cityId
      LEFT JOIN county c ON c.id = n.countyId
      WHERE p.id = ?
    `,
      [propertyId]
    );

    // Format response
    const formattedImageUrls = imageUrls;

    // Format final response
    const responseProperty = {
      ...updatedProperty,
      images: JSON.stringify(formattedImageUrls),
      videos: updatedProperty.videos,
      // Location data with validation info
      _location: {
        current: {
          text: locationString,
          ids: {
            neighborhood: data.neighborhood || updatedProperty.location,
            city: data.city || updatedProperty.cityId,
            county: data.county || updatedProperty.countyId,
          },
          names: locationData
            ? {
              neighborhood: locationData.neighborhoodName,
              city: locationData.cityName,
              county: locationData.countyName,
            }
            : {
              neighborhood: updatedProperty.neighborhoodName,
              city: updatedProperty.cityName,
              county: updatedProperty.countyName,
            },
        },
        previous: {
          text: property.location,
          ids: {
            neighborhood: property.location,
            city: property.cityId,
            county: property.countyId,
          },
        },
        status: {
          validated: !!locationData,
          changed: locationString !== property.location,
        },
      },
      // Main location fields
      county: locationData
        ? {
          id: locationData.countyId,
          name: locationData.countyName,
        }
        : {
          id: updatedProperty.countyId || "",
          name: updatedProperty.countyName || "",
        },
      city: locationData
        ? {
          id: locationData.cityId,
          name: locationData.cityName,
        }
        : {
          id: updatedProperty.cityId || "",
          name: updatedProperty.cityName || "",
        },
      neighborhood: locationData
        ? {
          id: data.neighborhood,
          name: locationData.neighborhoodName,
        }
        : {
          id: updatedProperty.location || "",
          name: updatedProperty.neighborhoodName || "",
        },
      location: locationString,
      user: {
        id: updatedProperty.userId,
        name: updatedProperty.userName,
        email: updatedProperty.userEmail,
      },
    };

    // Log final response state
    console.log("[API Debug] Location update complete:", {
      location: {
        previous: property.location,
        current: locationString,
        changed: locationString !== property.location,
        validation: {
          locationData: !!locationData,
          ids: {
            provided: {
              neighborhood: !!data.neighborhood,
              city: !!data.city,
              county: !!data.county,
            },
            matched: locationData && {
              neighborhood: locationData.neighborhoodId,
              city: locationData.cityId,
              county: locationData.countyId,
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      property: responseProperty,
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

// DELETE endpoint to remove a property
export async function DELETE(request: NextRequest) {
  try {
    const propertyId = getPropertyId(request.nextUrl.pathname);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if property exists and user has permission
    const [property] = await query<DbProperty>(
      "SELECT userId FROM property WHERE id = ?",
      [propertyId]
    );

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (property.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the property
    const deleteQuery = "DELETE FROM property WHERE id = ?";
    await query(deleteQuery, [propertyId]);

    return NextResponse.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      {
        error: "Failed to delete property",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
