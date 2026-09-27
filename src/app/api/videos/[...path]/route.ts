import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VIDEO_SERVICE_URL = process.env.VIDEO_SERVICE_URL || 'http://localhost:3002';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const videoPath = path.join('/');

        // Get range header for streaming support
        const rangeHeader = request.headers.get('range');

        const headers: HeadersInit = {};
        if (rangeHeader) {
            headers['Range'] = rangeHeader;
        }

        // Proxy request to video service
        const serviceResponse = await fetch(`${VIDEO_SERVICE_URL}/videos/${videoPath}`, {
            headers,
        });

        if (!serviceResponse.ok && serviceResponse.status !== 206) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: serviceResponse.status }
            );
        }

        // Get response headers
        const contentType = serviceResponse.headers.get('content-type') || 'video/mp4';
        const contentLength = serviceResponse.headers.get('content-length');
        const contentRange = serviceResponse.headers.get('content-range');
        const acceptRanges = serviceResponse.headers.get('accept-ranges');

        // Create response with streaming support
        const responseHeaders: HeadersInit = {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
        };

        if (contentLength) {
            responseHeaders['Content-Length'] = contentLength;
        }
        if (contentRange) {
            responseHeaders['Content-Range'] = contentRange;
        }
        if (acceptRanges) {
            responseHeaders['Accept-Ranges'] = acceptRanges;
        }

        // Stream the video response
        return new NextResponse(serviceResponse.body, {
            status: serviceResponse.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('[Video Serve] Error:', error);
        return NextResponse.json(
            { error: 'Failed to serve video' },
            { status: 500 }
        );
    }
}
