import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface RecentSavedSearchRow {
  id: string;
  name: string;
  url: string;
  userName: string | null;
  userEmail: string | null;
  location: string | null;
  category: string | null;
  createdAt: Date | string;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    switch (range) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        // 'all' - no date filter
        startDate.setFullYear(2000);
    }

    // Format date for MySQL
    const formattedStartDate = startDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // Fetch all required statistics in parallel
    const [
      [{ totalUsers }],
      [{ newUsers }],
      usersByRole,
      [{ totalProperties }],
      [{ availableProperties }],
      propertiesByCategory,
      propertiesByStatus,
      [{ totalViews }],
      [{ totalFavorites }],
      [{ totalInquiries }],
      [{ totalSavedSearches }],
      searchesByLocation,
      searchesByCategory,
      recentSavedSearches,
    ] = await Promise.all([
      // Users statistics
      query<{ totalUsers: number }>("SELECT COUNT(*) as totalUsers FROM user"),
      query<{ newUsers: number }>(
        "SELECT COUNT(*) as newUsers FROM user WHERE createdAt >= ?",
        [formattedStartDate]
      ),
      query<{ label: string; count: number }>(
        "SELECT role as label, COUNT(*) as count FROM user GROUP BY role"
      ),

      // Properties statistics
      query<{ totalProperties: number }>(
        "SELECT COUNT(*) as totalProperties FROM property"
      ),
      query<{ availableProperties: number }>(
        "SELECT COUNT(*) as availableProperties FROM property WHERE status = ?",
        ["AVAILABLE"]
      ),
      query<{ label: string; count: number }>(
        "SELECT category as label, COUNT(*) as count FROM property GROUP BY category"
      ),
      query<{ label: string; count: number }>(
        "SELECT status as label, COUNT(*) as count FROM property GROUP BY status"
      ),

      // Interaction statistics
      // Property Views from analytics table
      query<{ totalViews: number }>(
        range === "all"
          ? "SELECT COUNT(*) as totalViews FROM property_view"
          : "SELECT COUNT(*) as totalViews FROM property_view WHERE createdAt >= ?",
        range === "all" ? [] : [formattedStartDate]
      ),
      // Favorites
      query<{ totalFavorites: number }>(
        range === "all"
          ? "SELECT COUNT(*) as totalFavorites FROM favorite"
          : "SELECT COUNT(*) as totalFavorites FROM favorite WHERE createdAt >= ?",
        range === "all" ? [] : [formattedStartDate]
      ),
      // Inquiries from lead table
      query<{ totalInquiries: number }>(
        range === "all"
          ? "SELECT COUNT(*) as totalInquiries FROM lead"
          : "SELECT COUNT(*) as totalInquiries FROM lead WHERE createdAt >= ?",
        range === "all" ? [] : [formattedStartDate]
      ),
      // Saved searches
      query<{ totalSavedSearches: number }>(
        range === "all"
          ? "SELECT COUNT(*) as totalSavedSearches FROM saved_search"
          : "SELECT COUNT(*) as totalSavedSearches FROM saved_search WHERE createdAt >= ?",
        range === "all" ? [] : [formattedStartDate]
      ),
      query<{ label: string; count: number }>(
        `
          SELECT
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(criteria, '$.location')), ''), 'Kenya') as label,
            COUNT(*) as count
          FROM saved_search
          ${range === "all" ? "" : "WHERE createdAt >= ?"}
          GROUP BY label
          ORDER BY count DESC, label ASC
          LIMIT 10
        `,
        range === "all" ? [] : [formattedStartDate]
      ),
      query<{ label: string; count: number }>(
        `
          SELECT
            COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(criteria, '$.category')), ''), 'All Categories') as label,
            COUNT(*) as count
          FROM saved_search
          ${range === "all" ? "" : "WHERE createdAt >= ?"}
          GROUP BY label
          ORDER BY count DESC, label ASC
          LIMIT 10
        `,
        range === "all" ? [] : [formattedStartDate]
      ),
      query<RecentSavedSearchRow>(
        `
          SELECT
            ss.id,
            ss.name,
            ss.url,
            u.name as userName,
            u.email as userEmail,
            JSON_UNQUOTE(JSON_EXTRACT(ss.criteria, '$.location')) as location,
            JSON_UNQUOTE(JSON_EXTRACT(ss.criteria, '$.category')) as category,
            ss.createdAt
          FROM saved_search ss
          LEFT JOIN user u ON ss.userId = u.id
          ${range === "all" ? "" : "WHERE ss.createdAt >= ?"}
          ORDER BY ss.createdAt DESC
          LIMIT 10
        `,
        range === "all" ? [] : [formattedStartDate]
      ),
    ]);

    const stats = {
      users: {
        total: Number(totalUsers),
        new: Number(newUsers),
        byRole: usersByRole.map((role) => ({
          role: role.label,
          count: Number(role.count),
        })),
      },
      properties: {
        total: Number(totalProperties),
        available: Number(availableProperties),
        byCategory: propertiesByCategory.map((category) => ({
          category: category.label,
          count: Number(category.count),
        })),
        byStatus: propertiesByStatus.map((status) => ({
          status: status.label,
          count: Number(status.count),
        })),
      },
      interactions: {
        views: Number(totalViews),
        favorites: Number(totalFavorites),
        inquiries: Number(totalInquiries),
      },
      searches: {
        total: Number(totalSavedSearches),
        byLocation: searchesByLocation.map((location) => ({
          location: location.label,
          count: Number(location.count),
        })),
        byCategory: searchesByCategory.map((category) => ({
          category: category.label,
          count: Number(category.count),
        })),
        recent: recentSavedSearches.map((search) => ({
          id: search.id,
          name: search.name,
          url: search.url,
          userName: search.userName,
          userEmail: search.userEmail,
          location: search.location || "Kenya",
          category: search.category || "All Categories",
          createdAt:
            search.createdAt instanceof Date
              ? search.createdAt.toISOString()
              : new Date(search.createdAt).toISOString(),
        })),
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
