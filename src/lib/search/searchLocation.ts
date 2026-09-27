import { query } from "@/lib/db";
import {
  getPublicLocationSlug,
  normalizePathSegment,
  SearchLocationType,
} from "./searchUrl";

interface CountyRow {
  id: string;
  name: string;
  slug: string;
}

interface CityRow extends CountyRow {
  countyId: string;
  countyName: string;
  countySlug: string;
}

interface NeighborhoodRow extends CountyRow {
  cityId: string;
  cityName: string;
  citySlug: string;
  countyId: string;
  countyName: string;
  countySlug: string;
}

interface ScoredLocationMatch {
  score: number;
  specificity: number;
  primarySegmentCount: number;
  sortName: string;
  location: ResolvedSearchLocation;
}

export interface SearchLocationNode {
  id: string;
  name: string;
  slug: string;
  publicSlug: string;
  type: SearchLocationType;
}

export interface ResolvedSearchLocation {
  county: SearchLocationNode;
  city?: SearchLocationNode;
  neighborhood?: SearchLocationNode;
}

export interface SearchLocationSuggestion {
  type: SearchLocationType;
  id: string;
  name: string;
  slug: string;
  display: string;
  pathSegments: string[];
}

function getLocationSpecificity(location: ResolvedSearchLocation): number {
  if (location.neighborhood) {
    return 2;
  }

  if (location.city) {
    return 1;
  }

  return 0;
}

function formatCountyLabel(name: string): string {
  return /county$/i.test(name.trim()) ? name.trim() : `${name.trim()} County`;
}

function buildLocationDisplayName(
  location: ResolvedSearchLocation,
  options?: {
    countySuffix?: boolean;
    alwaysIncludeCounty?: boolean;
  }
): string {
  const { countySuffix = false, alwaysIncludeCounty = false } = options || {};
  const parts: string[] = [];

  if (location.neighborhood) {
    parts.push(location.neighborhood.name);
  }

  if (location.city) {
    parts.push(location.city.name);
  }

  const countyName = countySuffix
    ? formatCountyLabel(location.county.name)
    : location.county.name;
  const shouldIncludeCounty =
    alwaysIncludeCounty ||
    !location.city ||
    location.county.name !== location.city.name;

  if (shouldIncludeCounty) {
    parts.push(countyName);
  }

  return parts.join(", ");
}

function getPrimaryLocationNode(
  location: ResolvedSearchLocation
): SearchLocationNode {
  return location.neighborhood || location.city || location.county;
}

function dedupeNormalizedValues(values: Array<string | undefined>): string[] {
  return [...new Set(values.map((value) => normalizePathSegment(value || "")).filter(Boolean))];
}

function getPrimaryLocationValues(
  location: ResolvedSearchLocation
): string[] {
  const primaryNode = getPrimaryLocationNode(location);

  return dedupeNormalizedValues([
    primaryNode.publicSlug,
    primaryNode.name,
    primaryNode.type === "county" ? formatCountyLabel(primaryNode.name) : undefined,
  ]);
}

function getAllLocationValues(
  location: ResolvedSearchLocation
): string[] {
  return dedupeNormalizedValues([
    ...getPrimaryLocationValues(location),
    location.city?.publicSlug,
    location.city?.name,
    location.county.publicSlug,
    location.county.name,
    formatCountyLabel(location.county.name),
    buildLocationDisplayName(location),
    buildLocationDisplayName(location, {
      countySuffix: true,
      alwaysIncludeCounty: true,
    }),
  ]);
}

function getPrimarySegmentCount(location: ResolvedSearchLocation): number {
  const primaryNode = getPrimaryLocationNode(location);
  return normalizePathSegment(primaryNode.name).split("-").filter(Boolean).length || 1;
}

function getWholeQueryMatchStrength(
  values: string[],
  normalizedQuery: string
): number {
  if (values.some((value) => value === normalizedQuery)) {
    return 3;
  }

  if (values.some((value) => value.startsWith(normalizedQuery))) {
    return 2;
  }

  if (values.some((value) => value.includes(normalizedQuery))) {
    return 1;
  }

  return 0;
}

function countMatchedTokens(tokens: string[], values: string[]): number {
  if (tokens.length === 0 || values.length === 0) {
    return 0;
  }

  return tokens.filter((token) =>
    values.some(
      (value) =>
        value === token ||
        value.startsWith(token) ||
        value.includes(token)
    )
  ).length;
}

function getSharedBaseCityBonus(
  searchText: string,
  location: ResolvedSearchLocation
): number {
  if (!location.city) {
    return 0;
  }

  const normalizedQuery = normalizePathSegment(searchText);
  const normalizedCounty = normalizePathSegment(location.county.name);
  const normalizedCityBase = normalizePathSegment(location.city.name).replace(
    /-city$/,
    ""
  );

  if (!normalizedQuery || !normalizedCityBase || normalizedCityBase !== normalizedCounty) {
    return 0;
  }

  return normalizedCityBase.startsWith(normalizedQuery) ? 10 : 0;
}

function getLocationSearchTokens(searchText: string): string[] {
  return [...new Set(normalizePathSegment(searchText).split("-").filter(Boolean))];
}

function buildTokenMatchClause(
  expression: string,
  tokens: string[]
): { clause: string; params: string[] } {
  return {
    clause: tokens.map(() => `LOWER(${expression}) LIKE ?`).join(" AND "),
    params: tokens.map((token) => `%${token}%`),
  };
}

function buildPrimaryMatchOrderClause(
  slugExpression: string,
  nameExpression: string,
  normalizedQuery: string
): { clause: string; params: string[] } {
  return {
    clause: `
      CASE
        WHEN LOWER(${slugExpression}) = ?
          OR ${nameExpression} = ?
          THEN 0
        WHEN LOWER(${slugExpression}) LIKE ?
          OR ${nameExpression} LIKE ?
          THEN 1
        WHEN LOWER(${slugExpression}) LIKE ?
          OR ${nameExpression} LIKE ?
          THEN 2
        ELSE 3
      END
    `,
    params: [
      normalizedQuery,
      normalizedQuery,
      `${normalizedQuery}%`,
      `${normalizedQuery}%`,
      `%${normalizedQuery}%`,
      `%${normalizedQuery}%`,
    ],
  };
}

function createLocationNode(
  row: CountyRow,
  type: SearchLocationType
): SearchLocationNode {
  return {
    id: row.id,
    name: row.name.trim(),
    slug: row.slug,
    publicSlug: getPublicLocationSlug(row.slug, type),
    type,
  };
}

function mapCounty(row: CountyRow): ResolvedSearchLocation {
  return {
    county: createLocationNode(row, "county"),
  };
}

function mapCity(row: CityRow): ResolvedSearchLocation {
  return {
    county: createLocationNode(
      { id: row.countyId, name: row.countyName, slug: row.countySlug },
      "county"
    ),
    city: createLocationNode(row, "city"),
  };
}

function mapNeighborhood(row: NeighborhoodRow): ResolvedSearchLocation {
  return {
    county: createLocationNode(
      { id: row.countyId, name: row.countyName, slug: row.countySlug },
      "county"
    ),
    city: createLocationNode(
      { id: row.cityId, name: row.cityName, slug: row.citySlug },
      "city"
    ),
    neighborhood: createLocationNode(row, "neighborhood"),
  };
}

function matchesPublicSlug(
  rowSlug: string,
  type: SearchLocationType,
  publicSlug: string
): boolean {
  return getPublicLocationSlug(rowSlug, type) === publicSlug;
}

async function findCountyByPublicSlug(
  publicSlug: string
): Promise<CountyRow | null> {
  const rows = await query<CountyRow>(
    `
      SELECT id, name, slug
      FROM county
      WHERE slug = ?
         OR TRIM(TRAILING '-' FROM slug) = ?
         OR REPLACE(TRIM(TRAILING '-' FROM slug), '-county', '') = ?
    `,
    [publicSlug, publicSlug, publicSlug]
  );

  return (
    rows.find((row) => matchesPublicSlug(row.slug, "county", publicSlug)) ||
    null
  );
}

async function findCityByPublicSlug(
  publicSlug: string,
  countyPublicSlug?: string
): Promise<CityRow | null> {
  const rows = await query<CityRow>(
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.countyId,
        co.name AS countyName,
        co.slug AS countySlug
      FROM city c
      JOIN county co ON c.countyId = co.id
      WHERE c.slug = ?
         OR TRIM(TRAILING '-' FROM c.slug) = ?
    `,
    [publicSlug, publicSlug]
  );

  return (
    rows.find(
      (row) =>
        matchesPublicSlug(row.slug, "city", publicSlug) &&
        (!countyPublicSlug ||
          matchesPublicSlug(row.countySlug, "county", countyPublicSlug))
    ) || null
  );
}

async function findNeighborhoodByPublicSlug(
  publicSlug: string,
  cityPublicSlug?: string,
  countyPublicSlug?: string
): Promise<NeighborhoodRow | null> {
  const rows = await query<NeighborhoodRow>(
    `
      SELECT
        n.id,
        n.name,
        n.slug,
        n.cityId,
        c.name AS cityName,
        c.slug AS citySlug,
        n.countyId,
        co.name AS countyName,
        co.slug AS countySlug
      FROM neighborhood n
      JOIN city c ON n.cityId = c.id
      JOIN county co ON n.countyId = co.id
      WHERE n.slug = ?
         OR TRIM(TRAILING '-' FROM n.slug) = ?
    `,
    [publicSlug, publicSlug]
  );

  return (
    rows.find(
      (row) =>
        matchesPublicSlug(row.slug, "neighborhood", publicSlug) &&
        (!cityPublicSlug ||
          matchesPublicSlug(row.citySlug, "city", cityPublicSlug)) &&
        (!countyPublicSlug ||
          matchesPublicSlug(row.countySlug, "county", countyPublicSlug))
    ) || null
  );
}

async function findExactLocationCandidates(
  publicSlug: string
): Promise<ResolvedSearchLocation[]> {
  const [county, city, neighborhood] = await Promise.all([
    findCountyByPublicSlug(publicSlug),
    findCityByPublicSlug(publicSlug),
    findNeighborhoodByPublicSlug(publicSlug),
  ]);

  return [
    county ? mapCounty(county) : null,
    city ? mapCity(city) : null,
    neighborhood ? mapNeighborhood(neighborhood) : null,
  ].filter((location): location is ResolvedSearchLocation => Boolean(location));
}

function scoreLocationTextMatch(
  searchText: string,
  location: ResolvedSearchLocation
): number {
  const normalizedQuery = normalizePathSegment(searchText);
  if (!normalizedQuery) {
    return 0;
  }

  const tokens = normalizedQuery.split("-").filter(Boolean);
  const primaryValues = getPrimaryLocationValues(location);
  const allValues = getAllLocationValues(location);
  const primaryWholeQueryMatch = getWholeQueryMatchStrength(
    primaryValues,
    normalizedQuery
  );
  const allWholeQueryMatch = getWholeQueryMatchStrength(
    allValues,
    normalizedQuery
  );
  const primaryMatchedTokens = countMatchedTokens(tokens, primaryValues);
  const totalMatchedTokens = countMatchedTokens(tokens, allValues);
  const contextMatchedTokens = Math.max(0, totalMatchedTokens - primaryMatchedTokens);

  let score = 0;

  if (primaryWholeQueryMatch === 3) {
    score += 220;
  } else if (primaryWholeQueryMatch === 2) {
    score += 165;
  } else if (primaryWholeQueryMatch === 1) {
    score += 100;
  }

  if (primaryWholeQueryMatch === 0) {
    if (allWholeQueryMatch === 3) {
      score += 80;
    } else if (allWholeQueryMatch === 2) {
      score += 50;
    } else if (allWholeQueryMatch === 1) {
      score += 25;
    }
  }

  score += primaryMatchedTokens * 45;
  score += contextMatchedTokens * 12;

  if (tokens.length > 0 && totalMatchedTokens === tokens.length) {
    score += 25;
  }

  if (primaryMatchedTokens === 0 && totalMatchedTokens > 0) {
    score -= location.neighborhood ? 180 : location.city ? 110 : 0;
  }

  if (primaryMatchedTokens > 0) {
    score += location.neighborhood ? 4 : location.city ? 2 : 0;
  }

  score += getSharedBaseCityBonus(searchText, location);
  score -= Math.max(0, getPrimarySegmentCount(location) - 1) * 4;

  return score;
}

function buildScoredLocationMatch(
  searchText: string,
  location: ResolvedSearchLocation
): ScoredLocationMatch {
  const primaryNode = getPrimaryLocationNode(location);

  return {
    score: scoreLocationTextMatch(searchText, location),
    specificity: getLocationSpecificity(location),
    primarySegmentCount: getPrimarySegmentCount(location),
    sortName: normalizePathSegment(primaryNode.name),
    location,
  };
}

function compareScoredLocationMatches(
  left: ScoredLocationMatch,
  right: ScoredLocationMatch
): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (left.primarySegmentCount !== right.primarySegmentCount) {
    return left.primarySegmentCount - right.primarySegmentCount;
  }

  if (left.specificity !== right.specificity) {
    return left.specificity - right.specificity;
  }

  return left.sortName.localeCompare(right.sortName);
}

async function findCountyCandidates(searchText: string): Promise<CountyRow[]> {
  const tokens = getLocationSearchTokens(searchText);
  const normalizedQuery = normalizePathSegment(searchText);
  if (tokens.length === 0) {
    return [];
  }
  const searchableText = `CONCAT_WS(' ', name, slug, CONCAT(name, ' county'))`;
  const { clause, params } = buildTokenMatchClause(searchableText, tokens);
  const { clause: orderClause, params: orderParams } = buildPrimaryMatchOrderClause(
    "slug",
    "REPLACE(LOWER(name), ' ', '-')",
    normalizedQuery
  );

  return query<CountyRow>(
    `
      SELECT id, name, slug
      FROM county
      WHERE ${clause}
      ORDER BY ${orderClause}, name ASC
      LIMIT 16
    `,
    [...params, ...orderParams]
  );
}

async function findCityCandidates(searchText: string): Promise<CityRow[]> {
  const tokens = getLocationSearchTokens(searchText);
  const normalizedQuery = normalizePathSegment(searchText);
  if (tokens.length === 0) {
    return [];
  }
  const searchableText = `CONCAT_WS(' ', c.name, c.slug, co.name, co.slug, CONCAT(co.name, ' county'))`;
  const { clause, params } = buildTokenMatchClause(searchableText, tokens);
  const { clause: orderClause, params: orderParams } = buildPrimaryMatchOrderClause(
    "c.slug",
    "REPLACE(LOWER(c.name), ' ', '-')",
    normalizedQuery
  );

  return query<CityRow>(
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.countyId,
        co.name AS countyName,
        co.slug AS countySlug
      FROM city c
      JOIN county co ON c.countyId = co.id
      WHERE ${clause}
      ORDER BY ${orderClause}, c.name ASC
      LIMIT 16
    `,
    [...params, ...orderParams]
  );
}

async function findNeighborhoodCandidates(
  searchText: string
): Promise<NeighborhoodRow[]> {
  const tokens = getLocationSearchTokens(searchText);
  const normalizedQuery = normalizePathSegment(searchText);
  if (tokens.length === 0) {
    return [];
  }
  const searchableText = `CONCAT_WS(' ', n.name, n.slug, c.name, c.slug, co.name, co.slug, CONCAT(co.name, ' county'))`;
  const { clause, params } = buildTokenMatchClause(searchableText, tokens);
  const { clause: orderClause, params: orderParams } = buildPrimaryMatchOrderClause(
    "n.slug",
    "REPLACE(LOWER(n.name), ' ', '-')",
    normalizedQuery
  );

  return query<NeighborhoodRow>(
    `
      SELECT
        n.id,
        n.name,
        n.slug,
        n.cityId,
        c.name AS cityName,
        c.slug AS citySlug,
        n.countyId,
        co.name AS countyName,
        co.slug AS countySlug
      FROM neighborhood n
      JOIN city c ON n.cityId = c.id
      JOIN county co ON n.countyId = co.id
      WHERE ${clause}
      ORDER BY ${orderClause}, n.name ASC
      LIMIT 16
    `,
    [...params, ...orderParams]
  );
}

export async function resolveSearchLocationSegments(
  segments: string[]
): Promise<ResolvedSearchLocation | null> {
  const [first, second, third] = segments
    .map(normalizePathSegment)
    .filter(Boolean);

  if (!first) {
    return null;
  }

  if (!second) {
    const county = await findCountyByPublicSlug(first);
    if (county) {
      return mapCounty(county);
    }

    const city = await findCityByPublicSlug(first);
    if (city) {
      return mapCity(city);
    }

    const neighborhood = await findNeighborhoodByPublicSlug(first);
    if (neighborhood) {
      return mapNeighborhood(neighborhood);
    }

    return null;
  }

  const county = await findCountyByPublicSlug(first);
  if (!county) {
    return null;
  }

  if (!third) {
    const city = await findCityByPublicSlug(second, first);
    if (city) {
      return mapCity(city);
    }

    const neighborhood = await findNeighborhoodByPublicSlug(second, undefined, first);
    if (neighborhood) {
      return mapNeighborhood(neighborhood);
    }

    return null;
  }

  const city = await findCityByPublicSlug(second, first);
  if (!city) {
    return null;
  }

  const neighborhood = await findNeighborhoodByPublicSlug(third, second, first);
  return neighborhood ? mapNeighborhood(neighborhood) : null;
}

export async function resolveSearchLocationText(
  searchText: string
): Promise<ResolvedSearchLocation | null> {
  const normalizedQuery = normalizePathSegment(searchText);
  if (!normalizedQuery) {
    return null;
  }

  const exactCandidates = await findExactLocationCandidates(normalizedQuery);
  if (exactCandidates.length > 0) {
    return exactCandidates
      .map((location) => buildScoredLocationMatch(searchText, location))
      .sort(compareScoredLocationMatches)[0]?.location || null;
  }

  if (normalizedQuery.length < 3) {
    return null;
  }

  const [counties, cities, neighborhoods] = await Promise.all([
    findCountyCandidates(searchText),
    findCityCandidates(searchText),
    findNeighborhoodCandidates(searchText),
  ]);

  const candidates: ScoredLocationMatch[] = [
    ...counties.map((row) => buildScoredLocationMatch(searchText, mapCounty(row))),
    ...cities.map((row) => buildScoredLocationMatch(searchText, mapCity(row))),
    ...neighborhoods.map((row) =>
      buildScoredLocationMatch(searchText, mapNeighborhood(row))
    ),
  ]
    .filter((candidate) => candidate.score >= 20)
    .sort(compareScoredLocationMatches);

  return candidates[0]?.location || null;
}

function getLocationType(location: ResolvedSearchLocation): SearchLocationType {
  if (location.neighborhood) {
    return "neighborhood";
  }

  if (location.city) {
    return "city";
  }

  return "county";
}

function toLocationSuggestion(
  location: ResolvedSearchLocation
): SearchLocationSuggestion {
  const type = getLocationType(location);
  const node =
    (type === "neighborhood"
      ? location.neighborhood
      : type === "city"
        ? location.city
        : location.county) || location.county;

  return {
    type,
    id: node.id,
    name: node.name,
    slug: node.publicSlug,
    display: buildLocationDisplayName(location, {
      countySuffix: true,
      alwaysIncludeCounty: true,
    }),
    pathSegments: getCanonicalLocationSegments(location),
  };
}

export async function searchLocationSuggestions(
  searchText: string,
  limit = 8
): Promise<SearchLocationSuggestion[]> {
  const normalizedQuery = normalizePathSegment(searchText);
  if (!normalizedQuery) {
    return [];
  }

  const [counties, cities, neighborhoods] = await Promise.all([
    findCountyCandidates(searchText),
    findCityCandidates(searchText),
    findNeighborhoodCandidates(searchText),
  ]);

  const results = [
    ...counties.map((row) => buildScoredLocationMatch(searchText, mapCounty(row))),
    ...cities.map((row) => buildScoredLocationMatch(searchText, mapCity(row))),
    ...neighborhoods.map((row) =>
      buildScoredLocationMatch(searchText, mapNeighborhood(row))
    ),
  ]
    .filter((candidate) => candidate.score >= 20)
    .sort(compareScoredLocationMatches);

  const seen = new Set<string>();

  return results
    .map((candidate) => toLocationSuggestion(candidate.location))
    .filter((suggestion) => {
      const key = `${suggestion.type}:${suggestion.id}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function getCanonicalLocationSegments(
  location: ResolvedSearchLocation
): string[] {
  const segments = [location.county.publicSlug];

  if (location.city) {
    segments.push(location.city.publicSlug);
  }

  if (location.neighborhood) {
    segments.push(location.neighborhood.publicSlug);
  }

  return segments;
}

export function getLocationDisplayName(
  location: ResolvedSearchLocation
): string {
  return buildLocationDisplayName(location);
}

export function getLocationFilters(location: ResolvedSearchLocation): {
  county: string;
  city?: string;
  neighborhood?: string;
  location: string;
} {
  return {
    county: location.county.name,
    city: location.city?.name,
    neighborhood: location.neighborhood?.name,
    location:
      location.neighborhood?.name || location.city?.name || location.county.name,
  };
}

export async function getAllSearchLocations(): Promise<ResolvedSearchLocation[]> {
  const [counties, cities, neighborhoods] = await Promise.all([
    query<CountyRow>("SELECT id, name, slug FROM county ORDER BY name ASC"),
    query<CityRow>(
      `
        SELECT
          c.id,
          c.name,
          c.slug,
          c.countyId,
          co.name AS countyName,
          co.slug AS countySlug
        FROM city c
        JOIN county co ON c.countyId = co.id
        ORDER BY c.name ASC
      `
    ),
    query<NeighborhoodRow>(
      `
        SELECT
          n.id,
          n.name,
          n.slug,
          n.cityId,
          c.name AS cityName,
          c.slug AS citySlug,
          n.countyId,
          co.name AS countyName,
          co.slug AS countySlug
        FROM neighborhood n
        JOIN city c ON n.cityId = c.id
        JOIN county co ON n.countyId = co.id
        ORDER BY n.name ASC
      `
    ),
  ]);

  return [
    ...counties.map(mapCounty),
    ...cities.map(mapCity),
    ...neighborhoods.map(mapNeighborhood),
  ];
}
