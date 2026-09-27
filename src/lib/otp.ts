import { query } from "./db";

export async function cleanupExpiredOtps() {
  try {
    await query("DELETE FROM `otp` WHERE expires < NOW() OR used = true");
  } catch (error) {
    console.error("Failed to cleanup expired OTPs:", error);
  }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}