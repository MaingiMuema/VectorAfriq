import { NextResponse } from "next/server";
import { query } from "@/lib/db";
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

function generateId() {
  return `inq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function POST(request: Request) {
  try {
    await ensureInquiriesSchema();

    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim() || null;
    const serviceType = String(body.serviceType || "").trim();
    const location = String(body.location || "").trim() || null;
    const message = String(body.message || "").trim();

    // Validate required fields
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
      INSERT INTO surveyor_inquiries (id, name, email, phone, serviceType, location, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [id, name, email, phone, serviceType, location, message]
    );

    const [inquiry] = await query<InquiryRow>(
      "SELECT * FROM surveyor_inquiries WHERE id = ?",
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Your inquiry has been submitted. A verified professional will contact you within 24 hours.",
      inquiry,
    });
  } catch (error) {
    console.error("[SURVEYOR_INQUIRY_POST]", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please try again." },
      { status: 500 }
    );
  }
}
