"use client";

export interface GuideSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  locationType: "county" | "city" | "neighborhood";
  countyName?: string;
  cityName?: string | null;
  neighborhoodName?: string | null;
}

/**
 * Toggle the published state of a neighbourhood guide.
 * Reuses the existing admin PATCH endpoint.
 */
export async function setGuidePublished(
  id: string,
  published: boolean
): Promise<GuideSummary> {
  const res = await fetch("/api/admin/neighborhood-guides", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id, published }),
  });

  if (!res.ok) {
    throw new Error("Failed to update guide status");
  }

  return res.json();
}

/**
 * Delete a neighbourhood guide.
 * Reuses the existing admin DELETE endpoint.
 */
export async function deleteGuide(id: string): Promise<void> {
  const res = await fetch(`/api/admin/neighborhood-guides?id=${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to delete guide");
  }
}

/**
 * Fetch all guides (including drafts) for admin management views.
 */
export async function fetchAllGuides(): Promise<GuideSummary[]> {
  const res = await fetch("/api/admin/neighborhood-guides?limit=200", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch guides");
  }

  const data = await res.json();
  return data.guides || [];
}
