import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, DatabaseValue } from "@/lib/db";

const SETTING_TYPES = ["STRING", "NUMBER", "BOOLEAN", "JSON"] as const;
type SettingType = (typeof SETTING_TYPES)[number];

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  category: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Value validation helper
function validateValue(
  value: string | number | boolean | object,
  type: SettingType
): string {
  switch (type) {
    case "NUMBER":
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error("Invalid number value");
      }
      return String(num);

    case "BOOLEAN":
      if (typeof value !== "boolean" && value !== "true" && value !== "false") {
        throw new Error("Invalid boolean value");
      }
      return String(value);

    case "JSON":
      try {
        return JSON.stringify(
          typeof value === "string" ? JSON.parse(value) : value
        );
      } catch {
        throw new Error("Invalid JSON value");
      }

    default:
      return String(value);
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let whereClause = "";
    const params: DatabaseValue[] = [];

    if (category) {
      whereClause = "WHERE category = ?";
      params.push(category);
    }

    const settings = await query<SystemSetting>(
      `
      SELECT * FROM systemsetting
      ${whereClause}
      ORDER BY category ASC, \`key\` ASC
    `,
      params
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get existing setting
    const [setting] = await query<SystemSetting>(
      "SELECT * FROM systemsetting WHERE `key` = ?",
      [key]
    );

    if (!setting) {
      return new NextResponse("Setting not found", { status: 404 });
    }

    // Validate and parse value
    try {
      const parsedValue = validateValue(value, setting.type);

      // Update setting
      await query(
        "UPDATE systemsetting SET value = ?, updatedAt = NOW() WHERE `key` = ?",
        [parsedValue, key]
      );

      // Get updated setting
      const [updatedSetting] = await query<SystemSetting>(
        "SELECT * FROM systemsetting WHERE `key` = ?",
        [key]
      );

      return NextResponse.json(updatedSetting);
    } catch (error) {
      return new NextResponse(
        error instanceof Error ? error.message : "Invalid value type",
        {
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Error updating setting:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value, type, category, description } = body;

    if (!key || !type || !category || value === undefined) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!SETTING_TYPES.includes(type)) {
      return new NextResponse("Invalid setting type", { status: 400 });
    }

    // Check for existing setting
    const [existingSetting] = await query<SystemSetting>(
      "SELECT * FROM systemsetting WHERE `key` = ?",
      [key]
    );

    if (existingSetting) {
      return new NextResponse("Setting key already exists", { status: 400 });
    }

    // Validate and parse value
    try {
      const parsedValue = validateValue(value, type);

      // Create new setting
      await query(
        `
        INSERT INTO systemsetting (\`key\`, value, type, category, description, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `,
        [key, parsedValue, type, category, description || null]
      );

      // Get created setting
      const [setting] = await query<SystemSetting>(
        "SELECT * FROM systemsetting WHERE `key` = ?",
        [key]
      );

      return NextResponse.json(setting);
    } catch (error) {
      return new NextResponse(
        error instanceof Error ? error.message : "Invalid value type",
        {
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Error creating setting:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return new NextResponse("Missing setting key", { status: 400 });
    }

    await query("DELETE FROM systemsetting WHERE `key` = ?", [key]);

    return new NextResponse("Setting deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting setting:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
