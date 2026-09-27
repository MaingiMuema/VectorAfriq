import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// This endpoint is for development/testing purposes only
// In production, admin users should be created through a secure process
export async function POST(request: Request) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: "This endpoint is not available in production" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await query(
      "SELECT * FROM `user` WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate UUID for user
    const id = uuidv4().replace(/-/g, "");

    // Create admin user
    await query(
      `INSERT INTO user (id, name, email, password, role, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'ADMIN', NOW(), NOW())`,
      [id, name, email, hashedPassword]
    );

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: {
        id,
        name,
        email,
        role: "ADMIN"
      }
    });

  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}
