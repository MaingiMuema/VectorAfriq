import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { getDefaultListingQuota } from "@/lib/rateCards";
import { v4 as uuidv4 } from "uuid";
import { RowDataPacket } from "mysql2";

interface User extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "USER" | "ADMIN" | "AGENT";
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

function handleDatabaseError(error: unknown): never {
  console.error("Database operation failed:", error);

  if (error instanceof Error) {
    const dbError = error as DatabaseError;

    // Handle specific MySQL errors
    switch (dbError.code) {
      case "ER_DUP_ENTRY":
        throw new Error("A user with this email already exists");
      case "ER_NO_REFERENCED_ROW":
        throw new Error("Invalid reference in database");
      case "ER_DATA_TOO_LONG":
        throw new Error("Data too long for one or more fields");
      default:
        if (dbError.sqlMessage) {
          throw new Error(`Database error: ${dbError.sqlMessage}`);
        }
        throw error;
    }
  }

  throw new Error("An unexpected error occurred");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || typeof name !== "string" || name.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUsers = await query<User>(
      "SELECT * FROM `user` WHERE email = ?",
      [email]
    ).catch(handleDatabaseError);

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      // If user exists but has no password (e.g. created via Google), allow adding password
      if (!user.password) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const connection = await (await import("@/lib/db")).pool.getConnection();
        try {
          await connection.execute(
            "UPDATE `user` SET password = ?, name = ?, updatedAt = NOW() WHERE id = ?",
            [hashedPassword, name, user.id]
          );

          return NextResponse.json({
            user: {
              id: user.id,
              name: name,
              email: user.email,
              role: user.role,
            },
          });
        } finally {
          connection.release();
        }
      }

      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate UUID for user
    const id = uuidv4().replace(/-/g, "");
    const listingQuota = await getDefaultListingQuota();

    // Create user using transaction
    const connection = await (await import("@/lib/db")).pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert user
      await connection
        .execute(
          `INSERT INTO user (id, name, email, password, role, listingQuota, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'USER', ?, NOW(), NOW())`,
          [id, name, email, hashedPassword, listingQuota]
        )
        .catch(handleDatabaseError);

      // Fetch the created user
      const [rows] = await connection
        .execute<User[]>(
          "SELECT id, name, email, role, createdAt, updatedAt FROM user WHERE id = ?",
          [id]
        )
        .catch(handleDatabaseError);

      await connection.commit();

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("Failed to create user");
      }

      const user = rows[0];
      console.log("User created successfully:", {
        id: user.id,
        email: user.email,
      });

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Registration error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to register user";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
