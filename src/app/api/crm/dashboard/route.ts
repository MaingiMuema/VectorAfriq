import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  DashboardStats,
  LeadCount,
  LeadActivity,
  LeadTypeMap,
  LeadStatusMap,
} from "@/types/crm";

const getMonthName = (month: number) => {
  return new Date(0, month).toLocaleString("default", { month: "short" });
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Start of previous month
    const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
    // Start of 6 months ago
    const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);

    // Get leads with monthly grouping
    const leadsQuery = `
      SELECT 
        type,
        COUNT(*) as count,
        DATE_FORMAT(createdAt, '%Y-%m') as month
      FROM lead 
      WHERE createdAt >= ? 
      GROUP BY type, DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `;

    // Get revenue for current and previous month
    const revenueQuery = `
      SELECT 
        SUM(amount) as total,
        DATE_FORMAT(createdAt, '%Y-%m') as month
      FROM revenue 
      WHERE createdAt >= ?
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `;

    // Get recent activities
    const activitiesQuery = `
      SELECT 
        id,
        type,
        status,
        description,
        createdAt
      FROM lead 
      WHERE createdAt >= ?
      ORDER BY createdAt DESC
      LIMIT 10
    `;

    const [leads, revenue, activities] = await Promise.all([
      query<LeadCount>(leadsQuery, [sixMonthsAgo.toISOString()]),
      query<{ total: number; month: string }>(revenueQuery, [
        previousMonthStart.toISOString(),
      ]),
      query<LeadActivity>(activitiesQuery, [sixMonthsAgo.toISOString()]),
    ]);

    // Process lead data for chart
    const monthlyLeads = new Array(6).fill(0);
    const labels = [];

    for (let i = 0; i < 6; i++) {
      const monthDate = new Date();
      monthDate.setMonth(currentMonth - i);
      labels.unshift(getMonthName(monthDate.getMonth()));
    }

    // Initialize counters
    const currentMonthLeads = { total: 0, phone: 0, email: 0 };
    const previousMonthLeads = { total: 0, phone: 0, email: 0 };
    const currentMonthRevenue = { total: 0 };
    const previousMonthRevenue = { total: 0 };

    // Process leads
    leads.forEach((lead) => {
      const leadDate = new Date(lead.month);
      const monthDiff = currentMonth - leadDate.getMonth();

      if (monthDiff >= 0 && monthDiff < 6) {
        monthlyLeads[5 - monthDiff] += lead.count;
      }

      // Count current and previous month leads considering the year
      const isCurrentMonth =
        leadDate.getMonth() === currentMonth &&
        leadDate.getFullYear() === currentYear;
      const isPreviousMonth =
        (leadDate.getMonth() === currentMonth - 1 &&
          leadDate.getFullYear() === currentYear) ||
        (leadDate.getMonth() === 11 &&
          currentMonth === 0 &&
          leadDate.getFullYear() === currentYear - 1);

      if (isCurrentMonth) {
        currentMonthLeads.total += lead.count;
        if (lead.type === "PHONE") currentMonthLeads.phone += lead.count;
        if (lead.type === "EMAIL") currentMonthLeads.email += lead.count;
      } else if (isPreviousMonth) {
        previousMonthLeads.total += lead.count;
        if (lead.type === "PHONE") previousMonthLeads.phone += lead.count;
        if (lead.type === "EMAIL") previousMonthLeads.email += lead.count;
      }
    });

    // Process revenue
    revenue.forEach((rev) => {
      const revDate = new Date(rev.month);
      const isCurrentMonth =
        revDate.getMonth() === currentMonth &&
        revDate.getFullYear() === currentYear;
      const isPreviousMonth =
        (revDate.getMonth() === currentMonth - 1 &&
          revDate.getFullYear() === currentYear) ||
        (revDate.getMonth() === 11 &&
          currentMonth === 0 &&
          revDate.getFullYear() === currentYear - 1);

      if (isCurrentMonth) {
        currentMonthRevenue.total = rev.total;
      } else if (isPreviousMonth) {
        previousMonthRevenue.total = rev.total;
      }
    });

    // Calculate trends with proper comparison logic
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      const trend = ((current - previous) / previous) * 100;
      // Return the actual trend (can be negative)
      return trend;
    };

    const leadsTrend = calculateTrend(
      currentMonthLeads.total,
      previousMonthLeads.total
    );
    const phoneTrend = calculateTrend(
      currentMonthLeads.phone,
      previousMonthLeads.phone
    );
    const emailTrend = calculateTrend(
      currentMonthLeads.email,
      previousMonthLeads.email
    );
    const revenueTrend = calculateTrend(
      currentMonthRevenue.total,
      previousMonthRevenue.total
    );

    // Format activities with correct case
    const recentActivities = activities.map((activity) => ({
      id: activity.id,
      type: LeadTypeMap[activity.type],
      status: LeadStatusMap[activity.status],
      timestamp: new Date(activity.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      }),
      description: activity.description,
    }));

    const response: DashboardStats = {
      totalLeads: currentMonthLeads.total,
      phoneLeads: currentMonthLeads.phone,
      emailLeads: currentMonthLeads.email,
      totalRevenue: currentMonthRevenue.total,
      trends: {
        leads: leadsTrend,
        phone: phoneTrend,
        email: emailTrend,
        revenue: revenueTrend,
      },
      monthlyTrends: {
        leads: {
          labels,
          values: monthlyLeads,
        },
      },
      recentActivities,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Dashboard Data Error]:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
