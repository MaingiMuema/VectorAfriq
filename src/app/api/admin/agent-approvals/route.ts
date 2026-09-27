import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { sendAgentApprovalResultEmail } from "@/lib/agentApprovalEmail";

interface ApprovalRecord {
  id: string;
  userId: string;
  status: string;
  phone: string;
  company: string;
  licenseNumber: string | null;
  experience: string | null;
  specialization: string | null;
  message: string | null;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ApprovalWithUser extends ApprovalRecord {
  userName: string;
  userEmail: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "PENDING";
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: (string | number)[] = [];

    if (status && status !== "ALL") {
      whereClause += " AND aa.status = ?";
      params.push(status);
    }

    if (search) {
      whereClause += " AND (u.name LIKE ? OR u.email LIKE ? OR aa.company LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM agent_approval aa
       LEFT JOIN user u ON aa.userId = u.id
       ${whereClause}`,
      params
    );

    const total = countResult.total;

    // Get approvals with user info
    const approvals = await query<ApprovalWithUser>(
      `SELECT aa.*, u.name as userName, u.email as userEmail
       FROM agent_approval aa
       LEFT JOIN user u ON aa.userId = u.id
       ${whereClause}
       ORDER BY
         CASE aa.status WHEN 'PENDING' THEN 0 WHEN 'REJECTED' THEN 1 ELSE 2 END,
         aa.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, skip]
    );

    // Get counts by status
    const [statusCounts] = await query<{
      pending: number;
      approved: number;
      rejected: number;
    }>(
      `SELECT
         SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
         SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
       FROM agent_approval`
    );

    return NextResponse.json({
      approvals,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
      counts: statusCounts || { pending: 0, approved: 0, rejected: 0 },
    });
  } catch (error) {
    console.error("[Admin Agent Approvals GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent approvals" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, reviewNotes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields (id, status)" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // Get the approval record
    const [approval] = await query<ApprovalRecord>(
      `SELECT * FROM agent_approval WHERE id = ?`,
      [id]
    );

    if (!approval) {
      return NextResponse.json(
        { error: "Approval request not found" },
        { status: 404 }
      );
    }

    if (approval.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been reviewed" },
        { status: 400 }
      );
    }

    // Update approval status
    await query(
      `UPDATE agent_approval
       SET status = ?, reviewNotes = ?, reviewedAt = NOW(), reviewedBy = ?, updatedAt = NOW()
       WHERE id = ?`,
      [status, reviewNotes || null, session.user.id, id]
    );

    // If approved, upgrade user role to AGENT
    if (status === "APPROVED") {
      await query(
        `UPDATE user SET role = 'AGENT', updatedAt = NOW() WHERE id = ? AND role = 'USER'`,
        [approval.userId]
      );
    }

    // Get user info for email
    const [user] = await query<{ name: string; email: string }>(
      `SELECT name, email FROM user WHERE id = ?`,
      [approval.userId]
    );

    // Send email notification to user
    if (user?.email) {
      await sendAgentApprovalResultEmail({
        to: user.email,
        userName: user.name || "User",
        status: status as "APPROVED" | "REJECTED",
        reviewNotes: reviewNotes || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Agent application ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("[Admin Agent Approvals PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update agent approval" },
      { status: 500 }
    );
  }
}
