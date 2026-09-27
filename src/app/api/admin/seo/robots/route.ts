import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// GET - Get robots.txt content
export async function GET() {
  try {
    const [robotsConfig] = await query<{ value: string }>(
      "SELECT value FROM seo_config WHERE `key` = 'ROBOTS_TXT'"
    );

    const robotsContent = robotsConfig?.value || `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /crm/
Disallow: /api/

Sitemap: https://vectorafriqproperties.co.ke/sitemap.xml`;

    return new NextResponse(robotsContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });

  } catch (error) {
    console.error("Error fetching robots.txt:", error);
    return new NextResponse("User-agent: *\nAllow: /", {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

// POST - Update robots.txt content (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: "Valid robots.txt content is required" },
        { status: 400 }
      );
    }

    // Update robots.txt content in database
    await query(
      `UPDATE seo_config 
       SET value = ?, updatedAt = CURRENT_TIMESTAMP(3)
       WHERE \`key\` = 'ROBOTS_TXT'`,
      [content]
    );

    return NextResponse.json({
      success: true,
      message: "Robots.txt updated successfully",
    });

  } catch (error) {
    console.error("Error updating robots.txt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
