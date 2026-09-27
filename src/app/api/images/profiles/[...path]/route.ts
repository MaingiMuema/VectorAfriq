import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { Client } from "basic-ftp";
import { Writable } from "stream";

const FTP_CONFIG = {
  host: process.env.FTP_HOST || "ftp.vectorafriqproperties.co.ke",
  user: process.env.FTP_USER || "Properties@uat.com.vectorafriqproperties.co.ke",
  password: process.env.FTP_PASSWORD || "",
  port: Number(process.env.FTP_PORT) || 21,
  secure: process.env.FTP_SECURE === "true" || false,
};

const PLACEHOLDER_PATH = join(process.cwd(), "public", "images", "placeholder.png");

export async function GET(request: NextRequest): Promise<NextResponse> {
  let client: Client | null = null;

  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Extract and normalize path from URL
    const url = new URL(request.url);
    let rawPath = url.pathname.split("/api/images/")[1];
    
    // Remove "profiles/" prefix if present as it's already included in the stored path
    if (rawPath.startsWith("profiles/")) {
      rawPath = rawPath.replace("profiles/", "");
    }

    // First decode the entire path to handle any double-encoding
    const decodedPath = decodeURIComponent(rawPath);

    // Split into segments and normalize each one
    const pathSegments = decodedPath.split("/").map((segment) => {
      // Decode again to handle any remaining encoding
      const decoded = decodeURIComponent(segment);
      // Clean up any problematic characters
      return decoded.replace(/[<>:"\\|?*]/g, "");
    });

    // Get user ID from the path (first segment should be user ID)
    const userId = pathSegments[0];

    // Join all segments into full path
    const filePath = pathSegments.join("/");

    // Validate that the requesting user has access to this image
    const [user] = await query<{ id: string }>(
      "SELECT id FROM user WHERE email = ?",
      [session.user.email]
    );

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Allow access if it's their own profile image
    const isOwnImage = userId === user.id;

    // If not their own image, check if they have access to view it
    // For now, we'll allow viewing all profile images
    if (!isOwnImage) {
      // You can add more restrictive checks here if needed
    }

    // Create FTP client
    client = new Client(1200000);
    client.ftp.verbose = process.env.NODE_ENV === "development";
    await client.access(FTP_CONFIG);
    
    console.log("Connected to FTP server");

    // Navigate to root first
    await client.cd("/");
    console.log("Changed to root directory");

    // Split path into directory and filename
    const segments = filePath.split("/");
    const fileName = segments.pop() || "";
    const dirPath = segments.join("/");

    // Navigate through directories
    try {
      // Always start with profiles directory
      await client.cd("profiles");
      console.log("Changed to profiles directory");

      // Then navigate through user directory if it exists
      if (dirPath) {
        // Remove profiles/ prefix if present since we're already in that directory
        const cleanPath = dirPath.replace(/^profiles\//, '');
        await client.cd(cleanPath);
        console.log("Changed to user directory:", cleanPath);
      }
    } catch (error) {
      console.error("Failed to navigate to directory:", error);
      throw new Error("Image not found");
    }

    // Create buffer for file data
    const chunks: Buffer[] = [];
    const writableStream = new Writable({
      write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        chunks.push(chunk);
        callback();
      },
    });

    // List directory contents and find file
    const files = await client.list();
    console.log("Files in directory:", files.map(f => f.name));
    
    const targetFile = files.find(
      (f) =>
        f.name.toLowerCase() === fileName.toLowerCase() ||
        decodeURIComponent(f.name).toLowerCase() === decodeURIComponent(fileName).toLowerCase()
    );

    if (!targetFile) {
      console.error("File not found:", fileName);
      throw new Error("Image not found");
    }

    // Download file
    await client.downloadTo(writableStream, targetFile.name);
    console.log("Downloaded file:", targetFile.name);

    // Process file data
    const fileData = Buffer.concat(chunks);
    const extension = fileName.split(".").pop()?.toLowerCase();
    let contentType = "image/jpeg"; // default

    if (extension === "png") {
      contentType = "image/png";
    } else if (extension === "webp") {
      contentType = "image/webp";
    }

    return new NextResponse(fileData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[PROFILE_IMAGE_GET]", error);

    // Return placeholder image on error
    try {
      const placeholderBuffer = await readFile(PLACEHOLDER_PATH);
      return new NextResponse(placeholderBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (placeholderError) {
      console.error("[PLACEHOLDER_IMAGE_GET]", placeholderError);
      return new NextResponse("Image not found", { status: 404 });
    }
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (error) {
        console.error("Error closing FTP connection:", error);
      }
    }
  }
}
