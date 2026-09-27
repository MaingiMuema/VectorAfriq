import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface SearchConsoleData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  performanceByDate: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

// GET - Fetch Search Console data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Check if Search Console is enabled
    const [searchConsoleEnabled] = await query<{ value: string }>(
      "SELECT value FROM analytics_config WHERE `key` = 'SEARCH_CONSOLE_ENABLED'"
    );

    if (!searchConsoleEnabled || searchConsoleEnabled.value !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: "Search Console integration is not enabled. Please enable it in the configuration settings.",
          needsConfiguration: true
        },
        { status: 403 }
      );
    }

    // For demo purposes, we'll return mock data
    // In a real implementation, you would fetch this data from Google Search Console API
    const mockData: SearchConsoleData = {
      clicks: Math.floor(Math.random() * 1000) + 500,
      impressions: Math.floor(Math.random() * 10000) + 5000,
      ctr: parseFloat((Math.random() * 5 + 2).toFixed(2)),
      position: parseFloat((Math.random() * 20 + 10).toFixed(1)),
      topQueries: [
        { query: "houses for sale in nairobi", clicks: 45, impressions: 1200, ctr: 3.75, position: 12.5 },
        { query: "apartments for rent in kenya", clicks: 38, impressions: 980, ctr: 3.88, position: 15.2 },
        { query: "land for sale in kenya", clicks: 32, impressions: 850, ctr: 3.76, position: 18.7 },
        { query: "property finder kenya", clicks: 28, impressions: 720, ctr: 3.89, position: 8.3 },
        { query: "real estate kenya", clicks: 25, impressions: 650, ctr: 3.85, position: 22.1 },
      ],
      topPages: [
        { page: "/properties", clicks: 120, impressions: 3500, ctr: 3.43, position: 14.2 },
        { page: "/for-sale", clicks: 85, impressions: 2400, ctr: 3.54, position: 16.8 },
        { page: "/for-rent", clicks: 72, impressions: 2100, ctr: 3.43, position: 18.5 },
        { page: "/agents", clicks: 45, impressions: 1200, ctr: 3.75, position: 12.5 },
        { page: "/blogs", clicks: 38, impressions: 980, ctr: 3.88, position: 15.2 },
      ],
      performanceByDate: Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          clicks: Math.floor(Math.random() * 50) + 10,
          impressions: Math.floor(Math.random() * 500) + 200,
          ctr: parseFloat((Math.random() * 5 + 2).toFixed(2)),
          position: parseFloat((Math.random() * 20 + 10).toFixed(1)),
        };
      }).reverse(),
    };

    return NextResponse.json({
      success: true,
      data: mockData,
    });
  } catch (error) {
    console.error("Error fetching Search Console data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}