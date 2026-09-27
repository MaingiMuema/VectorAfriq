import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * GET /api/admin/seo/agent/issues
 * List technical SEO issues with filtering.
 * Also serves content gaps with ?type=gaps
 * 
 * Query params: status, severity, issueType, type (issues|gaps), limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "issues";

    if (type === "gaps") {
      return await fetchContentGaps(searchParams);
    }

    return await fetchTechnicalIssues(searchParams);
  } catch (error) {
    console.error("[SEO Agent] Issues fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function fetchTechnicalIssues(searchParams: URLSearchParams) {
  const status = searchParams.get("status") || "open";
  const severity = searchParams.get("severity");
  const issueType = searchParams.get("issueType");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status && status !== "all") {
    conditions.push("status = ?");
    params.push(status);
  }
  if (severity) {
    conditions.push("severity = ?");
    params.push(severity);
  }
  if (issueType) {
    conditions.push("issueType = ?");
    params.push(issueType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const issues = await query(
    `SELECT * FROM seo_technical_issue ${whereClause}
   ORDER BY 
     CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
     lastDetected DESC
   LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [{ count }] = await query<{ count: number }>(
    `SELECT COUNT(*) as count FROM seo_technical_issue ${whereClause}`,
    params
  );

  // Summary by issue type
  const summary = await query<{ issueType: string; count: number }>(
    `SELECT issueType, COUNT(*) as count FROM seo_technical_issue WHERE status = 'open' GROUP BY issueType ORDER BY count DESC`
  );

  return NextResponse.json({
    success: true,
    issues,
    pagination: { total: count, limit, offset, hasMore: offset + limit < count },
    summary,
  });
}

async function fetchContentGaps(searchParams: URLSearchParams) {
  const status = searchParams.get("status") || "new";
  const gapType = searchParams.get("gapType");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status && status !== "all") {
    conditions.push("status = ?");
    params.push(status);
  }
  if (gapType) {
    conditions.push("gapType = ?");
    params.push(gapType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const gaps = await query(
    `SELECT * FROM seo_content_gap ${whereClause}
     ORDER BY priorityScore DESC, createdAt DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [{ count }] = await query<{ count: number }>(
    `SELECT COUNT(*) as count FROM seo_content_gap ${whereClause}`,
    params
  );

  return NextResponse.json({
    success: true,
    gaps,
    pagination: { total: count, limit, offset, hasMore: offset + limit < count },
  });
}

/**
 * PATCH — Update issue or gap status
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, type } = body;

    if (!id || !action || !type) {
      return NextResponse.json({ error: "id, action, and type required" }, { status: 400 });
    }

    if (type === "issue") {
      if (action === "resolve") {
        await query(
          `UPDATE seo_technical_issue SET status = 'resolved', resolvedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
          [id]
        );
      } else if (action === "ignore") {
        await query(`UPDATE seo_technical_issue SET status = 'ignored' WHERE id = ?`, [id]);
      }
    } else if (type === "gap") {
      const validStatuses = ["approved", "in_progress", "published", "rejected"];
      if (validStatuses.includes(action)) {
        await query(`UPDATE seo_content_gap SET status = ? WHERE id = ?`, [action, id]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SEO Agent] Issue update failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
