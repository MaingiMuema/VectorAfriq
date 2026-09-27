export enum PropertyCategory {
  APARTMENTS = "APARTMENTS",
  BUNGALOWS = "BUNGALOWS",
  COMMERCIAL_PLOTS = "COMMERCIAL_PLOTS",
  COMMERCIAL_PROPERTIES = "COMMERCIAL_PROPERTIES",
  DUPLEX = "DUPLEX",
  HOUSES = "HOUSES",
  MAISONETTES = "MAISONETTES",
  OFFICES = "OFFICES",
  PENTHOUSES = "PENTHOUSES",
  RESIDENTIAL_PLOTS = "RESIDENTIAL_PLOTS",
  STUDIOS = "STUDIOS",
  TOWNHOUSES = "TOWNHOUSES",
  VILLAS = "VILLAS",
}

export const ALL_PROPERTY_CATEGORIES = Object.values(
  PropertyCategory
) as PropertyCategory[];

const PRIMARY_PROPERTY_CATEGORIES: PropertyCategory[] = [
  PropertyCategory.COMMERCIAL_PLOTS,
  PropertyCategory.RESIDENTIAL_PLOTS,
  PropertyCategory.BUNGALOWS,
  PropertyCategory.APARTMENTS,
  PropertyCategory.HOUSES,
  PropertyCategory.TOWNHOUSES,
  PropertyCategory.COMMERCIAL_PROPERTIES,
];

export const LISTING_PROPERTY_CATEGORIES: PropertyCategory[] = [
  ...PRIMARY_PROPERTY_CATEGORIES,
];

export const SEARCH_PROPERTY_CATEGORIES: PropertyCategory[] = [
  ...PRIMARY_PROPERTY_CATEGORIES,
];

/** Categories allowed on the Airbnb listing page and Airbnb search results. */
export const AIRBNB_PROPERTY_CATEGORIES: PropertyCategory[] = [
  PropertyCategory.APARTMENTS,
  PropertyCategory.BUNGALOWS,
  PropertyCategory.TOWNHOUSES,
];

export const propertyCategoryDisplayNames: Record<PropertyCategory, string> = {
  [PropertyCategory.APARTMENTS]: "Apartments",
  [PropertyCategory.BUNGALOWS]: "Bungalows",
  [PropertyCategory.COMMERCIAL_PLOTS]: "Commercial Land",
  [PropertyCategory.COMMERCIAL_PROPERTIES]: "Commercial Properties",
  [PropertyCategory.DUPLEX]: "Duplex",
  [PropertyCategory.HOUSES]: "Houses",
  [PropertyCategory.MAISONETTES]: "Maisonettes",
  [PropertyCategory.OFFICES]: "Offices",
  [PropertyCategory.PENTHOUSES]: "Penthouses",
  [PropertyCategory.RESIDENTIAL_PLOTS]: "Residential Land",
  [PropertyCategory.STUDIOS]: "Studios",
  [PropertyCategory.TOWNHOUSES]: "Townhouses",
  [PropertyCategory.VILLAS]: "Villas",
};

interface PropertyFieldVisibility {
  showBedrooms: boolean;
  showBathrooms: boolean;
  showArea: boolean;
  showPlotSize: boolean;
}

interface ListingDetails {
  bedrooms: number;
  bathrooms: number;
  area: number;
  plotSize: number;
}

const DEFAULT_FIELD_VISIBILITY: PropertyFieldVisibility = {
  showBedrooms: true,
  showBathrooms: true,
  showArea: true,
  showPlotSize: false,
};

const APARTMENT_FIELD_VISIBILITY: PropertyFieldVisibility = {
  showBedrooms: true,
  showBathrooms: true,
  showArea: true,
  showPlotSize: false,
};

const HOUSE_FIELD_VISIBILITY: PropertyFieldVisibility = {
  showBedrooms: true,
  showBathrooms: true,
  showArea: true,
  showPlotSize: true,
};

const LAND_FIELD_VISIBILITY: PropertyFieldVisibility = {
  showBedrooms: false,
  showBathrooms: false,
  showArea: false,
  showPlotSize: true,
};

const COMMERCIAL_FIELD_VISIBILITY: PropertyFieldVisibility = {
  showBedrooms: false,
  showBathrooms: true,
  showArea: true,
  showPlotSize: false,
};

const LAND_CATEGORIES = new Set<PropertyCategory>([
  PropertyCategory.COMMERCIAL_PLOTS,
  PropertyCategory.RESIDENTIAL_PLOTS,
]);

const APARTMENT_STYLE_CATEGORIES = new Set<PropertyCategory>([
  PropertyCategory.APARTMENTS,
  PropertyCategory.STUDIOS,
]);

const CATEGORY_FIELD_VISIBILITY: Record<
  PropertyCategory,
  PropertyFieldVisibility
> = {
  [PropertyCategory.APARTMENTS]: APARTMENT_FIELD_VISIBILITY,
  [PropertyCategory.BUNGALOWS]: HOUSE_FIELD_VISIBILITY,
  [PropertyCategory.COMMERCIAL_PLOTS]: LAND_FIELD_VISIBILITY,
  [PropertyCategory.COMMERCIAL_PROPERTIES]: COMMERCIAL_FIELD_VISIBILITY,
  [PropertyCategory.DUPLEX]: HOUSE_FIELD_VISIBILITY,
  [PropertyCategory.HOUSES]: HOUSE_FIELD_VISIBILITY,
  [PropertyCategory.MAISONETTES]: HOUSE_FIELD_VISIBILITY,
  [PropertyCategory.OFFICES]: COMMERCIAL_FIELD_VISIBILITY,
  [PropertyCategory.PENTHOUSES]: APARTMENT_FIELD_VISIBILITY,
  [PropertyCategory.RESIDENTIAL_PLOTS]: LAND_FIELD_VISIBILITY,
  [PropertyCategory.STUDIOS]: {
    showBedrooms: false,
    showBathrooms: true,
    showArea: true,
    showPlotSize: false,
  },
  [PropertyCategory.TOWNHOUSES]: HOUSE_FIELD_VISIBILITY,
  [PropertyCategory.VILLAS]: HOUSE_FIELD_VISIBILITY,
};

function toSafeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function getPropertyFieldVisibility(
  category?: PropertyCategory | string | null
): PropertyFieldVisibility {
  if (!category) {
    return DEFAULT_FIELD_VISIBILITY;
  }

  return (
    CATEGORY_FIELD_VISIBILITY[category as PropertyCategory] ||
    DEFAULT_FIELD_VISIBILITY
  );
}

export function normalizeListingDetailsForCategory(
  category: PropertyCategory | string | null | undefined,
  details: ListingDetails
): ListingDetails {
  const visibility = getPropertyFieldVisibility(category);

  return {
    bedrooms: visibility.showBedrooms ? toSafeNumber(details.bedrooms) : 0,
    bathrooms: visibility.showBathrooms ? toSafeNumber(details.bathrooms) : 0,
    area: visibility.showArea ? toSafeNumber(details.area) : 0,
    plotSize: visibility.showPlotSize ? toSafeNumber(details.plotSize) : 0,
  };
}

export function isPlotCategory(
  category?: PropertyCategory | string | null
): boolean {
  if (!category) {
    return false;
  }

  return LAND_CATEGORIES.has(category as PropertyCategory);
}

export function isStudioCategory(
  category?: PropertyCategory | string | null
): boolean {
  return category === PropertyCategory.STUDIOS;
}

export function isApartmentStyleCategory(
  category?: PropertyCategory | string | null
): boolean {
  if (!category) {
    return false;
  }

  return APARTMENT_STYLE_CATEGORIES.has(category as PropertyCategory);
}

export function supportsBedroomFilter(
  category?: PropertyCategory | string | null
): boolean {
  if (!category) {
    return true;
  }

  if (isStudioCategory(category)) {
    return false;
  }

  return getPropertyFieldVisibility(category).showBedrooms;
}

export function supportsStudioBedroomOption(
  category?: PropertyCategory | string | null
): boolean {
  if (!category) {
    return true;
  }

  return isApartmentStyleCategory(category);
}

export function getBedroomOptions(
  category?: PropertyCategory | string | null
): Array<{ value: string; label: string }> {
  const options = [{ value: "", label: "Any bedrooms" }];

  if (supportsStudioBedroomOption(category)) {
    options.push({ value: "studio", label: "Studio" });
  }

  options.push(
    { value: "1", label: "1 Bedroom" },
    { value: "2", label: "2 Bedrooms" },
    { value: "3", label: "3 Bedrooms" },
    { value: "4", label: "4 Bedrooms" },
    { value: "5", label: "5+ Bedrooms" }
  );

  return options;
}
