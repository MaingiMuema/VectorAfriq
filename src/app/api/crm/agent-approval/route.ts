import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { sendAgentApprovalRequestToAdmin } from "@/lib/agentApprovalEmail";

interface ExistingApproval {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    // Check if user already has an active approval request
    const [existingApproval] = await query<ExistingApproval>(
      `SELECT id, userId, status FROM agent_approval WHERE userId = ? AND status = 'PENDING'`,
      [session.user.id]
    );

    if (existingApproval) {
      return NextResponse.json(
        { error: "You already have a pending approval request. Please wait for admin review." },
        { status: 400 }
      );
    }

    // Check if user is already an agent
    const [user] = await query<{ role: string }>(
      `SELECT role FROM user WHERE id = ?`,
      [session.user.id]
    );

    if (user?.role === "AGENT") {
      return NextResponse.json(
        { error: "You are already a listed agent." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { phone, company, licenseNumber, experience, specialization, message } = body;

    // Validate required fields
    if (!phone || !company) {
      return NextResponse.json(
        { error: "Phone and company are required fields." },
        { status: 400 }
      );
    }

    const id = uuidv4().replace(/-/g, "");

    await query(
      `INSERT INTO agent_approval (id, userId, phone, company, licenseNumber, experience, specialization, message, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
      [id, session.user.id, phone, company, licenseNumber || null, experience || null, specialization || null, message || null]
    );

    // Send notification email to admin
    await sendAgentApprovalRequestToAdmin({
      userName: session.user.name || "Unknown User",
      userEmail: session.user.email || "",
      phone,
      company,
      licenseNumber,
      experience,
      specialization,
      message,
    });

    return NextResponse.json({
      success: true,
      message: "Your agent application has been submitted. You will receive an email once it is reviewed.",
      approvalId: id,
    });
  } catch (error) {
    console.error("[Agent Approval Request Error]:", error);
    return NextResponse.json(
      { error: "Failed to submit agent approval request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's approval history
    const approvals = await query<{
      id: string;
      status: string;
      phone: string;
      company: string;
      licenseNumber: string | null;
      experience: string | null;
      specialization: string | null;
      reviewNotes: string | null;
      reviewedAt: Date | null;
      createdAt: Date;
    }>(
      `SELECT id, status, phone, company, licenseNumber, experience, specialization, reviewNotes, reviewedAt, createdAt
       FROM agent_approval WHERE userId = ? ORDER BY createdAt DESC`,
      [session.user.id]
    );

    // Get user role
    const [user] = await query<{ role: string }>(
      `SELECT role FROM user WHERE id = ?`,
      [session.user.id]
    );

    return NextResponse.json({
      role: user?.role || "USER",
      approvals,
    });
  } catch (error) {
    console.error("[Agent Approval GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval status" },
      { status: 500 }
    );
  }
}
