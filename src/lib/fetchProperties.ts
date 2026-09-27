import { processPropertyData } from "./processPropertyData";

interface FetchPropertiesOptions {
  category?: string;
  type?: "SALE" | "RENT";
  featured?: boolean;
}

export async function fetchProperties({
  category,
  type = "SALE",
  featured = false,
}: FetchPropertiesOptions = {}) {
  try {
    // Check if we're in a build environment
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      // During build time, return empty data to avoid build errors
      return processPropertyData({
        properties: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 6,
        },
        stats: {},
      });
    }

    // Build query string
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (type) params.append("type", type);
    if (featured) params.append("featured", "true");

    const queryString = params.toString();
    const url = `/api/properties${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      next: {
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch properties: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return processPropertyData(data);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return processPropertyData({
      properties: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 6,
      },
      stats: {},
    });
  }
}
