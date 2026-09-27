import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureServiceInquiriesSchema } from "@/lib/serviceInquiriesSchema";
import { sendInquiryConfirmationEmail } from "@/lib/inquiryEmail";

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

function generateId() {
  return `svc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function POST(request: Request) {
  try {
    await ensureServiceInquiriesSchema();

    const body = await request.json();
    const servicePage = String(body.servicePage || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim() || null;
    const serviceType = String(body.serviceType || "").trim();
    const location = String(body.location || "").trim() || null;
    const propertyUrl = String(body.propertyUrl || "").trim() || null;
    const message = String(body.message || "").trim();
    const extraFields = body.extraFields && typeof body.extraFields === 'object' ? JSON.stringify(body.extraFields) : null;

    // Validate required fields
    if (!servicePage) {
      return NextResponse.json(
        { error: "Service page is required" },
        { status: 400 }
      );
    }

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Name is required (minimum 2 characters)" },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!serviceType) {
      return NextResponse.json(
        { error: "Service type is required" },
        { status: 400 }
      );
    }

    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: "Message is required (minimum 10 characters)" },
        { status: 400 }
      );
    }

    const id = generateId();

    await query(
      `
      INSERT INTO service_inquiries (id, servicePage, name, email, phone, serviceType, location, propertyUrl, message, extraFields)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [id, servicePage, name, email, phone, serviceType, location, propertyUrl, message, extraFields]
    );

    const [inquiry] = await query<InquiryRow>(
      "SELECT * FROM service_inquiries WHERE id = ?",
      [id]
    );

    // Send confirmation email (non-blocking)
    sendInquiryConfirmationEmail({
      to: email,
      name,
      serviceType,
      servicePage,
      extraFields: body.extraFields && typeof body.extraFields === 'object' ? body.extraFields : undefined,
    }).catch((err) => console.error("[INQUIRY_EMAIL_FAIL]", err));

    return NextResponse.json({
      success: true,
      message: "Your inquiry has been submitted. A specialist will contact you within 24 hours.",
      inquiry,
    });
  } catch (error) {
    console.error("[SERVICE_INQUIRY_POST]", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please try again." },
      { status: 500 }
    );
  }
}
