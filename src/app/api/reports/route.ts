import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { sendReportConfirmationEmail } from "@/lib/reportEmail";
import { REPORT_REASONS } from "@/lib/reportConstants";

const reportSchema = z.object({
  contentId: z.string().min(1, "Property ID is required"),
  reason: z.enum(REPORT_REASONS, { message: "Please select a valid reason" }),
  description: z.string().max(1000, "Description must be 1000 characters or fewer").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to report content" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = reportSchema.parse(body);

    // Verify the property exists
    const [property] = await query<{ id: string; title: string }>(
      "SELECT id, title FROM property WHERE id = ?",
      [validated.contentId]
    );

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Check for duplicate reports from same user on same property (within 24 hours)
    const [existingReport] = await query<{ id: string }>(
      `SELECT id FROM reportedcontent 
       WHERE reporterId = ? AND contentId = ? 
       AND contentType = 'PROPERTY' 
       AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [session.user.id, validated.contentId]
    );

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this listing recently. Please wait 24 hours before reporting again." },
        { status: 409 }
      );
    }

    // Generate report ID (cuid-like format used in the project)
    const reportId = `rpt${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

    // Insert the report
    await query(
      `INSERT INTO reportedcontent (id, reporterId, contentType, contentId, reason, description, status, createdAt, updatedAt)
       VALUES (?, ?, 'PROPERTY', ?, ?, ?, 'PENDING', NOW(), NOW())`,
      [reportId, session.user.id, validated.contentId, validated.reason, validated.description || null]
    );

    // Send confirmation email to user (non-blocking)
    const reporterEmail = (session.user as { email?: string }).email;
    const reporterName = (session.user as { name?: string }).name || "User";

    if (reporterEmail) {
      sendReportConfirmationEmail({
        to: reporterEmail,
        userName: reporterName,
        propertyTitle: property.title,
        reason: validated.reason,
        description: validated.description,
      }).catch((err) => console.error("[REPORT_EMAIL_ERROR]", err));
    }

    return NextResponse.json({
      success: true,
      message: "Your report has been submitted. Our team will review it shortly.",
      reportId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[REPORT_API_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
