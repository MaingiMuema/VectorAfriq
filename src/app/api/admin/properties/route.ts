import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, DatabaseValue } from "@/lib/db";

interface Property {
  id: string;
  title: string;
  price: number;
  category: string;
  type: string;
  location: string;
  status: string;
  images: string;
  createdAt: Date;
  userId: string;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (search) {
      whereClause += " AND (p.title LIKE ? OR p.location LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += " AND p.category = ?";
      params.push(category);
    }

    if (status) {
      whereClause += " AND p.status = ?";
      params.push(status);
    }

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `
      SELECT COUNT(*) as total 
      FROM property p 
      ${whereClause}
    `,
      params
    );

    const total = countResult.total;

    // Get properties with user data
    const properties = await query<Property & { user: string }>(
      `
      SELECT
        p.id,
        p.title,
        p.price,
        p.category,
        p.type,
        p.location,
        p.status,
        p.images,
        p.createdAt,
        p.userId,
        JSON_OBJECT(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as user
      FROM property p
      LEFT JOIN \`user\` u ON p.userId = u.id
      ${whereClause}
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [...params, limit, skip]
    );

    // Format the response
    const formattedProperties = properties.map((property) => {
      // Process images similar to CRM endpoint
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

      return {
        id: property.id,
        title: property.title,
        price: property.price,
        category: property.category,
        type: property.type,
        location: property.location,
        status: property.status,
        images: JSON.stringify(imageUrls),
        createdAt: property.createdAt,
        user: JSON.parse(property.user as string),
      };
    });

    return NextResponse.json({
      properties: formattedProperties,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Update property status
    await query(
      "UPDATE property SET status = ?, updatedAt = NOW() WHERE id = ?",
      [status, id]
    );

    // Fetch updated property with user data
    const [property] = await query<Property & { user: string }>(
      `
      SELECT
        p.id,
        p.title,
        p.price,
        p.category,
        p.type,
        p.location,
        p.status,
        p.images,
        p.createdAt,
        p.userId,
        JSON_OBJECT(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as user
      FROM property p
      LEFT JOIN \`user\` u ON p.userId = u.id
      WHERE p.id = ?
    `,
      [id]
    );

    // Process images
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

    return NextResponse.json({
      id: property.id,
      title: property.title,
      price: property.price,
      category: property.category,
      type: property.type,
      location: property.location,
      status: property.status,
      images: JSON.stringify(imageUrls),
      createdAt: property.createdAt,
      user: JSON.parse(property.user as string),
    });
  } catch (error) {
    console.error("Error updating property:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing property ID", { status: 400 });
    }

    // Delete the property
    await query("DELETE FROM property WHERE id = ?", [id]);

    return new NextResponse("Property deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting property:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
