import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface ExportData {
  exportDate: string;
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalVisitors: number;
    uniqueVisitors: number;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  breakdown: {
    topPages: Array<{ page: string; views: number }>;
    topCountries: Array<{ country: string; visitors: number }>;
    deviceStats: Array<{ device: string; visitors: number }>;
    browserStats: Array<{ browser: string; visitors: number }>;
    dailyVisitors: Array<{ date: string; visitors: number; uniqueVisitors: number }>;
    hourlyDistribution: Array<{ hour: number; visitors: number }>;
  };
  detailedData: Array<{
    sessionId: string;
    page: string;
    country: string;
    city: string;
    device: string;
    browser: string;
    os: string;
    visitDuration: number;
    createdAt: string;
  }>;
}

// GET - Export analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const format = searchParams.get("format") || "csv";
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const formattedStartDate = startDate.toISOString().split('T')[0];

    // Fetch comprehensive analytics data
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
      detailedVisitors,
    ] = await Promise.all([
      // Basic stats
      query<{ totalVisitors: number }>(
        "SELECT COUNT(*) as totalVisitors FROM site_visitor WHERE createdAt >= ?",
        [formattedStartDate]
      ),
      query<{ uniqueVisitors: number }>(
        "SELECT COUNT(DISTINCT sessionId) as uniqueVisitors FROM site_visitor WHERE createdAt >= ?",
        [formattedStartDate]
      ),
      query<{ pageViews: number }>(
        "SELECT COUNT(*) as pageViews FROM page_view pv JOIN site_visitor sv ON pv.visitorId = sv.id WHERE sv.createdAt >= ?",
        [formattedStartDate]
      ),
      query<{ avgSessionDuration: number }>(
        "SELECT AVG(visitDuration) as avgSessionDuration FROM site_visitor WHERE createdAt >= ? AND visitDuration > 0",
        [formattedStartDate]
      ),
      
      // Detailed breakdowns
      query<{ page: string; views: number }>(
        `SELECT sv.page, COUNT(*) as views 
         FROM site_visitor sv 
         WHERE sv.createdAt >= ? 
         GROUP BY sv.page 
         ORDER BY views DESC`,
        [formattedStartDate]
      ),
      query<{ country: string; visitors: number }>(
        `SELECT country, COUNT(DISTINCT sessionId) as visitors 
         FROM site_visitor 
         WHERE createdAt >= ? AND country IS NOT NULL 
         GROUP BY country 
         ORDER BY visitors DESC`,
        [formattedStartDate]
      ),
      query<{ device: string; visitors: number }>(
        `SELECT device, COUNT(DISTINCT sessionId) as visitors 
         FROM site_visitor 
         WHERE createdAt >= ? AND device IS NOT NULL 
         GROUP BY device 
         ORDER BY visitors DESC`,
        [formattedStartDate]
      ),
      query<{ browser: string; visitors: number }>(
        `SELECT browser, COUNT(DISTINCT sessionId) as visitors 
         FROM site_visitor 
         WHERE createdAt >= ? AND browser IS NOT NULL 
         GROUP BY browser 
         ORDER BY visitors DESC`,
        [formattedStartDate]
      ),
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
      
      // Detailed visitor data for comprehensive export
      query<{
        sessionId: string;
        page: string;
        country: string;
        city: string;
        device: string;
        browser: string;
        os: string;
        visitDuration: number;
        createdAt: string;
      }>(
        `SELECT sessionId, page, country, city, device, browser, os, visitDuration, createdAt
         FROM site_visitor 
         WHERE createdAt >= ? 
         ORDER BY createdAt DESC 
         LIMIT 1000`,
        [formattedStartDate]
      ),
    ]);

    // Calculate bounce rate
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

    const exportData = {
      exportDate: new Date().toISOString(),
      period: `${days} days`,
      dateRange: {
        start: formattedStartDate,
        end: new Date().toISOString().split('T')[0],
      },
      summary: {
        totalVisitors: Number(totalVisitors),
        uniqueVisitors: Number(uniqueVisitors),
        pageViews: Number(pageViews),
        avgSessionDuration: Number(avgSessionDuration) || 0, // Keep decimal precision
        bounceRate,
      },
      breakdown: {
        topPages: topPages.map(page => ({
          ...page,
          views: Number(page.views),
        })),
        topCountries: topCountries.map(country => ({
          ...country,
          visitors: Number(country.visitors),
        })),
        deviceStats: deviceStats.map(device => ({
          ...device,
          visitors: Number(device.visitors),
        })),
        browserStats: browserStats.map(browser => ({
          ...browser,
          visitors: Number(browser.visitors),
        })),
        dailyVisitors: dailyVisitors.map(day => ({
          ...day,
          visitors: Number(day.visitors),
          uniqueVisitors: Number(day.uniqueVisitors),
        })),
        hourlyDistribution: hourlyDistribution.map(hour => ({
          ...hour,
          visitors: Number(hour.visitors),
        })),
      },
      detailedData: detailedVisitors.map(visitor => ({
        ...visitor,
        visitDuration: Number(visitor.visitDuration),
      })),
    };

    if (format === 'json') {
      return NextResponse.json(exportData, {
        headers: {
          'Content-Disposition': `attachment; filename="analytics-${days}days-${new Date().toISOString().split('T')[0]}.json"`,
          'Content-Type': 'application/json',
        },
      });
    } else {
      // Generate CSV
      const csvContent = generateCSV(exportData);
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Disposition': `attachment; filename="analytics-${days}days-${new Date().toISOString().split('T')[0]}.csv"`,
          'Content-Type': 'text/csv',
        },
      });
    }

  } catch (error) {
    console.error("Error exporting analytics data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatDurationForCSV(seconds: number): string {
  // Validate input
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '0';
  }

  const totalSeconds = Math.round(seconds); // Round to nearest second
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}`;
  } else if (minutes < 60) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

function generateCSV(data: ExportData): string {
  const lines = [];
  
  // Header
  lines.push('ANALYTICS EXPORT REPORT');
  lines.push(`Export Date,${data.exportDate}`);
  lines.push(`Period,${data.period}`);
  lines.push(`Date Range,${data.dateRange.start} to ${data.dateRange.end}`);
  lines.push('');

  // Summary
  lines.push('SUMMARY STATISTICS');
  lines.push('Metric,Value');
  lines.push(`Total Visitors,${data.summary.totalVisitors}`);
  lines.push(`Unique Visitors,${data.summary.uniqueVisitors}`);
  lines.push(`Page Views,${data.summary.pageViews}`);
  lines.push(`Average Session Duration,${formatDurationForCSV(data.summary.avgSessionDuration)}`);
  lines.push(`Bounce Rate (%),${data.summary.bounceRate}`);
  lines.push('');

  // Top Pages
  lines.push('TOP PAGES');
  lines.push('Page,Views');
  data.breakdown.topPages.forEach((page) => {
    lines.push(`"${page.page}",${page.views}`);
  });
  lines.push('');

  // Countries
  lines.push('VISITOR COUNTRIES');
  lines.push('Country,Visitors');
  data.breakdown.topCountries.forEach((country) => {
    lines.push(`${country.country},${country.visitors}`);
  });
  lines.push('');

  // Devices
  lines.push('DEVICE BREAKDOWN');
  lines.push('Device,Visitors');
  data.breakdown.deviceStats.forEach((device) => {
    lines.push(`${device.device},${device.visitors}`);
  });
  lines.push('');

  // Browsers
  lines.push('BROWSER BREAKDOWN');
  lines.push('Browser,Visitors');
  data.breakdown.browserStats.forEach((browser) => {
    lines.push(`${browser.browser},${browser.visitors}`);
  });
  lines.push('');

  // Daily trends
  lines.push('DAILY VISITOR TRENDS');
  lines.push('Date,Total Visitors,Unique Visitors');
  data.breakdown.dailyVisitors.forEach((day) => {
    lines.push(`${day.date},${day.visitors},${day.uniqueVisitors}`);
  });
  lines.push('');

  // Hourly distribution
  lines.push('HOURLY DISTRIBUTION');
  lines.push('Hour,Visitors');
  data.breakdown.hourlyDistribution.forEach((hour) => {
    lines.push(`${hour.hour}:00,${hour.visitors}`);
  });
  lines.push('');

  // Detailed visitor data
  lines.push('DETAILED VISITOR DATA (Last 1000 visitors)');
  lines.push('Session ID,Page,Country,City,Device,Browser,OS,Visit Duration,Visit Date');
  data.detailedData.forEach((visitor) => {
    lines.push(`${visitor.sessionId},"${visitor.page}",${visitor.country || 'Unknown'},${visitor.city || 'Unknown'},${visitor.device || 'Unknown'},${visitor.browser || 'Unknown'},${visitor.os || 'Unknown'},${formatDurationForCSV(visitor.visitDuration)},${visitor.createdAt}`);
  });

  return lines.join('\n');
}
