import { NextResponse } from "next/server";
import { query } from "@/lib/db";

interface OtpRecord {
  id: string;
  userId: string;
  code: string;
  expires: Date;
  used: boolean;
}

export async function POST(request: Request) {
  try {
    const { userId, otp } = await request.json();

    if (!userId || !otp) {
      return NextResponse.json(
        { error: "User ID and OTP are required" },
        { status: 400 }
      );
    }

    // Find valid OTP
    const [otpRecord] = await query<OtpRecord>(
      "SELECT * FROM `otp` WHERE userId = ? AND code = ? AND used = false AND expires > NOW() ORDER BY createdAt DESC LIMIT 1",
      [userId, otp]
    );

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await query(
      "UPDATE `otp` SET used = true WHERE id = ?",
      [otpRecord.id]
    );

    return NextResponse.json({
      message: "OTP verified successfully",
      verified: true
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}