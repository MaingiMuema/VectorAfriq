import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface TrackingData {
  sessionId: string;
  page: string;
  title?: string;
  referrer?: string;
  userAgent?: string;
  loadTime?: number;
  scrollDepth?: number;
  timeOnPage?: number;
  exitPage?: boolean;
}

// Helper function to parse user agent
function parseUserAgent(userAgent: string) {
  const device = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'Mobile' : 'Desktop';
  
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';
  
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return { device, browser, os };
}

// Helper function to get IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || 'unknown';
}

// Helper function to get location from IP (simplified)
async function getLocationFromIP() {
  try {
    // In production, you would use a service like ipapi.co, ipgeolocation.io, etc.
    // For now, return default values
    return {
      country: 'Kenya',
      city: 'Nairobi'
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return {
      country: 'Unknown',
      city: 'Unknown'
    };
  }
}

// POST - Track visitor data
export async function POST(request: NextRequest) {
  try {
    // Check if visitor tracking is enabled
    const [config] = await query<{ value: string }>(
      "SELECT value FROM analytics_config WHERE `key` = 'VISITOR_TRACKING_ENABLED'"
    );
    
    if (config?.value !== 'true') {
      return NextResponse.json({ success: false, message: 'Tracking disabled' });
    }

    const body: TrackingData = await request.json();
    const { sessionId, page, title, referrer, userAgent, loadTime, scrollDepth, timeOnPage, exitPage } = body;

    if (!sessionId || !page) {
      return NextResponse.json(
        { error: "Session ID and page are required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    
    const clientIP = getClientIP(request);
    const ua = userAgent || request.headers.get('user-agent') || '';
    const { device, browser, os } = parseUserAgent(ua);
    const { country, city } = await getLocationFromIP();

    // Check if this is a unique visitor for this session
    const [existingVisitor] = await query<{ id: string }>(
      "SELECT id FROM site_visitor WHERE sessionId = ? LIMIT 1",
      [sessionId]
    );

    let visitorId: string;

    if (!existingVisitor) {
      // Create new visitor record
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await query(
        `INSERT INTO site_visitor (
          id, sessionId, ipAddress, userAgent, referrer, page,
          country, city, device, browser, os, isUnique, userId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          visitorId,
          sessionId,
          clientIP,
          ua,
          referrer || null,
          page,
          country,
          city,
          device,
          browser,
          os,
          true, // First visit for this session is unique
          userId
        ]
      );
    } else {
      visitorId = existingVisitor.id;
      
      // Update visitor with latest page and duration
      await query(
        `UPDATE site_visitor 
         SET page = ?, visitDuration = COALESCE(visitDuration, 0) + ?, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE id = ?`,
        [page, timeOnPage || 0, visitorId]
      );
    }

    // Sanitize numeric values to prevent out-of-range errors
    const safeLoadTime = (typeof loadTime === 'number' && isFinite(loadTime) && loadTime >= 0) 
      ? Math.min(loadTime, 60000) // Cap at 60 seconds max
      : 0;
    const safeScrollDepth = (typeof scrollDepth === 'number' && isFinite(scrollDepth) && scrollDepth >= 0)
      ? Math.min(Math.max(scrollDepth, 0), 100) // Clamp to 0-100
      : 0;
    const safeTimeOnPage = (typeof timeOnPage === 'number' && isFinite(timeOnPage) && timeOnPage >= 0)
      ? Math.min(timeOnPage, 86400000) // Cap at 24 hours max
      : 0;

    // Record page view
    await query(
      `INSERT INTO page_view (
        id, visitorId, page, title, loadTime, scrollDepth, timeOnPage, exitPage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `pageview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        visitorId,
        page,
        title || null,
        safeLoadTime,
        safeScrollDepth,
        safeTimeOnPage,
        exitPage || false
      ]
    );

    // If this is a property page, track property view
    const propertyMatch = page.match(/\/properties\/([^\/\?]+)/);
    if (propertyMatch) {
      const propertyId = propertyMatch[1];
      
      // Check if property view tracking is enabled
      const [propertyConfig] = await query<{ value: string }>(
        "SELECT value FROM analytics_config WHERE `key` = 'PROPERTY_VIEW_TRACKING_ENABLED'"
      );
      
      if (propertyConfig?.value === 'true') {
        await query(
          `INSERT INTO property_view (id, propertyId, visitorId, viewDuration, source)
           VALUES (?, ?, ?, ?, ?)`,
          [
            `propview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            propertyId,
            visitorId,
            timeOnPage || 0,
            referrer || 'direct'
          ]
        );
      }
    }

    return NextResponse.json({
      success: true,
      visitorId,
      message: 'Tracking data recorded successfully'
    });

  } catch (error) {
    console.error("Error tracking visitor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get tracking configuration for frontend
export async function GET() {
  try {
    const configs = await query<{ key: string; value: string; isActive: boolean }>(
      `SELECT \`key\`, value, isActive 
       FROM analytics_config 
       WHERE \`key\` IN ('VISITOR_TRACKING_ENABLED', 'GOOGLE_ANALYTICS_ENABLED', 'GOOGLE_ANALYTICS_ID')
       AND isActive = true`
    );

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      success: true,
      config: {
        visitorTrackingEnabled: configMap.VISITOR_TRACKING_ENABLED === 'true',
        googleAnalyticsEnabled: configMap.GOOGLE_ANALYTICS_ENABLED === 'true',
        googleAnalyticsId: configMap.GOOGLE_ANALYTICS_ID || '',
      }
    });

  } catch (error) {
    console.error("Error fetching tracking config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
