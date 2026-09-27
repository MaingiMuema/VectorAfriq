export interface ResolvedLocationPayload {
  type: "county" | "city" | "neighborhood";
  display: string;
  pathSegments: string[];
}

export async function resolveLocationPath(
  searchText: string
): Promise<ResolvedLocationPayload | null> {
  const query = searchText.trim();
  if (!query) {
    return null;
  }

  try {
    const response = await fetch(
      `/api/locations/resolve?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error resolving location path:", error);
    return null;
  }
}
