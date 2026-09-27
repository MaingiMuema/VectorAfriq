import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  userGrowthPercentage: number;
  activeListings: number;
  newListingsThisMonth: number;
  listingGrowthPercentage: number;
  totalMessages: number;
  newMessagesThisMonth: number;
  messageGrowthPercentage: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  leadGrowthPercentage: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
  quickActions: {
    pendingListings: number;
    newMessages: number;
    newLeads: number;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate date ranges
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Format dates for MySQL
    const thisMonthStart = startOfThisMonth.toISOString().split('T')[0];
    const lastMonthStart = startOfLastMonth.toISOString().split('T')[0];
    const lastMonthEnd = endOfLastMonth.toISOString().split('T')[0];

    // Fetch all statistics in parallel
    const [
      [{ totalUsers }],
      [{ newUsersThisMonth }],
      [{ newUsersLastMonth }],
      [{ activeListings }],
      [{ newListingsThisMonth }],
      [{ newListingsLastMonth }],
      [{ totalMessages }],
      [{ newMessagesThisMonth }],
      [{ newMessagesLastMonth }],
      [{ totalLeads }],
      [{ newLeadsThisMonth }],
      [{ newLeadsLastMonth }],
      [{ pendingListings }],
      [{ unreadMessages }],
      [{ basicLeads }],
      recentActivity,
    ] = await Promise.all([
      // User statistics
      query<{ totalUsers: number }>("SELECT COUNT(*) as totalUsers FROM user"),
      query<{ newUsersThisMonth: number }>(
        "SELECT COUNT(*) as newUsersThisMonth FROM user WHERE DATE(createdAt) >= ?",
        [thisMonthStart]
      ),
      query<{ newUsersLastMonth: number }>(
        "SELECT COUNT(*) as newUsersLastMonth FROM user WHERE DATE(createdAt) >= ? AND DATE(createdAt) <= ?",
        [lastMonthStart, lastMonthEnd]
      ),

      // Property statistics
      query<{ activeListings: number }>(
        "SELECT COUNT(*) as activeListings FROM property WHERE status = 'AVAILABLE'"
      ),
      query<{ newListingsThisMonth: number }>(
        "SELECT COUNT(*) as newListingsThisMonth FROM property WHERE DATE(createdAt) >= ?",
        [thisMonthStart]
      ),
      query<{ newListingsLastMonth: number }>(
        "SELECT COUNT(*) as newListingsLastMonth FROM property WHERE DATE(createdAt) >= ? AND DATE(createdAt) <= ?",
        [lastMonthStart, lastMonthEnd]
      ),

      // Message statistics
      query<{ totalMessages: number }>("SELECT COUNT(*) as totalMessages FROM messages"),
      query<{ newMessagesThisMonth: number }>(
        "SELECT COUNT(*) as newMessagesThisMonth FROM messages WHERE DATE(createdAt) >= ?",
        [thisMonthStart]
      ),
      query<{ newMessagesLastMonth: number }>(
        "SELECT COUNT(*) as newMessagesLastMonth FROM messages WHERE DATE(createdAt) >= ? AND DATE(createdAt) <= ?",
        [lastMonthStart, lastMonthEnd]
      ),

      // Lead statistics
      query<{ totalLeads: number }>("SELECT COUNT(*) as totalLeads FROM lead"),
      query<{ newLeadsThisMonth: number }>(
        "SELECT COUNT(*) as newLeadsThisMonth FROM lead WHERE DATE(createdAt) >= ?",
        [thisMonthStart]
      ),
      query<{ newLeadsLastMonth: number }>(
        "SELECT COUNT(*) as newLeadsLastMonth FROM lead WHERE DATE(createdAt) >= ? AND DATE(createdAt) <= ?",
        [lastMonthStart, lastMonthEnd]
      ),

      // Quick actions data
      query<{ pendingListings: number }>(
        "SELECT COUNT(*) as pendingListings FROM property WHERE status = 'PENDING'"
      ),
      query<{ unreadMessages: number }>(
        "SELECT COUNT(*) as unreadMessages FROM messages WHERE status = 'NEW'"
      ),
      query<{ basicLeads: number }>(
        "SELECT COUNT(*) as basicLeads FROM lead WHERE status = 'BASIC'"
      ),

      // Recent activity (last 10 activities)
      query<{
        id: string;
        type: string;
        description: string;
        createdAt: string;
        status: string;
      }>(
        `(SELECT 
          CONCAT('property_', p.id) as id,
          'property' as type,
          CONCAT('New property "', SUBSTRING(p.title, 1, 30), '..." was listed') as description,
          p.createdAt,
          p.status
        FROM property p
        ORDER BY p.createdAt DESC
        LIMIT 5)
        
        UNION ALL
        
        (SELECT 
          CONCAT('message_', m.id) as id,
          'message' as type,
          CONCAT('New message from ', m.fullName) as description,
          m.createdAt,
          m.status
        FROM messages m
        ORDER BY m.createdAt DESC
        LIMIT 5)
        
        ORDER BY createdAt DESC
        LIMIT 10`
      ),
    ]);

    // Calculate growth percentages with better logic
    const calculateGrowthPercentage = (current: number, previous: number): number => {
      if (previous === 0 && current === 0) return 0;
      if (previous === 0 && current > 0) return 100;
      if (previous > 0 && current === 0) return -100;
      return Math.round(((current - previous) / previous) * 100);
    };

    const userGrowthPercentage = calculateGrowthPercentage(newUsersThisMonth, newUsersLastMonth);
    const listingGrowthPercentage = calculateGrowthPercentage(newListingsThisMonth, newListingsLastMonth);
    const messageGrowthPercentage = calculateGrowthPercentage(newMessagesThisMonth, newMessagesLastMonth);
    const leadGrowthPercentage = calculateGrowthPercentage(newLeadsThisMonth, newLeadsLastMonth);

    const dashboardStats: DashboardStats = {
      totalUsers: Number(totalUsers),
      newUsersThisMonth: Number(newUsersThisMonth),
      userGrowthPercentage,
      activeListings: Number(activeListings),
      newListingsThisMonth: Number(newListingsThisMonth),
      listingGrowthPercentage,
      totalMessages: Number(totalMessages),
      newMessagesThisMonth: Number(newMessagesThisMonth),
      messageGrowthPercentage,
      totalLeads: Number(totalLeads),
      newLeadsThisMonth: Number(newLeadsThisMonth),
      leadGrowthPercentage,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        timestamp: new Date(activity.createdAt).toLocaleString(),
        status: activity.status,
      })),
      quickActions: {
        pendingListings: Number(pendingListings),
        newMessages: Number(unreadMessages),
        newLeads: Number(basicLeads),
      },
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
