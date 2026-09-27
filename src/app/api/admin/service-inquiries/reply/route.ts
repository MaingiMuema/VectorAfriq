import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { ensureServiceInquiriesSchema } from "@/lib/serviceInquiriesSchema";
import { sendInquiryReplyEmail } from "@/lib/inquiryEmail";

interface InquiryRow {
  id: string;
  servicePage: string;
  name: string;
  email: string;
  phone: string | null;
  serviceType: string;
  location: string | null;
  propertyUrl: string | null;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureServiceInquiriesSchema();

    const body = await request.json();
    const id = String(body.id || "").trim();
    const replyMessage = String(body.replyMessage || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Inquiry ID is required" },
        { status: 400 }
      );
    }

    if (!replyMessage || replyMessage.length < 5) {
      return NextResponse.json(
        { error: "Reply message is required (minimum 5 characters)" },
        { status: 400 }
      );
    }

    const [inquiry] = await query<InquiryRow>(
      "SELECT * FROM service_inquiries WHERE id = ?",
      [id]
    );

    if (!inquiry) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    // Update status to REPLIED
    await query(
      "UPDATE service_inquiries SET status = 'REPLIED', updatedAt = NOW() WHERE id = ?",
      [id]
    );

    // Send reply email to the user (non-blocking)
    const serviceLabel = inquiry.servicePage
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    sendInquiryReplyEmail({
      to: inquiry.email,
      name: inquiry.name,
      serviceType: inquiry.serviceType || serviceLabel,
      replyMessage,
      adminName: session.user.name || "VectorAfriq Team",
    }).catch((err) => console.error("[INQUIRY_REPLY_EMAIL_FAIL]", err));

    const [updated] = await query<InquiryRow>(
      "SELECT * FROM service_inquiries WHERE id = ?",
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully",
      inquiry: updated,
    });
  } catch (error) {
    console.error("[ADMIN_SERVICE_INQUIRY_REPLY]", error);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}
