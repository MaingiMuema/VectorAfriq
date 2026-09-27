import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const IMAGE_SERVICE_URL = process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL || 'http://localhost:3001';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    const uploadFormData = new FormData();
    uploadFormData.append('propertyId', 'banners');
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

    return NextResponse.json({
      path: `/api/images/serve/banners/${uploadedFile.filename}`,
      success: true
    });
  } catch (error) {
    console.error("Banner upload error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}