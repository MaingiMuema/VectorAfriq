import { NextResponse } from "next/server";
import { promises as fs } from "fs";

const PLACEHOLDER_PATH = process.cwd() + "/public/images/placeholder.png";
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://localhost:3001';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Extract path from URL
    const url = new URL(request.url);
    const requestPath = url.pathname.split("/api/images/")[1];

    // Parse the path to extract propertyId and filename
    const pathParts = requestPath.split('/');
    if (pathParts.length < 2) {
      throw new Error('Invalid image path format');
    }

    const propertyId = pathParts[0];
    const filename = pathParts.slice(1).join('/');

    console.log('[Next.js Proxy] ===== IMAGE REQUEST =====');
    console.log('[Next.js Proxy] Request path:', requestPath);
    console.log('[Next.js Proxy] Property ID:', propertyId);
    console.log('[Next.js Proxy] Filename:', filename);
    console.log('[Next.js Proxy] Path parts:', pathParts);

    // Proxy request to image service
    const serviceUrl = `${IMAGE_SERVICE_URL}/images/${requestPath}`;
    console.log('[Next.js Proxy] Service URL:', serviceUrl);
    const serviceResponse = await fetch(serviceUrl);
    console.log('[Next.js Proxy] Service response status:', serviceResponse.status);

    if (!serviceResponse.ok) {
      throw new Error(`Image service responded with ${serviceResponse.status}`);
    }

    const buffer = await serviceResponse.arrayBuffer();
    const contentType = serviceResponse.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to serve image:', error);

    // Return placeholder image
    try {
      const placeholder = await fs.readFile(PLACEHOLDER_PATH);
      return new NextResponse(placeholder, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch {
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to fetch image',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
}
