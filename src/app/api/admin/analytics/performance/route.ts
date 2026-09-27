import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  overallScore: number;
  recommendations: string[];
}

// GET - Fetch performance metrics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For demo purposes, we'll return mock data
    // In a real implementation, you would fetch this data from Google PageSpeed Insights API or similar
    const mockMetrics: PerformanceMetrics = {
      lcp: parseFloat((Math.random() * 2 + 1.5).toFixed(1)), // 1.5-3.5s
      fid: Math.floor(Math.random() * 150 + 50), // 50-200ms
      cls: parseFloat((Math.random() * 0.2 + 0.05).toFixed(3)), // 0.05-0.25
      fcp: parseFloat((Math.random() * 1.5 + 0.8).toFixed(1)), // 0.8-2.3s
      ttfb: Math.floor(Math.random() * 800 + 200), // 200-1000ms
      overallScore: Math.floor(Math.random() * 40 + 60), // 60-100
      recommendations: [
        "Optimize images to reduce their file size without sacrificing quality",
        "Minimize render-blocking resources to improve page load speed",
        "Reduce server response time (TTFB) by optimizing database queries",
        "Implement lazy loading for images and iframes that are below the fold",
        "Enable text compression to reduce the size of text-based resources",
        "Eliminate render-blocking JavaScript and CSS in above-the-fold content",
        "Properly size images to save mobile data and improve load time",
        "Use efficient cache policies to serve static resources",
        "Avoid multiple page redirects to speed up page loading",
        "Preload key requests to improve loading performance",
      ].sort(() => 0.5 - Math.random()).slice(0, 5),
    };

    return NextResponse.json({
      success: true,
      metrics: mockMetrics,
    });
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}