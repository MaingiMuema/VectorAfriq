export interface FavoriteProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  addedDate: string;
  status: "available" | "pending" | "sold";
  url: string;
}

export interface FavoritePropertyInput {
  id: string;
}

export interface FavoritesResponse {
  properties: FavoriteProperty[];
  favoriteIds: string[];
}

export const FAVORITES_UPDATED_EVENT = "vectorafriq:favorites-updated";

function notifyFavoritesUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : "Unable to update favorites";
    throw new Error(message);
  }

  return data as T;
}

export async function fetchFavoriteProperties(): Promise<FavoritesResponse> {
  const response = await fetch("/api/favorites", {
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse<FavoritesResponse>(response);
}

export async function fetchFavoriteStatus(propertyId: string): Promise<boolean> {
  const response = await fetch(
    `/api/favorites?propertyId=${encodeURIComponent(propertyId)}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );
  const data = await parseJsonResponse<{ isFavorite: boolean }>(response);

  return data.isFavorite;
}

export async function addFavoriteProperty(
  property: FavoritePropertyInput
): Promise<void> {
  const response = await fetch("/api/favorites", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ propertyId: property.id }),
  });

  await parseJsonResponse(response);
  notifyFavoritesUpdated();
}

export async function removeFavoriteProperty(propertyId: string): Promise<void> {
  const response = await fetch(
    `/api/favorites/${encodeURIComponent(propertyId)}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  await parseJsonResponse(response);
  notifyFavoritesUpdated();
}

export async function toggleFavoriteProperty(
  property: FavoritePropertyInput,
  currentIsFavorite: boolean
): Promise<boolean> {
  if (currentIsFavorite) {
    await removeFavoriteProperty(property.id);
    return false;
  }

  await addFavoriteProperty(property);
  return true;
}

export function subscribeToFavoriteUpdates(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(FAVORITES_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener(FAVORITES_UPDATED_EVENT, callback);
  };
}
