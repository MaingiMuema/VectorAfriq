import { NextResponse } from "next/server";
import { query, DatabaseValue } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

interface Neighborhood {
  id: string;
  name: string;
  slug: string;
  cityId: string;
  countyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId");

    let whereClause = "";
    const params: DatabaseValue[] = [];

    if (cityId) {
      whereClause = "WHERE n.cityId = ?";
      params.push(cityId);
    }

    const neighborhoods = await query<
      Neighborhood & { city: string; county: string }
    >(
      `
      SELECT 
        n.*,
        JSON_OBJECT(
          'id', c.id,
          'name', c.name
        ) as city,
        JSON_OBJECT(
          'id', co.id,
          'name', co.name
        ) as county
      FROM neighborhood n
      LEFT JOIN city c ON n.cityId = c.id
      LEFT JOIN county co ON n.countyId = co.id
      ${whereClause}
      ORDER BY n.name ASC
    `,
      params
    );

    // Format the response
    const formattedNeighborhoods = neighborhoods.map((neighborhood) => ({
      ...neighborhood,
      type: 'neighborhood' as const,
      city: JSON.parse(neighborhood.city as string),
      county: JSON.parse(neighborhood.county as string),
    }));

    return NextResponse.json(formattedNeighborhoods);
  } catch (error) {
    console.error(
      "Error in neighborhoods GET:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to fetch neighborhoods" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cityId, countyId } = body;

    if (!name || !cityId || !countyId) {
      return NextResponse.json(
        { error: "Name, city, and county are required" },
        { status: 400 }
      );
    }

    const slug = name.toLowerCase().replace(/ /g, "-");
    const id = uuidv4().replace(/-/g, ""); // Remove hyphens to ensure correct length

    console.log("Attempting to create neighborhood:", {
      id,
      name,
      slug,
      cityId,
      countyId,
    });

    // Begin transaction
    const connection = await (await import("@/lib/db")).pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if city exists
      const [cities] = await connection.execute(
        "SELECT * FROM city WHERE id = ?",
        [cityId]
      );

      if (!Array.isArray(cities) || cities.length === 0) {
        throw new Error("City not found");
      }

      // Check if county exists
      const [counties] = await connection.execute(
        "SELECT * FROM county WHERE id = ?",
        [countyId]
      );

      if (!Array.isArray(counties) || counties.length === 0) {
        throw new Error("County not found");
      }

      // Check for existing neighborhood with same name in the city
      const [existingNeighborhoods] = await connection.execute(
        "SELECT * FROM neighborhood WHERE cityId = ? AND (name = ? OR slug = ?)",
        [cityId, name, slug]
      );

      if (
        Array.isArray(existingNeighborhoods) &&
        existingNeighborhoods.length > 0
      ) {
        throw new Error(
          "A neighborhood with this name already exists in this city"
        );
      }

      // Create new neighborhood
      await connection.execute(
        "INSERT INTO neighborhood (id, name, slug, cityId, countyId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
        [id, name, slug, cityId, countyId]
      );

      // Fetch created neighborhood with related data
      const [neighborhoods] = await connection.execute(
        `
        SELECT 
          n.*,
          JSON_OBJECT(
            'id', c.id,
            'name', c.name
          ) as city,
          JSON_OBJECT(
            'id', co.id,
            'name', co.name
          ) as county
        FROM neighborhood n
        LEFT JOIN city c ON n.cityId = c.id
        LEFT JOIN county co ON n.countyId = co.id
        WHERE n.id = ?
      `,
        [id]
      );

      await connection.commit();

      if (!Array.isArray(neighborhoods) || neighborhoods.length === 0) {
        throw new Error("Failed to create neighborhood");
      }

      const neighborhood = neighborhoods[0] as Neighborhood & {
        city: string;
        county: string;
      };
      console.log("Created neighborhood:", neighborhood);

      return NextResponse.json({
        ...neighborhood,
        type: 'neighborhood' as const,
        city: JSON.parse(neighborhood.city as string),
        county: JSON.parse(neighborhood.county as string),
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(
      "Error in neighborhoods POST:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create neighborhood",
      },
      { status: 500 }
    );
  }
}
