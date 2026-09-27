import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureInquiriesSchema();

    const email = session.user.email;
    if (!email) {
      return NextResponse.json({ inquiries: [] });
    }

    const inquiries = await query<InquiryRow>(
      "SELECT * FROM surveyor_inquiries WHERE email = ? ORDER BY createdAt DESC LIMIT 20",
      [email]
    );

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("[CRM_SURVEYOR_INQUIRIES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}
