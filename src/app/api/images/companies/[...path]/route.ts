import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    const rawPath = url.pathname.split("/api/images/companies/")[1];
    const decodedPath = decodeURIComponent(rawPath);
    const pathSegments = decodedPath.split("/").map((segment) => {
      const decoded = decodeURIComponent(segment);
      return decoded.replace(/[<>:"\\|?*]/g, "");
    });
    const filePath = pathSegments.join("/");

    // Initialize FTP client
    client = new Client(1200000);
    client.ftp.verbose = process.env.NODE_ENV === "development";
    await client.access(FTP_CONFIG);
    console.log("Connected to FTP server");

    // Navigate to root first
    await client.cd("/");
    console.log("Changed to root directory");

    // Create buffer for file data
    const chunks: Buffer[] = [];
    const writableStream = new Writable({
      write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        chunks.push(chunk);
        callback();
      },
    });

    // Navigate to companies directory
    await client.cd("companies");
    console.log("Changed to companies directory");

    // Process file path
    const segments = filePath.split("/");
    // Remove 'companies' prefix if present since we're already in that directory
    if (segments[0] === "companies") {
      segments.shift();
    }
    const fileName = segments.pop() || "";
    const dirPath = segments.join("/");

    if (dirPath) {
      await client.cd(dirPath);
      console.log("Changed to company directory:", dirPath);
    }

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
    console.error("[COMPANY_LOGO_GET]", error);
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
