import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function POST(request: Request) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Read the SQL file
    const sqlPath = path.join(
      process.cwd(),
      "src",
      "database",
      "alter-county.sql"
    );
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Split into individual statements
    const statements = sqlContent
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    // Get a connection from the pool
    const connection = await pool.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Execute each statement
      for (const statement of statements) {
        try {
          await connection.execute(statement);
        } catch (error) {
          // Log error but continue if it's just because something already exists
          if (error instanceof Error) {
            if (
              error.message.includes("already exists") ||
              error.message.includes("check that column/key exists")
            ) {
              continue;
            }
          }
          throw error;
        }
      }

      // Commit transaction
      await connection.commit();

      return NextResponse.json({
        message: "Database structure updated successfully",
      });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      throw error;
    } finally {
      // Release connection
      connection.release();
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update database structure",
      },
      { status: 500 }
    );
  }
}
