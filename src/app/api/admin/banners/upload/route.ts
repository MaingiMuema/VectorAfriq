import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const IMAGE_SERVICE_URL = process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL;

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    if (!IMAGE_SERVICE_URL) {
      throw new Error('IMAGE_SERVICE_URL not configured');
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    console.log('Uploading banner:', { name: file.name, size: file.size, serviceUrl: IMAGE_SERVICE_URL });

    const uploadFormData = new FormData();
    uploadFormData.append('propertyId', 'banners');
    uploadFormData.append('files', file);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${IMAGE_SERVICE_URL}/upload`, {
      method: 'POST',
      body: uploadFormData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const result = await response.json();
    console.log('Upload response:', { ok: response.ok, status: response.status, result });
    
    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    if (!result.urls || result.urls.length === 0) {
      throw new Error('No URLs returned from upload service');
    }

    return NextResponse.json({
      path: result.urls[0],
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