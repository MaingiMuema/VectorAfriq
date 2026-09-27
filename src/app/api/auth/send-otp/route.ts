import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { generateOtp, cleanupExpiredOtps } from "@/lib/otp";
import { emailService } from "@/lib/email";

interface User {
  id: string;
  email: string;
  role: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Verify user credentials first
    const [user] = await query<User>(
      "SELECT id, email, role, password FROM `user` WHERE email = ?",
      [email]
    );

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Disable OTP for all users including ADMIN
    return NextResponse.json(
      { error: "OTP not required for this user" },
      { status: 400 }
    );

    // Clean up expired OTPs
    await cleanupExpiredOtps();

    // Generate 6-digit OTP
    const otpCode = generateOtp();
    const otpId = uuidv4();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await query(
      "INSERT INTO `otp` (id, userId, code, type, expires, used, createdAt) VALUES (?, ?, ?, 'LOGIN', ?, false, NOW())",
      [otpId, user.id, otpCode, expires]
    );

    // Send OTP via email
    await emailService.sendOtpEmail(email, otpCode);

    return NextResponse.json({
      message: "OTP sent successfully",
      userId: user.id
    });

  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}