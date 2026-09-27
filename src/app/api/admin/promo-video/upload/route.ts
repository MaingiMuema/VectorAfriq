import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const IMAGE_SERVICE_URL =
  process.env.IMAGE_SERVICE_URL ||
  process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL ||
  "http://localhost:3001";

const MAX_ASSET_BYTES = 15 * 1024 * 1024;

/**
 * POST /api/admin/promo-video/upload
 * Multipart form: file — an image asset the admin wants used inside the video.
 * Proxies to the shared image service (propertyId: "promo-videos") and returns
 * both a browser-serveable path and a server-side URL for the render worker.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_ASSET_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 15MB)" },
        { status: 400 }
      );
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are supported" }, { status: 400 });
    }

    const uploadFormData = new FormData();
    uploadFormData.append("propertyId", "promo-videos");
    uploadFormData.append("files", file);

    const response = await fetch(`${IMAGE_SERVICE_URL}/upload`, {
      method: "POST",
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error(`Image service upload failed (${response.status})`);
    }

    const result = await response.json();
    const uploadedFile = result.files?.[0];
    if (!uploadedFile) {
      throw new Error("No file returned from image service");
    }

    const filename = uploadedFile.filename as string;
    return NextResponse.json({
      success: true,
      path: `/api/images/serve/promo-videos/${filename}`,
      serviceUrl: `${IMAGE_SERVICE_URL}/images/promo-videos/${filename}`,
      filename,
    });
  } catch (error) {
    console.error("[PromoVideo API] Upload failed:", error);
    return NextResponse.json(
      {
        error: "Failed to upload asset",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
