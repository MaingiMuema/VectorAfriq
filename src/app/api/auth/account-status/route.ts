import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Lightweight public check used by the sign-in form.
 * Returns whether the given email belongs to a deactivated account.
 * Does not reveal whether an email is registered when the account is active.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ deactivated: false });
    }

    const [user] = await query<{ isActive: number | boolean }>(
      "SELECT isActive FROM `user` WHERE email = ?",
      [email]
    );

    if (!user) {
      return NextResponse.json({ deactivated: false });
    }

    const active =
      user.isActive === undefined || user.isActive === null
        ? true
        : Boolean(user.isActive);

    return NextResponse.json({ deactivated: !active });
  } catch (error) {
    console.error("[ACCOUNT_STATUS]", error);
    return NextResponse.json({ deactivated: false });
  }
}
