import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SiteHealth {
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    impact: 'high' | 'medium' | 'low';
    fixable: boolean;
  }>;
  score: number;
  lastChecked: string;
}

// GET - Fetch site health data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For demo purposes, we'll return mock data
    // In a real implementation, you would run actual health checks
    const mockHealth: SiteHealth = {
      score: Math.floor(Math.random() * 30 + 70), // 70-100
      lastChecked: new Date().toISOString(),
      issues: [
        {
          type: 'warning' as const,
          category: 'Performance',
          message: 'Some images are not properly optimized and could be compressed further',
          impact: 'medium' as const,
          fixable: true,
        },
        {
          type: 'info' as const,
          category: 'SEO',
          message: 'Consider adding more descriptive meta descriptions to improve click-through rates',
          impact: 'low' as const,
          fixable: true,
        },
        {
          type: 'error' as const,
          category: 'Security',
          message: 'SSL certificate will expire in 30 days',
          impact: 'high' as const,
          fixable: true,
        },
        {
          type: 'warning' as const,
          category: 'Content',
          message: 'Some blog posts are missing alt text for images',
          impact: 'medium' as const,
          fixable: true,
        },
        {
          type: 'info' as const,
          category: 'Performance',
          message: 'Consider implementing lazy loading for below-the-fold images',
          impact: 'low' as const,
          fixable: true,
        },
      ].sort(() => 0.5 - Math.random()).slice(0, 3),
    };

    return NextResponse.json({
      success: true,
      health: mockHealth,
    });
  } catch (error) {
    console.error("Error fetching site health data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}