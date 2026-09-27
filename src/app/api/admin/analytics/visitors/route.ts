import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface VisitorStats {
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number; percentage: number }>;
  topCountries: Array<{ country: string; visitors: number; percentage: number }>;
  deviceStats: Array<{ device: string; visitors: number; percentage: number }>;
  browserStats: Array<{ browser: string; visitors: number; percentage: number }>;
  dailyVisitors: Array<{ date: string; visitors: number; uniqueVisitors: number }>;
  hourlyDistribution: Array<{ hour: number; visitors: number }>;
}

// GET - Fetch visitor statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const formattedStartDate = startDate.toISOString().split('T')[0];

    // Fetch basic visitor statistics
    const [
      [{ totalVisitors }],
      [{ uniqueVisitors }],
      [{ pageViews }],
      [{ avgSessionDuration }],
      topPages,
      topCountries,
      deviceStats,
      browserStats,
      dailyVisitors,
      hourlyDistribution,
    ] = await Promise.all([
      // Total visitors
      query<{ totalVisitors: number }>(
        "SELECT COUNT(*) as totalVisitors FROM site_visitor WHERE createdAt >= ?",
        [formattedStartDate]
      ),
      
      // Unique visitors
      query<{ uniqueVisitors: number }>(
        "SELECT COUNT(DISTINCT sessionId) as uniqueVisitors FROM site_visitor WHERE createdAt >= ?",
        [formattedStartDate]
      ),
      
      // Page views
      query<{ pageViews: number }>(
        "SELECT COUNT(*) as pageViews FROM page_view pv JOIN site_visitor sv ON pv.visitorId = sv.id WHERE sv.createdAt >= ?",
        [formattedStartDate]
      ),
      
      // Average session duration
      query<{ avgSessionDuration: number }>(
        "SELECT AVG(visitDuration) as avgSessionDuration FROM site_visitor WHERE createdAt >= ? AND visitDuration > 0",
        [formattedStartDate]
      ),
      
      // Top pages
      query<{ page: string; views: number }>(
        `SELECT sv.page, COUNT(*) as views 
         FROM site_visitor sv 
         WHERE sv.createdAt >= ? 
         GROUP BY sv.page 
         ORDER BY views DESC 
         LIMIT 10`,
        [formattedStartDate]
      ),
      
      // Top countries
      query<{ country: string; visitors: number }>(
        `SELECT country, COUNT(DISTINCT sessionId) as visitors 
         FROM site_visitor 
         WHERE createdAt >= ? AND country IS NOT NULL 
         GROUP BY country 
         ORDER BY visitors DESC 
         LIMIT 10`,
        [formattedStartDate]
      ),
      
      // Device statistics
      query<{ device: string; visitors: number }>(
        `SELECT device, COUNT(DISTINCT sessionId) as visitors 
         FROM site_visitor 
         WHERE createdAt >= ? AND device IS NOT NULL 
         GROUP BY device 
         ORDER BY visitors DESC`,
        [formattedStartDate]
      ),
      
      // Browser statistics
      query<{ browser: string; visitors: number }>(
        `SELECT browser, COUNT(DISTINCT sessionId) as visitors 
         FROM site_visitor 
         WHERE createdAt >= ? AND browser IS NOT NULL 
         GROUP BY browser 
         ORDER BY visitors DESC 
         LIMIT 10`,
        [formattedStartDate]
      ),
      
      // Daily visitors
      query<{ date: string; visitors: number; uniqueVisitors: number }>(
        `SELECT 
           DATE(createdAt) as date,
           COUNT(*) as visitors,
           COUNT(DISTINCT sessionId) as uniqueVisitors
         FROM site_visitor 
         WHERE createdAt >= ? 
         GROUP BY DATE(createdAt) 
         ORDER BY date ASC`,
        [formattedStartDate]
      ),
      
      // Hourly distribution
      query<{ hour: number; visitors: number }>(
        `SELECT 
           HOUR(createdAt) as hour,
           COUNT(*) as visitors
         FROM site_visitor 
         WHERE createdAt >= ? 
         GROUP BY HOUR(createdAt) 
         ORDER BY hour ASC`,
        [formattedStartDate]
      ),
    ]);

    // Calculate percentages for top pages
    const totalPageViews = topPages.reduce((sum, page) => sum + page.views, 0);
    const topPagesWithPercentage = topPages.map(page => ({
      ...page,
      percentage: totalPageViews > 0 ? Math.round((page.views / totalPageViews) * 100) : 0,
    }));

    // Calculate percentages for countries
    const totalCountryVisitors = topCountries.reduce((sum, country) => sum + country.visitors, 0);
    const topCountriesWithPercentage = topCountries.map(country => ({
      ...country,
      percentage: totalCountryVisitors > 0 ? Math.round((country.visitors / totalCountryVisitors) * 100) : 0,
    }));

    // Calculate percentages for devices
    const totalDeviceVisitors = deviceStats.reduce((sum, device) => sum + device.visitors, 0);
    const deviceStatsWithPercentage = deviceStats.map(device => ({
      ...device,
      percentage: totalDeviceVisitors > 0 ? Math.round((device.visitors / totalDeviceVisitors) * 100) : 0,
    }));

    // Calculate percentages for browsers
    const totalBrowserVisitors = browserStats.reduce((sum, browser) => sum + browser.visitors, 0);
    const browserStatsWithPercentage = browserStats.map(browser => ({
      ...browser,
      percentage: totalBrowserVisitors > 0 ? Math.round((browser.visitors / totalBrowserVisitors) * 100) : 0,
    }));

    // Calculate bounce rate (visitors with only one page view)
    const singlePageVisitorsResult = await query<{ singlePageVisitors: number }>(
      `SELECT COUNT(*) as singlePageVisitors FROM (
         SELECT sv.sessionId
         FROM site_visitor sv
         LEFT JOIN page_view pv ON sv.id = pv.visitorId
         WHERE sv.createdAt >= ?
         GROUP BY sv.sessionId
         HAVING COUNT(pv.id) <= 1
       ) as single_page_sessions`,
      [formattedStartDate]
    );

    const singlePageVisitors = singlePageVisitorsResult[0]?.singlePageVisitors || 0;
    const bounceRate = uniqueVisitors > 0 ? Math.round((singlePageVisitors / uniqueVisitors) * 100) : 0;

    const stats: VisitorStats = {
      totalVisitors: Number(totalVisitors),
      uniqueVisitors: Number(uniqueVisitors),
      pageViews: Number(pageViews),
      avgSessionDuration: Number(avgSessionDuration) || 0, // Keep decimal precision
      bounceRate,
      topPages: topPagesWithPercentage,
      topCountries: topCountriesWithPercentage,
      deviceStats: deviceStatsWithPercentage,
      browserStats: browserStatsWithPercentage,
      dailyVisitors: dailyVisitors.map(day => ({
        ...day,
        visitors: Number(day.visitors),
        uniqueVisitors: Number(day.uniqueVisitors),
      })),
      hourlyDistribution: hourlyDistribution.map(hour => ({
        ...hour,
        visitors: Number(hour.visitors),
      })),
    };

    return NextResponse.json({
      success: true,
      stats,
      period: {
        days,
        startDate: formattedStartDate,
        endDate: new Date().toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error("Error fetching visitor statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
