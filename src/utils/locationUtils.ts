/**
 * Normalize location string for consistent matching
 * Converts to lowercase and replaces spaces with hyphens
 */
export function normalizeLocation(location: string): string {
  return location.toLowerCase().replace(/\s+/g, '-').trim();
}

/**
 * Format location for display (capitalize first letter of each word)
 */
export function formatLocationForDisplay(location: string): string {
  return location
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get banner location priority list for fallback matching
 * Returns an array of locations to try in order of preference
 */
export function getBannerLocationPriority(location: string): string[] {
  const normalized = normalizeLocation(location);
  
  return [
    normalized,           // Exact match first
    'search-results',     // General search results fallback
    'properties-listing', // Properties listing fallback
    'property-search'     // Property search fallback
  ];
}
