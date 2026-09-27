import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes for video uploads

const VIDEO_SERVICE_URL = process.env.VIDEO_SERVICE_URL || 'http://localhost:3002';

function isFile(value: FormDataEntryValue): value is File {
    return value instanceof Blob && "name" in value;
}

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const contentType = request.headers.get("content-type") || "";
    const propertyId = request.headers.get("x-property-id") || searchParams.get("propertyId");
    const filename = request.headers.get("x-file-name") || searchParams.get("filename") || "video.mp4";
    const metadataStr = request.headers.get("x-video-metadata");

    console.log("[Video Upload API] POST request received", {
        contentType,
        propertyId,
        filename,
        contentLength: request.headers.get("content-length"),
        hasXPropertyId: !!request.headers.get("x-property-id"),
        hasSearchParamsPropertyId: !!searchParams.get("propertyId")
    });

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // We'll reconstruct a FormData to send to our internal video service
        // since the video service expects 'multer' style uploads.
        const serviceFormData = new FormData();

        if (propertyId) {
            // New streaming approach
            const bodyBlob = await request.blob();
            const file = new File([bodyBlob], filename, { type: contentType });

            serviceFormData.append('propertyId', propertyId);
            serviceFormData.append('file', file);
            if (metadataStr) {
                serviceFormData.append('metadata', metadataStr);
            }
        } else {
            // Fallback to legacy FormData approach if headers aren't present
            if (!contentType.includes("multipart/form-data")) {
                return NextResponse.json({ error: "Invalid Content-Type or missing x-property-id header" }, { status: 400 });
            }

            const formData = await request.formData();
            const fileEntry = formData.get("file");
            const propId = formData.get("propertyId") as string;
            const meta = formData.get("metadata") as string;

            if (!fileEntry || !propId || !isFile(fileEntry)) {
                return NextResponse.json({ error: "Missing required fields in form data" }, { status: 400 });
            }

            serviceFormData.append('propertyId', propId);
            serviceFormData.append('file', fileEntry);
            if (meta) {
                serviceFormData.append('metadata', meta);
            }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 110000);

        try {
            const serviceResponse = await fetch(`${VIDEO_SERVICE_URL}/upload`, {
                method: 'POST',
                body: serviceFormData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const responseData = await serviceResponse.json();
            return NextResponse.json(responseData, { status: serviceResponse.status });
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
        }
    } catch (error) {
        console.error("[Video Upload API] Global error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Upload failed"
        }, { status: 500 });
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

        // Forward delete request to video service
        try {
            const serviceResponse = await fetch(
                `${VIDEO_SERVICE_URL}/delete?propertyId=${encodeURIComponent(propertyId)}&path=${encodeURIComponent(filePath)}`,
                { method: 'DELETE' }
            );

            const result = await serviceResponse.json();
            return NextResponse.json(result);
        } catch {
            console.log('Video deletion requested (service unavailable):', { filePath, propertyId });
            return NextResponse.json({
                success: true,
                message: "Video deletion logged - manual cleanup may be required",
            });
        }
    } catch (error) {
        console.error("Error in video delete process:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to delete video",
            },
            { status: 500 }
        );
    }
}
