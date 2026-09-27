import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureReviewsSchema } from "@/lib/reviewsSchema";
import { ensureSurveyorProfileSchema } from "@/lib/surveyorSchema";

interface ReviewRow {
  id: string;
  professionalId: string;
  userId: string | null;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
}

function generateId() {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReviewsSchema();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Professional ID is required" }, { status: 400 });
    }

    const reviews = await query<ReviewRow>(
      `SELECT * FROM surveyor_reviews WHERE professionalId = ? ORDER BY createdAt DESC`,
      [id]
    );

    // Calculate rating distribution
    const distribution = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars
    let totalRating = 0;
    for (const review of reviews) {
      const starIndex = Math.min(Math.max(Math.round(review.rating), 1), 5) - 1;
      distribution[starIndex]++;
      totalRating += review.rating;
    }

    return NextResponse.json({
      reviews,
      total: reviews.length,
      averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
      distribution,
    });
  } catch (error) {
    console.error("[REVIEWS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReviewsSchema();
    await ensureSurveyorProfileSchema();
    const { id: professionalId } = await params;

    if (!professionalId) {
      return NextResponse.json({ error: "Professional ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const reviewerName = String(body.reviewerName || "").trim();
    const reviewerEmail = String(body.reviewerEmail || "").trim();
    const rating = Number(body.rating);
    const title = String(body.title || "").trim() || null;
    const comment = String(body.comment || "").trim() || null;
    const userId = body.userId ? String(body.userId) : null;

    // Validate
    if (!reviewerName || reviewerName.length < 2) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!reviewerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reviewerEmail)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }
    if (!comment || comment.length < 5) {
      return NextResponse.json({ error: "Review comment is required (minimum 5 characters)" }, { status: 400 });
    }

    // Verify professional exists and is approved
    const [pro] = await query<{ id: string }>(
      "SELECT id FROM surveyor_profiles WHERE id = ? AND approvalStatus = 'APPROVED'",
      [professionalId]
    );
    if (!pro) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const id = generateId();

    await query(
      `INSERT INTO surveyor_reviews (id, professionalId, userId, reviewerName, reviewerEmail, rating, title, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, professionalId, userId, reviewerName, reviewerEmail, Math.round(rating), title, comment]
    );

    // Update professional's average rating and total reviews
    const [stats] = await query<{ avg: number; cnt: number }>(
      `SELECT AVG(rating) as avg, COUNT(*) as cnt FROM surveyor_reviews WHERE professionalId = ?`,
      [professionalId]
    );

    await query(
      `UPDATE surveyor_profiles SET averageRating = ?, totalReviews = ?, updatedAt = NOW() WHERE id = ?`,
      [Number(stats?.avg || 0), Number(stats?.cnt || 0), professionalId]
    );

    const [review] = await query<ReviewRow>(
      "SELECT * FROM surveyor_reviews WHERE id = ?",
      [id]
    );

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("[REVIEWS_POST]", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
