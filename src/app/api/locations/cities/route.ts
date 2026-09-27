import { NextResponse } from "next/server";
import { query, DatabaseValue } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

interface City {
  id: string;
  name: string;
  slug: string;
  countyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countyId = searchParams.get("countyId");

    let whereClause = "";
    const params: DatabaseValue[] = [];

    if (countyId) {
      whereClause = "WHERE c.countyId = ?";
      params.push(countyId);
    }

    const cities = await query<
      City & {
        county: string;
        neighborhoods: string | null;
        neighborhood_count: number;
      }
    >(
      `
      SELECT 
        c.*,
        JSON_OBJECT(
          'id', co.id,
          'name', co.name
        ) as county,
        GROUP_CONCAT(
          DISTINCT 
          IF(
            n.id IS NOT NULL,
            JSON_OBJECT('id', n.id, 'name', n.name),
            NULL
          )
        ) as neighborhoods,
        COUNT(DISTINCT n.id) as neighborhood_count
      FROM city c
      LEFT JOIN county co ON c.countyId = co.id
      LEFT JOIN neighborhood n ON c.id = n.cityId
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.name ASC
    `,
      params
    );

    // Format the response
    const formattedCities = cities.map((city) => ({
      ...city,
      type: 'city' as const,
      county: JSON.parse(city.county as string),
      neighborhoods: city.neighborhoods
        ? JSON.parse(
            `[${city.neighborhoods.split(",").filter(Boolean).join(",")}]`
          )
        : [],
      _count: {
        neighborhoods: Number(city.neighborhood_count),
      },
    }));

    return NextResponse.json(formattedCities);
  } catch (error) {
    console.error(
      "Error in cities GET:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, countyId } = body;

    if (!name || !countyId) {
      return new NextResponse(
        JSON.stringify({ error: "Name and county are required" }),
        { status: 400 }
      );
    }

    const slug = name.toLowerCase().replace(/ /g, "-");
    const id = uuidv4().replace(/-/g, ""); // Remove hyphens to ensure correct length

    console.log("Attempting to create city:", { id, name, slug, countyId });

    // Begin transaction
    const connection = await (await import("@/lib/db")).pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if county exists
      const [counties] = await connection.execute(
        "SELECT * FROM county WHERE id = ?",
        [countyId]
      );

      if (!Array.isArray(counties) || counties.length === 0) {
        throw new Error("County not found");
      }

      // Check for existing city with same name in the county
      const [existingCities] = await connection.execute(
        "SELECT * FROM city WHERE countyId = ? AND (name = ? OR slug = ?)",
        [countyId, name, slug]
      );

      if (Array.isArray(existingCities) && existingCities.length > 0) {
        throw new Error("A city with this name already exists in this county");
      }

      // Create new city
      await connection.execute(
        "INSERT INTO city (id, name, slug, countyId, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
        [id, name, slug, countyId]
      );

      // Fetch created city with county data
      const [cities] = await connection.execute(
        `
        SELECT 
          c.*,
          JSON_OBJECT(
            'id', co.id,
            'name', co.name
          ) as county
        FROM city c
        LEFT JOIN county co ON c.countyId = co.id
        WHERE c.id = ?
      `,
        [id]
      );

      await connection.commit();

      if (!Array.isArray(cities) || cities.length === 0) {
        throw new Error("Failed to create city");
      }

      const city = cities[0] as City & { county: string };
      console.log("Created city:", city);

      return NextResponse.json({
        ...city,
        type: 'city' as const,
        county: JSON.parse(city.county as string),
        neighborhoods: [],
        _count: {
          neighborhoods: 0,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(
      "Error in cities POST:",
      error instanceof Error ? error.message : "Unknown error",
      error
    );
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to create city",
      }),
      { status: 500 }
    );
  }
}
