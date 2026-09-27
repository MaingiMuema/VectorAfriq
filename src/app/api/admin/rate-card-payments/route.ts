import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, type DatabaseValue } from "@/lib/db";
import {
  approveSubscription,
  rejectSubscription,
} from "@/lib/rateCards";

interface SubRow {
  id: string;
  userId: string;
  planId: string;
  tierSlug: string;
  billingCycle: string;
  amount: number;
  listingLimit: number;
  tillNumber: string | null;
  proofUrl: string | null;
  mpesaCode: string | null;
  status: string;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
  planName: string | null;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "PENDING";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (status && status !== "ALL") {
      where += " AND s.status = ?";
      params.push(status);
    }
    if (search) {
      where += " AND (u.name LIKE ? OR u.email LIKE ? OR s.mpesaCode LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await query<{ total: number }>(
      `SELECT COUNT(*) as total
       FROM rate_card_subscription s
       LEFT JOIN user u ON u.id = s.userId
       ${where}`,
      params
    );

    const rows = await query<SubRow>(
      `SELECT s.*, u.name as userName, u.email as userEmail, p.name as planName
       FROM rate_card_subscription s
       LEFT JOIN user u ON u.id = s.userId
       LEFT JOIN rate_card_plan p ON p.id = s.planId
       ${where}
       ORDER BY
         CASE s.status WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 ELSE 2 END,
         s.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, skip]
    );

    const [counts] = await query<{
      pending: number;
      approved: number;
      rejected: number;
    }>(
      `SELECT
         SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status='APPROVED' THEN 1 ELSE 0 END) as approved,
         SUM(CASE WHEN status='REJECTED' THEN 1 ELSE 0 END) as rejected
       FROM rate_card_subscription`
    );

    return NextResponse.json({
      payments: rows,
      pagination: {
        total: countResult?.total || 0,
        pages: Math.max(1, Math.ceil((countResult?.total || 0) / limit)),
        page,
        limit,
      },
      counts: counts || { pending: 0, approved: 0, rejected: 0 },
    });
  } catch (error) {
    console.error("[Admin Rate Card Payments GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, action, adminNotes } = body;

    if (!id || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "id and action (APPROVE|REJECT) are required" },
        { status: 400 }
      );
    }

    const result =
      action === "APPROVE"
        ? await approveSubscription({
            subscriptionId: id,
            adminId: session.user.id,
            adminNotes,
          })
        : await rejectSubscription({
            subscriptionId: id,
            adminId: session.user.id,
            adminNotes,
          });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? "Payment approved — tier access granted"
          : "Payment rejected",
    });
  } catch (error) {
    console.error("[Admin Rate Card Payments PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
