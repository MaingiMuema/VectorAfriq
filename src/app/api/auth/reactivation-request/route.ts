import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { sendReactivationAppealEmail } from "@/lib/reactivationEmail";

interface DbUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: number | boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const message =
      typeof body.message === "string" ? body.message.trim() : "";
    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message must be 2000 characters or fewer" },
        { status: 400 }
      );
    }

    const [user] = await query<DbUser>(
      "SELECT id, name, email, role, isActive FROM `user` WHERE email = ?",
      [email]
    );

    if (!user) {
      // Do not reveal whether the account exists
      return NextResponse.json({
        success: true,
        message:
          "If this account is deactivated, your appeal has been submitted to our support team.",
      });
    }

    if (user.isActive) {
      return NextResponse.json(
        {
          error:
            "This account is already active. You can sign in normally.",
        },
        { status: 400 }
      );
    }

    // Rate-limit: one pending appeal per email every 24 hours
    const [recent] = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM account_reactivation_request
       WHERE email = ? AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [email]
    );

    if (recent && Number(recent.count) > 0) {
      return NextResponse.json(
        {
          error:
            "You have already submitted a reactivation appeal in the last 24 hours. Please wait for support to respond.",
        },
        { status: 429 }
      );
    }

    const id = uuidv4();
    const displayName = name || user.name || null;

    await query(
      `INSERT INTO account_reactivation_request
        (id, userId, email, name, message, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
      [id, user.id, email, displayName, message || null]
    );

    const emailed = await sendReactivationAppealEmail({
      userName: displayName,
      userEmail: email,
      userId: user.id,
      message: message || null,
      role: user.role,
    });

    if (!emailed) {
      console.error(
        "[REACTIVATION_REQUEST] Appeal saved but email failed for",
        email
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Your reactivation appeal has been sent to our support team. We will contact you at this email address.",
    });
  } catch (error) {
    console.error("[REACTIVATION_REQUEST]", error);
    return NextResponse.json(
      { error: "Failed to submit reactivation appeal. Please try again." },
      { status: 500 }
    );
  }
}
