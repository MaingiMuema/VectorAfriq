import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatar: string | null;
  specialization: string | null;
  languages: string | null;
  socialMedia: string | null;
  role: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await query<UserProfile>(
      `SELECT id, name, email, phone, bio, avatar, specialization, languages, socialMedia, role 
       FROM user WHERE email = ?`,
      [session.user.email]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse JSON fields with fallbacks
    const formattedUser = {
      ...user,
      specialization: user.specialization
        ? JSON.parse(user.specialization)
        : [],
      languages: user.languages ? JSON.parse(user.languages) : [],
      socialMedia: user.socialMedia ? JSON.parse(user.socialMedia) : {},
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { name, phone, bio, avatar, specialization, languages, socialMedia } =
      data;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Update user profile with proper MySQL escaping
    const updateQuery = `
      UPDATE user 
      SET 
        name = ?,
        phone = ?,
        bio = ?,
        avatar = ?,
        specialization = ?,
        languages = ?,
        socialMedia = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE email = ?
    `;

    await query(updateQuery, [
      name,
      phone || null,
      bio || null,
      avatar || null,
      specialization ? JSON.stringify(specialization) : null,
      languages ? JSON.stringify(languages) : null,
      socialMedia ? JSON.stringify(socialMedia) : null,
      session.user.email,
    ]);

    // Fetch updated user profile
    const [updatedUser] = await query<UserProfile>(
      `SELECT id, name, email, phone, bio, avatar, specialization, languages, socialMedia, role 
       FROM user WHERE email = ?`,
      [session.user.email]
    );

    // Format response
    const formattedUser = {
      ...updatedUser,
      specialization: updatedUser.specialization
        ? JSON.parse(updatedUser.specialization)
        : [],
      languages: updatedUser.languages ? JSON.parse(updatedUser.languages) : [],
      socialMedia: updatedUser.socialMedia
        ? JSON.parse(updatedUser.socialMedia)
        : {},
    };

    return NextResponse.json({
      success: true,
      user: formattedUser,
    });
  } catch (error) {
    console.error("[PROFILE_PATCH]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
