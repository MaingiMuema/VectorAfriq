import { properties } from "../data/properties";
import { Property } from "../types/property";

export async function getProperty(
  slug: string,
  id: string
): Promise<Property | null> {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Only use ID to find the property
    const property = properties.find((p) => p.id === id);
    if (!property) {
      return null;
    }

    return property;
  } catch (error) {
    console.error("Error fetching property:", error);
    return null;
  }
}

export async function getAllProperties(): Promise<Property[]> {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return properties;
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

export function generatePropertyUrl(property: Property): string {
  return `/listings/${property.slug}/${property.id}`;
}
