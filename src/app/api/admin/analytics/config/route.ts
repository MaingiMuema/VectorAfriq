import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface AnalyticsConfig {
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

// GET - Fetch analytics configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await query<AnalyticsConfig>(
      "SELECT * FROM analytics_config ORDER BY `key` ASC"
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
    console.error("Error fetching analytics config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update analytics configuration
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
        `UPDATE analytics_config
         SET value = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE \`key\` = ?`,
        [configUpdate.value || "", configUpdate.isActive !== false, key]
      );
    });

    await Promise.all(updatePromises);

    // Fetch updated configs
    const updatedConfigs = await query<AnalyticsConfig>(
      "SELECT * FROM analytics_config ORDER BY `key` ASC"
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
      message: "Analytics configuration updated successfully",
      configs: configMap,
    });
  } catch (error) {
    console.error("Error updating analytics config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Reset analytics configuration to defaults
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reset to default values
    await query(`
      UPDATE analytics_config SET
        value = CASE
          WHEN \`key\` = 'GOOGLE_ANALYTICS_ENABLED' THEN 'false'
          WHEN \`key\` = 'GOOGLE_TAG_MANAGER_ENABLED' THEN 'false'
          WHEN \`key\` = 'SEARCH_CONSOLE_ENABLED' THEN 'false'
          WHEN \`key\` = 'ENHANCED_MEASUREMENT_ENABLED' THEN 'true'
          WHEN \`key\` = 'USER_ID_TRACKING_ENABLED' THEN 'false'
          WHEN \`key\` = 'CROSS_DOMAIN_TRACKING_ENABLED' THEN 'false'
          WHEN \`key\` = 'VISITOR_TRACKING_ENABLED' THEN 'true'
          WHEN \`key\` = 'PROPERTY_VIEW_TRACKING_ENABLED' THEN 'true'
          WHEN \`key\` = 'DATA_RETENTION_DAYS' THEN '365'
          WHEN \`key\` = 'IP_ANONYMIZATION_ENABLED' THEN 'true'
          ELSE ''
        END,
        isActive = true,
        updatedAt = CURRENT_TIMESTAMP(3)
    `);

    return NextResponse.json({
      success: true,
      message: "Analytics configuration reset to defaults",
    });
  } catch (error) {
    console.error("Error resetting analytics config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
