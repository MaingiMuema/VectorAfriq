import { getCategoryLabel, getListingTypeLabel } from "@/lib/search/searchUrl";
import type { SearchListingType } from "@/lib/search/searchUrl";

const SAVED_SEARCHES_UPDATED_EVENT = "vectorafriq:saved-searches-updated";

export interface SavedSearchCriteria {
  type: SearchListingType;
  category?: string;
  location?: string;
  bedrooms?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  limit?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  criteria: SavedSearchCriteria;
  url: string;
  notificationsEnabled: boolean;
  lastUpdated: string;
  matchCount: number;
}

export type SavedSearchInput = Omit<
  SavedSearch,
  "id" | "lastUpdated" | "notificationsEnabled"
> & {
  id?: string;
  notificationsEnabled?: boolean;
  lastUpdated?: string;
};

export class SavedSearchAuthError extends Error {
  constructor() {
    super("Please sign in to save searches");
    this.name = "SavedSearchAuthError";
  }
}

function notifySavedSearchesUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SAVED_SEARCHES_UPDATED_EVENT));
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    throw new SavedSearchAuthError();
  }

  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : "Unable to update saved searches";
    throw new Error(message);
  }

  return data as T;
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

export function formatPriceRange(minPrice?: string, maxPrice?: string): string {
  const formatter = new Intl.NumberFormat("en-KE");
  const min = Number(minPrice);
  const max = Number(maxPrice);
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;

  if (hasMin && hasMax) {
    return `KES ${formatter.format(min)} - ${formatter.format(max)}`;
  }

  if (hasMin) {
    return `From KES ${formatter.format(min)}`;
  }

  if (hasMax) {
    return `Up to KES ${formatter.format(max)}`;
  }

  return "Any price";
}

export function getSavedSearchCriteriaText(criteria: SavedSearchCriteria): string {
  const bedroomLabel =
    criteria.bedrooms === "studio"
      ? "Studio"
      : criteria.bedrooms
        ? `${criteria.bedrooms} bed`
        : "Any beds";
  const parts = [
    getListingTypeLabel(criteria.type),
    getCategoryLabel(criteria.category),
    bedroomLabel,
    criteria.location || "Kenya",
    formatPriceRange(criteria.minPrice, criteria.maxPrice),
  ];

  return parts.join(" - ");
}

export function normalizeSavedSearch(search: SavedSearchInput): SavedSearch {
  const criteria = normalizeCriteria(search.criteria || {});

  return {
    id: search.id || search.url,
    name: search.name || getSavedSearchCriteriaText(criteria),
    criteria,
    url: search.url || "/search",
    notificationsEnabled: Boolean(search.notificationsEnabled),
    lastUpdated: search.lastUpdated || new Date().toISOString(),
    matchCount: Number(search.matchCount) || 0,
  };
}

export async function readSavedSearches(): Promise<SavedSearch[]> {
  const response = await fetch("/api/saved-searches", {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJsonResponse<{ searches: SavedSearchInput[] }>(response);

  return data.searches.map(normalizeSavedSearch);
}

export async function addSavedSearch(search: SavedSearchInput): Promise<SavedSearch> {
  const normalizedSearch = normalizeSavedSearch(search);
  const response = await fetch("/api/saved-searches", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(normalizedSearch),
  });
  const data = await parseJsonResponse<{ search: SavedSearchInput }>(response);

  notifySavedSearchesUpdated();
  return normalizeSavedSearch(data.search);
}

export async function removeSavedSearch(searchId: string): Promise<void> {
  const response = await fetch(`/api/saved-searches/${encodeURIComponent(searchId)}`, {
    method: "DELETE",
    credentials: "include",
  });

  await parseJsonResponse(response);
  notifySavedSearchesUpdated();
}

export async function toggleSavedSearch(search: SavedSearchInput): Promise<boolean> {
  const normalizedSearch = normalizeSavedSearch(search);
  const savedSearches = await readSavedSearches();
  const existingSearch = savedSearches.find((item) => item.url === normalizedSearch.url);

  if (existingSearch) {
    await removeSavedSearch(existingSearch.id);
    return false;
  }

  await addSavedSearch(normalizedSearch);
  return true;
}

export async function isSearchSaved(url: string): Promise<boolean> {
  const savedSearches = await readSavedSearches();

  return savedSearches.some((search) => search.url === url);
}

export async function toggleSavedSearchNotifications(searchId: string): Promise<SavedSearch> {
  const response = await fetch(`/api/saved-searches/${encodeURIComponent(searchId)}`, {
    method: "PATCH",
    credentials: "include",
  });
  const data = await parseJsonResponse<{ search: SavedSearchInput }>(response);

  notifySavedSearchesUpdated();
  return normalizeSavedSearch(data.search);
}

export function subscribeToSavedSearchUpdates(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(SAVED_SEARCHES_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener(SAVED_SEARCHES_UPDATED_EVENT, callback);
  };
}
