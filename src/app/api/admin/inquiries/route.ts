import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, type DatabaseValue } from "@/lib/db";
import { ensureInquiriesSchema } from "@/lib/inquiriesSchema";

interface InquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  serviceType: string;
  location: string | null;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const allowedStatuses = ["NEW", "READ", "REPLIED", "CLOSED"];

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureInquiriesSchema();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search")?.trim() || "";
    const serviceType = searchParams.get("serviceType") || "ALL";
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (status !== "ALL") {
      whereClause += " AND status = ?";
      params.push(status);
    }

    if (serviceType !== "ALL") {
      whereClause += " AND serviceType = ?";
      params.push(serviceType);
    }

    if (search) {
      whereClause += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ? OR location LIKE ?)";
      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    const [count] = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM surveyor_inquiries ${whereClause}`,
      params
    );

    const inquiries = await query<InquiryRow>(
      `SELECT * FROM surveyor_inquiries ${whereClause}
       ORDER BY
         CASE status WHEN 'NEW' THEN 0 WHEN 'READ' THEN 1 WHEN 'REPLIED' THEN 2 ELSE 3 END,
         createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get global counts per status
    const [statusCounts] = await query<Record<string, number>>(
      `SELECT
         SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END) as newCount,
         SUM(CASE WHEN status = 'READ' THEN 1 ELSE 0 END) as readCount,
         SUM(CASE WHEN status = 'REPLIED' THEN 1 ELSE 0 END) as repliedCount,
         SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closedCount
       FROM surveyor_inquiries`
    );

    return NextResponse.json({
      inquiries,
      total: Number(count.total),
      pages: Math.ceil(Number(count.total) / limit),
      statusCounts: {
        NEW: Number(statusCounts?.newCount || 0),
        READ: Number(statusCounts?.readCount || 0),
        REPLIED: Number(statusCounts?.repliedCount || 0),
        CLOSED: Number(statusCounts?.closedCount || 0),
      },
    });
  } catch (error) {
    console.error("[ADMIN_INQUIRIES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureInquiriesSchema();

    const body = await request.json();
    const id = String(body.id || "");
    const status = String(body.status || "");

    if (!id || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid inquiry status update" },
        { status: 400 }
      );
    }

    await query(
      "UPDATE surveyor_inquiries SET status = ?, updatedAt = NOW() WHERE id = ?",
      [status, id]
    );

    const [inquiry] = await query<InquiryRow>(
      "SELECT * FROM surveyor_inquiries WHERE id = ?",
      [id]
    );

    if (!inquiry) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ inquiry });
  } catch (error) {
    console.error("[ADMIN_INQUIRIES_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}
