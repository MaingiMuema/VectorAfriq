import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

interface County {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET() {
  try {
    const counties = await query<
      County & {
        cities: string | null;
        neighborhoods: string | null;
        city_count: number;
        neighborhood_count: number;
      }
    >(`
      SELECT 
        c.*,
        GROUP_CONCAT(
          DISTINCT 
          IF(
            ci.id IS NOT NULL,
            JSON_OBJECT('id', ci.id, 'name', ci.name),
            NULL
          )
        ) as cities,
        GROUP_CONCAT(
          DISTINCT
          IF(
            n.id IS NOT NULL,
            JSON_OBJECT('id', n.id, 'name', n.name),
            NULL
          )
        ) as neighborhoods,
        COUNT(DISTINCT ci.id) as city_count,
        COUNT(DISTINCT n.id) as neighborhood_count
      FROM county c
      LEFT JOIN city ci ON c.id = ci.countyId
      LEFT JOIN neighborhood n ON c.id = n.countyId
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    // Format the response
    const formattedCounties = counties.map((county) => ({
      ...county,
      type: 'county' as const,
      cities: county.cities
        ? JSON.parse(`[${county.cities.split(",").filter(Boolean).join(",")}]`)
        : [],
      neighborhoods: county.neighborhoods
        ? JSON.parse(
            `[${county.neighborhoods.split(",").filter(Boolean).join(",")}]`
          )
        : [],
      _count: {
        cities: Number(county.city_count),
        neighborhoods: Number(county.neighborhood_count),
      },
    }));

    return NextResponse.json(formattedCounties);
  } catch (error) {
    console.error(
      "Error in counties GET:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to fetch counties" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const id = uuidv4().replace(/-/g, ""); // Remove hyphens to ensure correct length

    console.log("Attempting to create county:", { id, name, slug });

    // Check for existing county
    const existingCounties = await query<County>(
      "SELECT * FROM county WHERE name = ? OR slug = ?",
      [name, slug]
    );

    if (existingCounties.length > 0) {
      return NextResponse.json(
        { error: "A county with this name already exists" },
        { status: 400 }
      );
    }

    // Begin transaction
    const connection = await (await import("@/lib/db")).pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert new county
      await connection.execute(
        "INSERT INTO county (id, name, slug, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())",
        [id, name, slug]
      );

      // Fetch the newly created county
      const [newCounties] = await connection.execute(
        "SELECT * FROM county WHERE id = ?",
        [id]
      );

      await connection.commit();

      if (!Array.isArray(newCounties) || newCounties.length === 0) {
        throw new Error(
          "Failed to create county: County not found after insertion"
        );
      }

      const county = newCounties[0] as County;
      console.log("Created county:", county);

      // Return formatted response
      const response = {
        ...county,
        type: 'county' as const,
        cities: [],
        neighborhoods: [],
        _count: {
          cities: 0,
          neighborhoods: 0,
        },
      };

      return NextResponse.json(response);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in counties POST:", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create county",
      },
      { status: 500 }
    );
  }
}
