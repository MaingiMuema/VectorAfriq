import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/lib/auth";
import { query, type DatabaseValue } from "@/lib/db";
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

interface SavedSearchBody {
  name?: string;
  criteria?: Partial<SavedSearchCriteria>;
  url?: string;
  notificationsEnabled?: boolean;
  matchCount?: number;
}

function hashUrl(url: string): string {
  return createHash("sha256").update(url.trim().toLowerCase()).digest("hex");
}

function normalizeCriteria(criteria?: Partial<SavedSearchCriteria>): SavedSearchCriteria {
  const type =
    criteria?.type === "rent" || criteria?.type === "airbnb" ? criteria.type : "sale";

  return {
    type,
    category: criteria?.category || undefined,
    location: criteria?.location || undefined,
    bedrooms: criteria?.bedrooms || undefined,
    minPrice: criteria?.minPrice || undefined,
    maxPrice: criteria?.maxPrice || undefined,
    sortBy: criteria?.sortBy || undefined,
    limit: criteria?.limit || undefined,
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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await query<SavedSearchRow>(
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
        WHERE userId = ?
        ORDER BY updatedAt DESC
      `,
      [session.user.id]
    );

    return NextResponse.json({ searches: rows.map(formatSavedSearch) });
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    return NextResponse.json(
      { error: "Unable to fetch saved searches" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SavedSearchBody;
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "Search URL is required" }, { status: 400 });
    }

    const criteria = normalizeCriteria(body.criteria);
    const id = uuidv4();
    const urlHash = hashUrl(url);
    const name = body.name?.trim() || "Saved Search";
    const notificationsEnabled = Boolean(body.notificationsEnabled);
    const matchCount = Number.isFinite(body.matchCount)
      ? Math.max(0, Number(body.matchCount))
      : 0;

    await query(
      `
        INSERT INTO saved_search (
          id, userId, name, criteria, url, urlHash,
          notificationsEnabled, matchCount, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          criteria = VALUES(criteria),
          url = VALUES(url),
          notificationsEnabled = VALUES(notificationsEnabled),
          matchCount = VALUES(matchCount),
          updatedAt = NOW(3)
      `,
      [
        id,
        session.user.id,
        name,
        JSON.stringify(criteria),
        url,
        urlHash,
        notificationsEnabled,
        matchCount,
      ] as DatabaseValue[]
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
        WHERE userId = ? AND urlHash = ?
        LIMIT 1
      `,
      [session.user.id, urlHash]
    );

    if (!savedSearch) {
      return NextResponse.json(
        { error: "Unable to load saved search" },
        { status: 500 }
      );
    }

    return NextResponse.json({ search: formatSavedSearch(savedSearch) });
  } catch (error) {
    console.error("Error saving search:", error);
    return NextResponse.json(
      { error: "Unable to save search" },
      { status: 500 }
    );
  }
}
