import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Target size in bytes (500KB)
const TARGET_SIZE = 500 * 1024;

// Quality steps for progressive compression
const QUALITY_STEPS = [85, 75, 65, 55, 45, 35, 25];

// Width steps for size reduction
const WIDTH_STEPS = [1920, 1600, 1280, 1024, 800];

interface CompressionResult {
    success: boolean;
    originalSize: number;
    compressedSize: number;
    savedBytes: number;
    compressionRatio: number;
    base64?: string;
    error?: string;
}

function isFile(value: FormDataEntryValue): value is File {
    return value instanceof Blob && "name" in value;
}

/**
 * Compress image buffer to target size using progressive quality and width reduction
 */
async function compressToTarget(
    buffer: Buffer,
    targetSize: number = TARGET_SIZE
): Promise<Buffer> {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 1920;

    // If already under target, just optimize
    if (buffer.length <= targetSize) {
        return sharp(buffer)
            .jpeg({ quality: 90, mozjpeg: true })
            .toBuffer();
    }

    // Try different combinations of quality and width
    for (const maxWidth of WIDTH_STEPS) {
        // Skip if original is smaller than this width step
        if (originalWidth < maxWidth && maxWidth !== WIDTH_STEPS[WIDTH_STEPS.length - 1]) {
            continue;
        }

        for (const quality of QUALITY_STEPS) {
            const resizeWidth = Math.min(maxWidth, originalWidth);

            const compressed = await sharp(buffer)
                .resize({ width: resizeWidth, withoutEnlargement: true })
                .jpeg({ quality, mozjpeg: true })
                .toBuffer();

            if (compressed.length <= targetSize) {
                console.log(
                    `[ImageCompress] Compressed: ${(buffer.length / 1024).toFixed(1)}KB → ${(compressed.length / 1024).toFixed(1)}KB (quality: ${quality}, width: ${resizeWidth})`
                );
                return compressed;
            }
        }
    }

    // Best effort: use lowest quality and smallest width
    const bestEffort = await sharp(buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 20, mozjpeg: true })
        .toBuffer();

    console.log(
        `[ImageCompress] Best effort: ${(buffer.length / 1024).toFixed(1)}KB → ${(bestEffort.length / 1024).toFixed(1)}KB`
    );

    return bestEffort;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const fileEntry = formData.get("file");
        const targetSizeParam = formData.get("targetSize");

        if (!fileEntry || !isFile(fileEntry)) {
            return NextResponse.json(
                { error: "No valid file provided" },
                { status: 400 }
            );
        }

        const file = fileEntry as File;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "File must be an image" },
                { status: 400 }
            );
        }

        // Validate file size (max 1MB input)
        if (file.size > 1024 * 1024) {
            return NextResponse.json(
                { error: "Image must be 1MB or smaller" },
                { status: 400 }
            );
        }

        const targetSize = targetSizeParam
            ? parseInt(targetSizeParam as string, 10)
            : TARGET_SIZE;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Compress the image
        const compressedBuffer = await compressToTarget(buffer, targetSize);

        // Create result object
        const result: CompressionResult = {
            success: true,
            originalSize: buffer.length,
            compressedSize: compressedBuffer.length,
            savedBytes: buffer.length - compressedBuffer.length,
            compressionRatio: Math.round((1 - compressedBuffer.length / buffer.length) * 100),
            base64: compressedBuffer.toString("base64"),
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error("[ImageCompress] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Compression failed",
            },
            { status: 500 }
        );
    }
}

/**
 * Batch compression endpoint
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const fileEntries = formData.getAll("files");
        const targetSizeParam = formData.get("targetSize");

        const validFiles = fileEntries.filter(
            (entry): entry is File => isFile(entry) && entry.type.startsWith("image/") && entry.size > 0
        );

        if (validFiles.length === 0) {
            return NextResponse.json(
                { error: "No valid image files provided" },
                { status: 400 }
            );
        }

        const targetSize = targetSizeParam
            ? parseInt(targetSizeParam as string, 10)
            : TARGET_SIZE;

        const results: CompressionResult[] = [];
        let totalOriginal = 0;
        let totalCompressed = 0;

        for (const file of validFiles) {
            // Skip files over 1MB
            if (file.size > 1024 * 1024) {
                results.push({
                    success: false,
                    originalSize: file.size,
                    compressedSize: 0,
                    savedBytes: 0,
                    compressionRatio: 0,
                    error: "File exceeds 1MB limit",
                });
                continue;
            }

            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const compressedBuffer = await compressToTarget(buffer, targetSize);

                totalOriginal += buffer.length;
                totalCompressed += compressedBuffer.length;

                results.push({
                    success: true,
                    originalSize: buffer.length,
                    compressedSize: compressedBuffer.length,
                    savedBytes: buffer.length - compressedBuffer.length,
                    compressionRatio: Math.round((1 - compressedBuffer.length / buffer.length) * 100),
                    base64: compressedBuffer.toString("base64"),
                });
            } catch (error) {
                results.push({
                    success: false,
                    originalSize: file.size,
                    compressedSize: 0,
                    savedBytes: 0,
                    compressionRatio: 0,
                    error: error instanceof Error ? error.message : "Compression failed",
                });
            }
        }

        return NextResponse.json({
            success: true,
            totalFiles: validFiles.length,
            successfulCompressions: results.filter((r) => r.success).length,
            totalOriginalSize: totalOriginal,
            totalCompressedSize: totalCompressed,
            totalSavedBytes: totalOriginal - totalCompressed,
            averageCompressionRatio: totalOriginal > 0
                ? Math.round((1 - totalCompressed / totalOriginal) * 100)
                : 0,
            results,
        });
    } catch (error) {
        console.error("[ImageCompress] Batch error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Batch compression failed",
            },
            { status: 500 }
        );
    }
}
