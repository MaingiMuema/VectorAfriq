import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface PageMeta {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string;
  twitterCard: string;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  noFollow: boolean;
  priority: number;
  changeFreq: string;
  structuredData: string | null;
  customMeta: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET - Fetch page meta tags
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let pages: PageMeta[];
    let total: number;

    if (path) {
      // Get specific page
      pages = await query<PageMeta>(
        "SELECT * FROM page_meta WHERE path = ?",
        [path]
      );
      total = pages.length;
    } else {
      // Get all pages with pagination
      pages = await query<PageMeta>(
        "SELECT * FROM page_meta ORDER BY path ASC LIMIT ? OFFSET ?",
        [limit, offset]
      );
      
      const [{ count }] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM page_meta"
      );
      total = count;
    }

    return NextResponse.json({
      success: true,
      pages: pages.map(page => ({
        ...page,
        structuredData: page.structuredData ? JSON.parse(page.structuredData as string) : null,
        customMeta: page.customMeta ? JSON.parse(page.customMeta as string) : null,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching page meta:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create or update page meta
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      path,
      title,
      description,
      keywords,
      ogTitle,
      ogDescription,
      ogImage,
      ogType = 'website',
      twitterCard = 'summary_large_image',
      twitterTitle,
      twitterDescription,
      twitterImage,
      canonicalUrl,
      noIndex = false,
      noFollow = false,
      priority = 0.5,
      changeFreq = 'weekly',
      structuredData,
      customMeta,
      isActive = true,
    } = body;

    if (!path) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    // Check if page meta already exists
    const [existingPage] = await query<PageMeta>(
      "SELECT id FROM page_meta WHERE path = ?",
      [path]
    );

    const structuredDataJson = structuredData ? JSON.stringify(structuredData) : null;
    const customMetaJson = customMeta ? JSON.stringify(customMeta) : null;

    if (existingPage) {
      // Update existing page meta
      await query(
        `UPDATE page_meta SET 
         title = ?, description = ?, keywords = ?, ogTitle = ?, ogDescription = ?, 
         ogImage = ?, ogType = ?, twitterCard = ?, twitterTitle = ?, twitterDescription = ?, 
         twitterImage = ?, canonicalUrl = ?, noIndex = ?, noFollow = ?, priority = ?, 
         changeFreq = ?, structuredData = ?, customMeta = ?, isActive = ?, 
         updatedAt = CURRENT_TIMESTAMP(3)
         WHERE path = ?`,
        [
          title, description, keywords, ogTitle, ogDescription, ogImage, ogType,
          twitterCard, twitterTitle, twitterDescription, twitterImage, canonicalUrl,
          noIndex, noFollow, priority, changeFreq, structuredDataJson, customMetaJson,
          isActive, path
        ]
      );
    } else {
      // Create new page meta
      const id = `meta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await query(
        `INSERT INTO page_meta (
          id, path, title, description, keywords, ogTitle, ogDescription, ogImage, ogType,
          twitterCard, twitterTitle, twitterDescription, twitterImage, canonicalUrl,
          noIndex, noFollow, priority, changeFreq, structuredData, customMeta, isActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, path, title, description, keywords, ogTitle, ogDescription, ogImage, ogType,
          twitterCard, twitterTitle, twitterDescription, twitterImage, canonicalUrl,
          noIndex, noFollow, priority, changeFreq, structuredDataJson, customMetaJson, isActive
        ]
      );
    }

    // Fetch updated page meta
    const [updatedPage] = await query<PageMeta>(
      "SELECT * FROM page_meta WHERE path = ?",
      [path]
    );

    return NextResponse.json({
      success: true,
      message: existingPage ? "Page meta updated successfully" : "Page meta created successfully",
      page: {
        ...updatedPage,
        structuredData: updatedPage.structuredData ? JSON.parse(updatedPage.structuredData as string) : null,
        customMeta: updatedPage.customMeta ? JSON.parse(updatedPage.customMeta as string) : null,
      },
    });
  } catch (error) {
    console.error("Error saving page meta:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete page meta
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    await query("DELETE FROM page_meta WHERE path = ?", [path]);

    return NextResponse.json({
      success: true,
      message: "Page meta deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting page meta:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
