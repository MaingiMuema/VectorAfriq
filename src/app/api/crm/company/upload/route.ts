import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

const IMAGE_SERVICE_URL = process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await query<{ id: string }>(
      "SELECT id FROM user WHERE email = ?",
      [session.user.email]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("files") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const uploadFormData = new FormData();
    uploadFormData.append('propertyId', 'companies');
    uploadFormData.append('files', file);

    const response = await fetch(`${IMAGE_SERVICE_URL}/upload`, {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error('Image service upload failed');
    }

    const result = await response.json();
    const uploadedFile = result.files?.[0];

    if (!uploadedFile) {
      throw new Error('No file returned from image service');
    }

    const apiPath = `/api/images/serve/companies/${uploadedFile.filename}`;

    const [company] = await query<{ id: string }>(
      "SELECT id FROM company WHERE userId = ?",
      [user.id]
    );

    if (company) {
      await query(
        "UPDATE company SET logo = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [apiPath, company.id]
      );
    }

    // Check if user avatar is missing and sync the company logo as user avatar
    const [currentUser] = await query<{ avatar: string | null }>(
      "SELECT avatar FROM user WHERE id = ?",
      [user.id]
    );

    if (currentUser && (!currentUser.avatar || currentUser.avatar === '/images/placeholder.png')) {
      await query(
        "UPDATE user SET avatar = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [apiPath, user.id]
      );
    }

    return NextResponse.json({
      success: true,
      urls: [apiPath],
      filesUploaded: 1,
      message: "Company logo uploaded successfully",
    });
  } catch (error) {
    console.error("[COMPANY_LOGO_UPLOAD]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload company logo",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
