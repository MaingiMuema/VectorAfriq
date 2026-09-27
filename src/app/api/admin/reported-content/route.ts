import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, DatabaseValue } from "@/lib/db";
import { sendReportReviewedEmail } from "@/lib/reportEmail";

const ReportStatus = {
  PENDING: "PENDING",
  REVIEWED: "REVIEWED",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;

type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

interface ReportedContent {
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  notes: string | null;
  reporterId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Input validation schemas
const updateReportSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const contentType = searchParams.get("contentType");

    // Validate pagination parameters
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    // Add filters
    if (
      status &&
      Object.values(ReportStatus).includes(status as ReportStatus)
    ) {
      whereClause += " AND rc.status = ?";
      params.push(status);
    }

    if (contentType) {
      whereClause += " AND rc.contentType = ?";
      params.push(contentType);
    }

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `
      SELECT COUNT(*) as total 
      FROM reportedcontent rc
      ${whereClause}
    `,
      params
    );

    const total = countResult.total;

    // Get reports with reporter data
    const reports = await query<ReportedContent & { reporter: string }>(
      `
      SELECT 
        rc.*,
        JSON_OBJECT(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as reporter
      FROM reportedcontent rc
      LEFT JOIN user u ON rc.reporterId = u.id
      ${whereClause}
      ORDER BY rc.createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [...params, limit, skip]
    );

    // Format the response
    const formattedReports = reports.map((report) => ({
      ...report,
      reporter: JSON.parse(report.reporter as string),
    }));

    return NextResponse.json({
      reports: formattedReports,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("[Reported Content API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    try {
      const validated = updateReportSchema.parse(data);

      // Update report
      await query(
        "UPDATE reportedcontent SET status = ?, notes = ?, updatedAt = NOW() WHERE id = ?",
        [validated.status, validated.notes || null, id]
      );

      // Fetch updated report with reporter data
      const [report] = await query<ReportedContent & { reporter: string }>(
        `
        SELECT 
          rc.*,
          JSON_OBJECT(
            'id', u.id,
            'name', u.name,
            'email', u.email
          ) as reporter
        FROM reportedcontent rc
        LEFT JOIN user u ON rc.reporterId = u.id
        WHERE rc.id = ?
      `,
        [id]
      );

      const formattedReport = {
        ...report,
        reporter: JSON.parse(report.reporter as string),
      };

      // Send email notification to reporter only when status actually changes (non-blocking)
      if (validated.status !== report.status && validated.status !== "PENDING" && formattedReport.reporter?.email) {
        // Fetch property title for the email
        const [propertyRow] = await query<{ title: string }>(
          "SELECT title FROM property WHERE id = ?",
          [report.contentId]
        );
        const propertyTitle = propertyRow?.title || report.contentId;

        sendReportReviewedEmail({
          to: formattedReport.reporter.email,
          userName: formattedReport.reporter.name || "User",
          propertyTitle,
          status: validated.status as "REVIEWED" | "RESOLVED" | "DISMISSED",
          adminNotes: validated.notes || null,
        }).catch((err) => console.error("[REPORT_REVIEWED_EMAIL_ERROR]", err));
      }

      return NextResponse.json(formattedReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[Reported Content API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    await query("DELETE FROM reportedcontent WHERE id = ?", [id]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[Reported Content API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
