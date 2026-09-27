import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  normalizeListingDetailsForCategory,
  PropertyCategory,
} from "@/lib/propertyCategories";
import { getAgentListingStatus } from "@/lib/rateCards";

type DbQueryParam = string | number | boolean | null;

// Types for database operations
export interface DbProperty {
  id: number;
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
  images: string;
  videos?: string;
  virtualTour?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  createdAt: Date;
  userName: string;
  userEmail: string;
}

const PropertyStatus = {
  AVAILABLE: "AVAILABLE",
  PENDING: "PENDING",
  SOLD: "SOLD",
  RENTED: "RENTED",
} as const;

type PropertyStatus = (typeof PropertyStatus)[keyof typeof PropertyStatus];

async function getLocationNames(
  countyId: string,
  cityId: string,
  neighborhoodId?: string
) {
  const countyQuery = "SELECT name FROM county WHERE id = ?";
  const cityQuery = "SELECT name FROM city WHERE id = ?";
  const neighborhoodQuery = "SELECT name FROM neighborhood WHERE id = ?";

  const [counties, cities, neighborhoods] = await Promise.all([
    query<{ name: string }>(countyQuery, [countyId]),
    query<{ name: string }>(cityQuery, [cityId]),
    neighborhoodId
      ? query<{ name: string }>(neighborhoodQuery, [neighborhoodId])
      : Promise.resolve([]),
  ]);

  const county = counties[0];
  const city = cities[0];
  const neighborhood = neighborhoods[0];

  if (!county || !city) {
    throw new Error("Invalid location IDs");
  }

  return {
    county: county.name,
    city: city.name,
    neighborhood: neighborhood?.name,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to create a property listing" },
        { status: 401 }
      );
    }

    // Check if user has agent approval before creating a listing
    const [userInfo] = await query<{ role: string }>(
      `SELECT role FROM user WHERE id = ?`,
      [session.user.id]
    );

    if (userInfo?.role !== "AGENT" && userInfo?.role !== "ADMIN") {
      // Check if user has an approved agent application
      const approvedApplications = await query<{ id: string }>(
        `SELECT id FROM agent_approval WHERE userId = ? AND status = 'APPROVED'`,
        [session.user.id]
      ).catch(() => [] as { id: string }[]);

      const approvedApplication = approvedApplications[0];

      if (!approvedApplication) {
        return NextResponse.json(
          {
            error: "Agent approval required",
            details: "You need to be an approved agent to create property listings. Please apply for agent approval in your profile settings.",
            requiresApproval: true
          },
          { status: 403 }
        );
      }

      // Auto-upgrade user to AGENT if they have an approved application
      await query(
        `UPDATE user SET role = 'AGENT', updatedAt = NOW() WHERE id = ? AND role = 'USER'`,
        [session.user.id]
      );
    }

    // Enforce listing quota / rate-card plan limits
    if (userInfo?.role !== "ADMIN") {
      const listingStatus = await getAgentListingStatus(session.user.id);
      if (listingStatus && !listingStatus.canCreateListing) {
        return NextResponse.json(
          {
            error: "Listing limit reached",
            details: `You have used ${listingStatus.listingCount} of ${listingStatus.listingQuota} allowed listings. Upgrade your rate card plan to list more properties.`,
            listingStatus,
            requiresUpgrade: true,
            upgradeUrl: "/crm/rate-cards",
          },
          { status: 403 }
        );
      }
    }

    const formData = await req.formData();

    // Parse basic info
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const propertyCategory = formData.get(
      "propertyCategory"
    ) as PropertyCategory;
    const listingType = formData.get("listingType") as string;
    const price = parseFloat(formData.get("price") as string);
    const priceUnit = formData.get("priceUnit") as string;
    const negotiable = formData.get("negotiable") === "true";
    const paymentTerms = formData.get("paymentTerms") as string;

    // Validate required fields
    if (!title || !description || !propertyCategory || !listingType || !price) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details:
            "Title, description, category, listing type, and price are required",
        },
        { status: 400 }
      );
    }

    if (!Object.values(PropertyCategory).includes(propertyCategory)) {
      return NextResponse.json(
        {
          error: "Invalid property category",
          details: "Please select a supported property category",
        },
        { status: 400 }
      );
    }

    // Parse location IDs
    const countyId = formData.get("county") as string;
    const cityId = formData.get("city") as string;
    const neighborhoodId = formData.get("neighborhood") as string;
    const address = formData.get("address") as string;

    if (!countyId || !cityId) {
      return NextResponse.json(
        {
          error: "Missing location fields",
          details: "County and city are required",
        },
        { status: 400 }
      );
    }

    // Get location names from IDs
    const locationNames = await getLocationNames(
      countyId,
      cityId,
      neighborhoodId || undefined
    );
    const formattedLocation = `${locationNames.neighborhood ? `${locationNames.neighborhood}, ` : ""
      }${locationNames.city}, ${locationNames.county}`;

    // Parse details
    const bedrooms = parseInt(formData.get("bedrooms") as string);
    const bathrooms = parseInt(formData.get("bathrooms") as string);
    const area = parseFloat(formData.get("area") as string);
    const plotSize = parseFloat(formData.get("plotSize") as string);
    const yearBuiltValue = parseInt(formData.get("yearBuilt") as string);
    const featuresData = (formData.get("features") as string) || "[]";
    const features = JSON.parse(featuresData);
    const virtualTour = (formData.get("virtualTour") as string) || "";
    const youtubeUrl = (formData.get("youtubeUrl") as string) || "";
    const tiktokUrl = (formData.get("tiktokUrl") as string) || "";
    const facebookUrl = (formData.get("facebookUrl") as string) || "";
    const normalizedDetails = normalizeListingDetailsForCategory(
      propertyCategory,
      {
        bedrooms,
        bathrooms,
        area,
        plotSize,
      }
    );
    const yearBuilt = Number.isFinite(yearBuiltValue)
      ? yearBuiltValue
      : new Date().getFullYear();

    // Store additional metadata
    const metadata = {
      yearBuilt,
      priceUnit,
      negotiable,
      paymentTerms,
      address,
      locationIds: {
        county: countyId,
        city: cityId,
        neighborhood: neighborhoodId || null,
      },
    };

    // Generate a UUID for the property
    const propertyId = `cm${Date.now().toString(36)}${Math.random()
      .toString(36)
      .substr(2, 5)}`;

    // Create property record with empty images array
    const insertQuery = `
      INSERT INTO property (
        id, title, description, price, category, type, location,
        bedrooms, bathrooms, floorSize, plotSize, paymentTerms, features, userId, status, images, videos,
        virtualTour, youtubeUrl, tiktokUrl, facebookUrl,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    await query(insertQuery, [
      propertyId,
      title,
      description,
      price,
      propertyCategory,
      listingType,
      formattedLocation,
      normalizedDetails.bedrooms,
      normalizedDetails.bathrooms,
      normalizedDetails.area,
      normalizedDetails.plotSize,
      paymentTerms,
      JSON.stringify({ features, metadata }),
      session.user.id,
      PropertyStatus.AVAILABLE,
      "[]", // Empty images array initially
      "[]", // Empty videos array initially
      virtualTour,
      youtubeUrl,
      tiktokUrl,
      facebookUrl,
    ]);

    // Note: Agent role is now managed through the approval system
    // User role was already verified/updated at the start of this request

    // Get pre-uploaded image URLs from form data
    const uploadedImages =
      formData.get("uploadedImages") || formData.get("images") || "[]";
    console.log("Raw uploaded images:", { propertyId, uploadedImages });

    let imageUrls: string[] = [];
    try {
      const parsed = JSON.parse(uploadedImages as string);
      imageUrls = Array.isArray(parsed) ? parsed : [];

      console.log("Parsed images:", {
        propertyId,
        parsed,
        isArray: Array.isArray(parsed),
      });

      // Validate and filter image URLs, extracting paths from full URLs
      imageUrls = imageUrls.filter((url) => {
        if (typeof url !== "string") {
          console.warn("Invalid image URL type", { propertyId, url });
          return false;
        }

        try {
          // Handle both full URLs and paths
          if (url.startsWith("http")) {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            if (!path.startsWith("/properties/")) {
              console.warn("Invalid image path in URL", { propertyId, url });
              return false;
            }
            // Replace the full URL with just the path
            imageUrls[imageUrls.indexOf(url)] = path;
            return true;
          } else if (url.startsWith("/properties/")) {
            return true;
          }
          console.warn("Invalid image URL format", { propertyId, url });
          return false;
        } catch (error) {
          console.warn("Failed to parse image URL", { propertyId, url, error });
          return false;
        }
      });

      console.log("Validated image URLs:", {
        propertyId,
        count: imageUrls.length,
        urls: imageUrls,
      });
    } catch (error) {
      console.error("Failed to parse uploaded images:", {
        propertyId,
        error,
        raw: uploadedImages,
      });
      imageUrls = [];
    }

    // Update property with image URLs
    // Update property with image paths in database
    if (imageUrls.length > 0) {
      try {
        // Ensure we store only the paths without the domain
        const imagePaths = imageUrls
          .map((url) => {
            // Handle both full URLs and paths
            const path = url.trim();
            try {
              if (path.startsWith("http")) {
                const urlObj = new URL(path);
                if (!urlObj.pathname.startsWith("/properties/")) {
                  console.warn(
                    `Invalid image path format for property ${propertyId}:`,
                    path
                  );
                  return null;
                }
                return urlObj.pathname;
              } else if (path.startsWith("/properties/")) {
                return path;
              }
              console.warn(
                `Invalid image path format for property ${propertyId}:`,
                path
              );
              return null;
            } catch (error) {
              console.warn(
                `Failed to parse image URL for property ${propertyId}:`,
                path,
                error
              );
              return null;
            }
          })
          .filter((path): path is string => path !== null);

        // Always update the property, even if there are no valid images
        const updateQuery = `
          UPDATE property
          SET images = ?,
              updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        await query(updateQuery, [
          JSON.stringify(imagePaths.length > 0 ? imagePaths : []),
          propertyId,
        ]);

        if (imagePaths.length === 0) {
          console.warn(
            `No valid image paths to save for property ${propertyId}`
          );
        }

        // Verify the database update
        const [updated] = await query<DbProperty>(
          "SELECT images FROM property WHERE id = ?",
          [propertyId]
        );

        if (!updated?.images) {
          throw new Error("No images found after update");
        }

        const savedImages = JSON.parse(updated.images);
        if (!Array.isArray(savedImages)) {
          throw new Error("Saved images is not an array");
        }

        // Check for any missing or incorrect paths
        const missingPaths = imageUrls.filter(
          (url) => !savedImages.includes(url)
        );
        if (missingPaths.length > 0) {
          console.warn("Some images failed to save:", {
            propertyId,
            missing: missingPaths,
          });
        }

        console.log("Images saved successfully:", {
          propertyId,
          expected: imageUrls.length,
          saved: savedImages.length,
          paths: savedImages,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to update property images:", {
          error,
          propertyId,
          attempted: imageUrls,
        });
      }
    } else {
      console.warn("No images were uploaded successfully for:", propertyId);
    }

    // Handle videos update
    const uploadedVideos = formData.get("videos") as string;
    if (uploadedVideos) {
      try {
        const videoUrls = JSON.parse(uploadedVideos);
        if (Array.isArray(videoUrls) && videoUrls.length > 0) {
          const videoPaths = videoUrls.map(url => {
            if (url.startsWith('/api/videos/')) return url;
            try {
              const urlObj = new URL(url);
              return urlObj.pathname;
            } catch {
              return url;
            }
          });

          await query(
            "UPDATE property SET videos = ? WHERE id = ?",
            [JSON.stringify(videoPaths), propertyId]
          );
        }
      } catch (error) {
        console.error("Failed to update property videos:", error);
      }
    }

    // Fetch the updated property with user details
    const getPropertyQuery = `
      SELECT p.*, u.id as userId, u.name as userName, u.email as userEmail
      FROM property p
      LEFT JOIN user u ON p.userId = u.id
      WHERE p.id = ?
    `;
    const [updatedProperty] = await query<DbProperty>(getPropertyQuery, [
      propertyId,
    ]);

    // Format response with full image URLs
    const parsedImages = JSON.parse(updatedProperty.images || "[]");
    const formattedImageUrls = Array.isArray(parsedImages)
      ? parsedImages.map((path) => `https://uat.com.vectorafriqproperties.co.ke${path}`)
      : [];

    const parsedVideos = JSON.parse(updatedProperty.videos || "[]");
    const formattedVideoUrls = Array.isArray(parsedVideos)
      ? parsedVideos.map((path) => `https://uat.com.vectorafriqproperties.co.ke${path}`)
      : [];

    const responseProperty = {
      ...updatedProperty,
      images: JSON.stringify(formattedImageUrls),
      videos: JSON.stringify(formattedVideoUrls),
      user: {
        id: updatedProperty.userId,
        name: updatedProperty.userName,
        email: updatedProperty.userEmail,
      },
    };

    return NextResponse.json({
      success: true,
      property: responseProperty,
      uploadStats: {
        total: formattedImageUrls.length,
        successful: formattedImageUrls.length,
        failed: 0,
      },
    });
  } catch (error) {
    console.error("[Property Creation Error]:", error);

    // Ensure we always return JSON, never HTML
    const errorResponse = {
      error: "Failed to create property listing",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as PropertyStatus | null;
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build the WHERE clause
    const whereClause = ["userId = ?"];
    const params: DbQueryParam[] = [session.user.id];

    if (status) {
      whereClause.push("status = ?");
      params.push(status);
    }

    if (search) {
      whereClause.push(
        "(title LIKE ? OR description LIKE ? OR location LIKE ?)"
      );
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add pagination parameters
    params.push(limit, skip);

    // Query for properties with pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM property
      WHERE ${whereClause.join(" AND ")}
    `;

    const propertiesQuery = `
      SELECT p.*, u.id as userId, u.name as userName, u.email as userEmail
      FROM property p
      LEFT JOIN user u ON p.userId = u.id
      WHERE ${whereClause.join(" AND ")}
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const [totalResult, properties] = await Promise.all([
      query<{ total: number }>(countQuery, params.slice(0, -2)), // Remove pagination params
      query<DbProperty>(propertiesQuery, params),
    ]);

    const total = totalResult[0].total;

    // Format properties and convert image paths to full URLs
    const formattedProperties = properties.map((property) => {
      let imagePaths: string[] = [];
      try {
        // Parse stored image paths with improved validation
        if (
          !property.images ||
          property.images === "[]" ||
          property.images === ""
        ) {
          imagePaths = [];
        } else {
          try {
            const parsed = JSON.parse(property.images);
            // Ensure we have an array of strings using type predicate
            imagePaths = Array.isArray(parsed)
              ? parsed.filter(
                (path): path is string => typeof path === "string"
              )
              : [];
          } catch {
            console.warn(
              `Invalid JSON in images field for property ${property.id}:`,
              property.images
            );
            imagePaths = [];
          }
        }

        // Convert paths to full URLs
        const imageUrls = imagePaths
          .map((path) => {
            if (!path.startsWith("/properties/")) {
              console.warn(
                `Invalid image path format in database for property ${property.id}:`,
                path
              );
              return null;
            }
            return `https://uat.com.vectorafriqproperties.co.ke${path}`;
          })
          .filter((url): url is string => url !== null);

        // Process videos if they exist
        let videoUrls: string[] = [];
        if (property.videos) {
          try {
            const parsedVideos = JSON.parse(property.videos);
            if (Array.isArray(parsedVideos)) {
              videoUrls = parsedVideos.map(path =>
                path.startsWith('http') ? path : `https://uat.com.vectorafriqproperties.co.ke${path}`
              );
            }
          } catch (e) {
            console.warn(`Failed to parse videos for property ${property.id}`);
          }
        }

        if (process.env.NODE_ENV === "development") {
          console.log(`[Property Processing] Property ${property.id}:`, {
            imageCount: imageUrls.length,
            videoCount: videoUrls.length,
          });
        }

        const formattedProperty = {
          ...property,
          images: JSON.stringify(imageUrls),
          videos: JSON.stringify(videoUrls),
          user: {
            id: property.userId,
            name: property.userName,
            email: property.userEmail,
          },
        };

        return formattedProperty;
      } catch (error) {
        console.error(
          `Error processing images for property ${property.id}:`,
          error
        );
        return {
          ...property,
          images: "[]", // Return empty array if parsing fails
          user: {
            id: property.userId,
            name: property.userName,
            email: property.userEmail,
          },
        };
      }
    });

    return NextResponse.json({
      success: true,
      properties: formattedProperties,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("[Property List Error]:", error);

    // Ensure we always return JSON, never HTML
    const errorResponse = {
      error: "Failed to fetch properties",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
