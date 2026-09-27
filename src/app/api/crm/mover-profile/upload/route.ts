import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const IMAGE_SERVICE_URL =
  process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL ||
  process.env.IMAGE_SERVICE_URL ||
  "http://localhost:3001";

const allowedKinds = new Set([
  "vehicle",
  "licence-front",
  "licence-back",
  "id-front",
  "id-back",
]);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("files") as File | null;
    const kind = String(formData.get("kind") || "vehicle");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!allowedKinds.has(kind)) {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are supported" },
        { status: 400 }
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.append("propertyId", `movers/${session.user.id}/${kind}`);
    uploadFormData.append("files", file);

    const response = await fetch(`${IMAGE_SERVICE_URL}/upload`, {
      method: "POST",
      body: uploadFormData,
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Image service upload failed");
    }

    const uploadedFile = result.files?.[0];
    if (!uploadedFile) {
      throw new Error("No file returned from image service");
    }

    const path = `/api/images/serve/movers/${session.user.id}/${kind}/${uploadedFile.filename}`;

    return NextResponse.json({
      success: true,
      urls: [path],
      filesUploaded: 1,
      message: "Mover document uploaded successfully",
    });
  } catch (error) {
    console.error("[MOVER_PROFILE_UPLOAD]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload mover document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
