import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonicalUrl: string;
  noindex: boolean;
  nofollow: boolean;
}

// GET - Fetch SEO settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await query<{ key: string; value: string | null }>(
      "SELECT `key`, value FROM seo_config WHERE `key` IN ('META_TITLE', 'META_DESCRIPTION', 'OG_TITLE', 'OG_DESCRIPTION', 'OG_IMAGE', 'TWITTER_CARD', 'TWITTER_TITLE', 'TWITTER_DESCRIPTION', 'TWITTER_IMAGE', 'CANONICAL_URL', 'NOINDEX', 'NOFOLLOW')"
    );

    const settings: SEOSettings = {
      metaTitle: configs.find(c => c.key === 'META_TITLE')?.value || '',
      metaDescription: configs.find(c => c.key === 'META_DESCRIPTION')?.value || '',
      ogTitle: configs.find(c => c.key === 'OG_TITLE')?.value || '',
      ogDescription: configs.find(c => c.key === 'OG_DESCRIPTION')?.value || '',
      ogImage: configs.find(c => c.key === 'OG_IMAGE')?.value || '',
      twitterCard: configs.find(c => c.key === 'TWITTER_CARD')?.value || 'summary',
      twitterTitle: configs.find(c => c.key === 'TWITTER_TITLE')?.value || '',
      twitterDescription: configs.find(c => c.key === 'TWITTER_DESCRIPTION')?.value || '',
      twitterImage: configs.find(c => c.key === 'TWITTER_IMAGE')?.value || '',
      canonicalUrl: configs.find(c => c.key === 'CANONICAL_URL')?.value || '',
      noindex: configs.find(c => c.key === 'NOINDEX')?.value === 'true',
      nofollow: configs.find(c => c.key === 'NOFOLLOW')?.value === 'true',
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error fetching SEO settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update SEO settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 }
      );
    }

    const { metaTitle, metaDescription, ogTitle, ogDescription, ogImage, twitterCard, twitterTitle, twitterDescription, twitterImage, canonicalUrl, noindex, nofollow } = settings as SEOSettings;

    // Update each setting
    const updatePromises = [
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'META_TITLE'", [metaTitle]),
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'META_DESCRIPTION'", [metaDescription]),
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'OG_TITLE'", [ogTitle]),
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'OG_DESCRIPTION'", [ogDescription]),
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'OG_IMAGE'", [ogImage]),
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'TWITTER_CARD'", [twitterCard]),
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'TWITTER_TITLE'", [twitterTitle]),
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'TWITTER_DESCRIPTION'", [twitterDescription]),
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'TWITTER_IMAGE'", [twitterImage]),
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'CANONICAL_URL'", [canonicalUrl]),
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'NOINDEX'", [noindex ? 'true' : 'false']),
      query("UPDATE seo_config SET value = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE `key` = 'NOFOLLOW'", [nofollow ? 'true' : 'false']),
    ];

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: "SEO settings updated successfully",
      settings: {
        metaTitle,
        metaDescription,
        ogTitle,
        ogDescription,
        ogImage,
        twitterCard,
        twitterTitle,
        twitterDescription,
        twitterImage,
        canonicalUrl,
        noindex,
        nofollow,
      },
    });
  } catch (error) {
    console.error("Error updating SEO settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}