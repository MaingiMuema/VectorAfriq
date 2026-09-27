import { NextResponse } from "next/server";
import { query, DatabaseValue } from "@/lib/db";

interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  active: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: Request) {
  try {
    console.log('Banner API: Starting request');
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    console.log('Banner API: Active filter:', active);

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (active === "true") {
      whereClause += " AND active = TRUE";
    } else if (active === "false") {
      whereClause += " AND active = FALSE";
    }

    console.log('Banner API: Executing query with whereClause:', whereClause);
    const banners = await query<Banner>(
      `SELECT * FROM banner ${whereClause} ORDER BY createdAt DESC`,
      params
    );

    console.log(`Banner API: Successfully returning ${banners.length} banners`);
    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Banner API: Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error: error
    });

    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}