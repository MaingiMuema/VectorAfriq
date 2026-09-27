import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://localhost:3001';

function isFile(value: FormDataEntryValue): value is File {
  return value instanceof Blob && "name" in value;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const filesEntries = formData.getAll("files");
    const propertyId = formData.get("propertyId") as string;

    if (!filesEntries?.length || !propertyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validFiles = filesEntries.filter((entry): entry is File =>
      isFile(entry) && entry.size > 0
    );

    if (validFiles.length === 0) {
      return NextResponse.json({ error: "No valid files received" }, { status: 400 });
    }

    const serviceFormData = new FormData();
    serviceFormData.append('propertyId', propertyId);
    validFiles.forEach(file => serviceFormData.append('files', file));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    try {
      console.log(`[Proxy] Uploading to: ${IMAGE_SERVICE_URL}/upload`);
      const serviceResponse = await fetch(`${IMAGE_SERVICE_URL}/upload`, {
        method: 'POST',
        body: serviceFormData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = serviceResponse.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await serviceResponse.text();
        console.error(`[Proxy] Invalid content type: ${contentType}, response: ${text}`);
        throw new Error(`Image service error (${serviceResponse.status}): ${text.substring(0, 100)}`);
      }

      const result = await serviceResponse.json();
      if (!serviceResponse.ok) {
        console.error(`[Proxy] Service error:`, result);
        throw new Error(result.error || 'Upload failed');
      }

      return NextResponse.json(result);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error(`[Proxy] Fetch error:`, fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error(`[Proxy] Global error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");
    const propertyId = searchParams.get("propertyId");

    if (!filePath || !propertyId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // For now, return success as image deletion can be handled manually
    // In production, you might want to implement a delete endpoint in the image service
    console.log('Image deletion requested:', { filePath, propertyId });

    return NextResponse.json({
      success: true,
      message: "File deletion logged - manual cleanup may be required",
    });
  } catch (error) {
    console.error("Error in delete process:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete file",
      },
      {
        status: 500,
      }
    );
  }
}
