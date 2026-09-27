import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import type { SavedSearchCriteria } from "@/lib/savedSearches";

interface SavedSearchRow {
  id: string;
  name: string;
  criteria: string | SavedSearchCriteria;
  url: string;
  notificationsEnabled: number | boolean;
  lastUpdated: Date | string;
  matchCount: number;
}

function normalizeCriteria(criteria: Partial<SavedSearchCriteria>): SavedSearchCriteria {
  const type = criteria.type === "rent" || criteria.type === "airbnb" ? criteria.type : "sale";

  return {
    type,
    category: criteria.category || undefined,
    location: criteria.location || undefined,
    bedrooms: criteria.bedrooms || undefined,
    minPrice: criteria.minPrice || undefined,
    maxPrice: criteria.maxPrice || undefined,
    sortBy: criteria.sortBy || undefined,
    limit: criteria.limit || undefined,
  };
}

function formatSavedSearch(row: SavedSearchRow) {
  const criteria =
    typeof row.criteria === "string" ? JSON.parse(row.criteria) : row.criteria;

  return {
    id: row.id,
    name: row.name,
    criteria: normalizeCriteria(criteria),
    url: row.url,
    notificationsEnabled: Boolean(row.notificationsEnabled),
    lastUpdated:
      row.lastUpdated instanceof Date
        ? row.lastUpdated.toISOString()
        : new Date(row.lastUpdated).toISOString(),
    matchCount: Number(row.matchCount) || 0,
  };
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await query(
      `
        UPDATE saved_search
        SET notificationsEnabled = NOT notificationsEnabled,
            updatedAt = NOW(3)
        WHERE id = ? AND userId = ?
      `,
      [id, session.user.id]
    );

    const [savedSearch] = await query<SavedSearchRow>(
      `
        SELECT
          id,
          name,
          criteria,
          url,
          notificationsEnabled,
          updatedAt as lastUpdated,
          matchCount
        FROM saved_search
        WHERE id = ? AND userId = ?
        LIMIT 1
      `,
      [id, session.user.id]
    );

    if (!savedSearch) {
      return NextResponse.json({ error: "Saved search not found" }, { status: 404 });
    }

    return NextResponse.json({ search: formatSavedSearch(savedSearch) });
  } catch (error) {
    console.error("Error updating saved search:", error);
    return NextResponse.json(
      { error: "Unable to update saved search" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await query("DELETE FROM saved_search WHERE id = ? AND userId = ?", [
      id,
      session.user.id,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    return NextResponse.json(
      { error: "Unable to delete saved search" },
      { status: 500 }
    );
  }
}
