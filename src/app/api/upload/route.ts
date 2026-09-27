import { Client } from "basic-ftp";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Readable } from "stream";

// FTP connection details
const FTP_CONFIG = {
  host: process.env.FTP_HOST || "ftp.vectorafriqproperties.co.ke",
  user: process.env.FTP_USER || "Properties@uat.com.vectorafriqproperties.co.ke",
  // Credentials must come from env — never hardcode (see ENV_SETUP.md)
  password: process.env.FTP_PASSWORD || "",
  port: Number(process.env.FTP_PORT) || 21,
  secure: process.env.FTP_SECURE === "true" || false, // Using explicit FTPS
};

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the form data
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const propertyId = formData.get("propertyId") as string;

    if (!files?.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Create FTP client
    const client = new Client();
    await client.access(FTP_CONFIG);

    try {
      // Create property directory
      const directoryPath = `/properties/${propertyId}`;
      await client.ensureDir(directoryPath);

      // Upload all files
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `${directoryPath}/${fileName}`;

          // Create a readable stream from the buffer
          const stream = new Readable({
            read() {
              this.push(buffer);
              this.push(null);
            },
          });

          // Upload using the stream
          await client.uploadFrom(stream, filePath);

          // Return the public URL
          return `https://uat.com.vectorafriqproperties.co.ke${filePath}`;
        })
      );

      return NextResponse.json({ urls: uploadedUrls });
    } finally {
      client.close();
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "No file path provided" },
        { status: 400 }
      );
    }

    // Create FTP client
    const client = new Client();
    await client.access(FTP_CONFIG);

    try {
      await client.remove(filePath);
      return NextResponse.json({ success: true });
    } finally {
      client.close();
    }
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
