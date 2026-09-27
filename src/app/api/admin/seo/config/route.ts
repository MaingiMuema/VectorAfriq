import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface SeoConfig {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConfigValue {
  value: string;
  description: string;
  isActive: boolean;
  updatedAt: string;
}

interface ConfigUpdate {
  value: string;
  isActive: boolean;
}

// GET - Fetch SEO configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await query<SeoConfig>(
      "SELECT * FROM seo_config ORDER BY `key` ASC"
    );

    // Transform to key-value pairs for easier frontend consumption
    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = {
        value: config.value || "",
        description: config.description || "",
        isActive: config.isActive,
        updatedAt: config.updatedAt,
      };
      return acc;
    }, {} as Record<string, ConfigValue>);

    return NextResponse.json({
      success: true,
      configs: configMap,
      raw: configs,
    });
  } catch (error) {
    console.error("Error fetching SEO config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update SEO configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { configs } = body;

    if (!configs || typeof configs !== "object") {
      return NextResponse.json(
        { error: "Invalid configuration data" },
        { status: 400 }
      );
    }

    // Update each configuration
    const updatePromises = Object.entries(configs).map(async ([key, config]) => {
      const configUpdate = config as ConfigUpdate;
      return query(
        `UPDATE seo_config
         SET value = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE \`key\` = ?`,
        [configUpdate.value || "", configUpdate.isActive !== false, key]
      );
    });

    await Promise.all(updatePromises);
    revalidateTag("seo-config", { expire: 0 });

    // Fetch updated configs
    const updatedConfigs = await query<SeoConfig>(
      "SELECT * FROM seo_config ORDER BY `key` ASC"
    );

    const configMap = updatedConfigs.reduce((acc, config) => {
      acc[config.key] = {
        value: config.value || "",
        description: config.description || "",
        isActive: config.isActive,
        updatedAt: config.updatedAt,
      };
      return acc;
    }, {} as Record<string, ConfigValue>);

    return NextResponse.json({
      success: true,
      message: "SEO configuration updated successfully",
      configs: configMap,
    });
  } catch (error) {
    console.error("Error updating SEO config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Reset SEO configuration to defaults
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reset to default values
    await query(`
      UPDATE seo_config SET 
        value = CASE 
          WHEN \`key\` = 'SITE_NAME' THEN 'VectorAfriq'
          WHEN \`key\` = 'SITE_URL' THEN 'https://vectorafriqproperties.co.ke'
          WHEN \`key\` = 'DEFAULT_TITLE' THEN 'VectorAfriq | Find Your Dream Property in Kenya'
          WHEN \`key\` = 'DEFAULT_DESCRIPTION' THEN 'Browse through a wide selection of properties for sale and rent in Kenya. Find houses, apartments, land, and commercial properties.'
          WHEN \`key\` = 'DEFAULT_KEYWORDS' THEN 'real estate, property, Kenya, houses for sale, apartments for rent, land for sale'
          WHEN \`key\` = 'DEFAULT_OG_IMAGE' THEN '/images/og-default.jpg'
          WHEN \`key\` = 'TWITTER_HANDLE' THEN '@vectorafriqproperties'
          WHEN \`key\` = 'SITEMAP_ENABLED' THEN 'true'
          WHEN \`key\` = 'STRUCTURED_DATA_ENABLED' THEN 'true'
          WHEN \`key\` = 'AUTO_META_ENABLED' THEN 'true'
          WHEN \`key\` = 'CANONICAL_ENABLED' THEN 'true'
          WHEN \`key\` = 'ROBOTS_TXT' THEN 'User-agent: *\\nAllow: /\\nDisallow: /admin/\\nDisallow: /crm/\\nDisallow: /api/\\n\\nSitemap: https://vectorafriqproperties.co.ke/sitemap.xml'
          ELSE ''
        END,
        isActive = true,
        updatedAt = CURRENT_TIMESTAMP(3)
    `);
    revalidateTag("seo-config", { expire: 0 });

    return NextResponse.json({
      success: true,
      message: "SEO configuration reset to defaults",
    });
  } catch (error) {
    console.error("Error resetting SEO config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
