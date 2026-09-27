import { query, QueryResult } from "@/lib/db";
import type { County, City, Neighborhood } from "@/types/location";

// Extended types that include the nested relationships
interface ExtendedCity extends Omit<City, 'neighborhoods'> {
  county?: County;
  neighborhoods?: Neighborhood[];
}

interface ExtendedNeighborhood extends Neighborhood {
  city?: City;
  county?: County;
}


type CountyResult = QueryResult & { cities: string };
type CityResult = QueryResult & { neighborhoods: string; county: string };
type NeighborhoodResult = QueryResult & { city: string; county: string };

export async function getCounties(): Promise<County[]> {
  const counties = await query<CountyResult>(`
    SELECT c.*, 
           JSON_ARRAYAGG(
             JSON_OBJECT(
               'id', ci.id,
               'name', ci.name,
               'slug', ci.slug,
               'countyId', ci.countyId,
               'neighborhoods', (
                 SELECT JSON_ARRAYAGG(
                   JSON_OBJECT(
                     'id', n.id,
                     'name', n.name,
                     'slug', n.slug,
                     'cityId', n.cityId,
                     'countyId', n.countyId
                   )
                 )
                 FROM neighborhood n
                 WHERE n.cityId = ci.id
               )
             )
           ) as cities
    FROM county c
    LEFT JOIN city ci ON c.id = ci.countyId
    GROUP BY c.id
    ORDER BY c.name ASC
  `);

  return counties.map((county) => ({
    id: county.id as string,
    name: county.name as string,
    slug: county.slug as string,
    type: 'county' as const,
    createdAt: new Date(county.createdAt as string),
    updatedAt: new Date(county.updatedAt as string),
    cities: JSON.parse(county.cities || "[]") as City[],
  }));
}

export async function getCounty(id: string): Promise<County | null> {
  const [county] = await query<CountyResult>(
    `
    SELECT c.*, 
           JSON_ARRAYAGG(
             JSON_OBJECT(
               'id', ci.id,
               'name', ci.name,
               'slug', ci.slug,
               'countyId', ci.countyId,
               'neighborhoods', (
                 SELECT JSON_ARRAYAGG(
                   JSON_OBJECT(
                     'id', n.id,
                     'name', n.name,
                     'slug', n.slug,
                     'cityId', n.cityId,
                     'countyId', n.countyId
                   )
                 )
                 FROM neighborhood n
                 WHERE n.cityId = ci.id
               )
             )
           ) as cities
    FROM county c
    LEFT JOIN city ci ON c.id = ci.countyId
    WHERE c.id = ?
    GROUP BY c.id
  `,
    [id]
  );

  if (!county) return null;

  return {
    id: county.id as string,
    name: county.name as string,
    slug: county.slug as string,
    type: 'county' as const,
    createdAt: new Date(county.createdAt as string),
    updatedAt: new Date(county.updatedAt as string),
    cities: JSON.parse(county.cities || "[]") as City[],
  };
}

export async function createCounty(data: {
  name: string;
  slug: string;
}): Promise<County> {
  const [result] = await query<QueryResult & { insertId: string }>(
    "INSERT INTO county (name, slug) VALUES (?, ?)",
    [data.name, data.slug]
  );

  // Fetch the created county to get all fields including timestamps
  const [county] = await query(
    "SELECT id, name, slug, createdAt, updatedAt FROM county WHERE id = ?",
    [result.insertId]
  );

  return {
    id: county.id as string,
    name: county.name as string,
    slug: county.slug as string,
    type: 'county' as const,
    createdAt: new Date(county.createdAt as string),
    updatedAt: new Date(county.updatedAt as string),
  };
}

export async function updateCounty(
  id: string,
  data: { name: string; slug: string }
): Promise<County> {
  await query("UPDATE county SET name = ?, slug = ? WHERE id = ?", [
    data.name,
    data.slug,
    id,
  ]);

  // Fetch the updated county to get all fields including timestamps
  const [county] = await query(
    "SELECT id, name, slug, createdAt, updatedAt FROM county WHERE id = ?",
    [id]
  );

  return {
    id: county.id as string,
    name: county.name as string,
    slug: county.slug as string,
    type: 'county' as const,
    createdAt: new Date(county.createdAt as string),
    updatedAt: new Date(county.updatedAt as string),
  };
}

export async function deleteCounty(id: string): Promise<{ id: string }> {
  await query("DELETE FROM county WHERE id = ?", [id]);
  return { id };
}

export async function getCities(countyId?: string): Promise<ExtendedCity[]> {
  const cities = await query<CityResult>(
    `
    SELECT c.*, 
           JSON_ARRAYAGG(
             JSON_OBJECT(
               'id', n.id,
               'name', n.name,
               'slug', n.slug,
               'cityId', n.cityId,
               'countyId', n.countyId
             )
           ) as neighborhoods,
           JSON_OBJECT(
             'id', co.id,
             'name', co.name,
             'slug', co.slug
           ) as county
    FROM city c
    LEFT JOIN neighborhood n ON c.id = n.cityId
    JOIN county co ON c.countyId = co.id
    ${countyId ? "WHERE c.countyId = ?" : ""}
    GROUP BY c.id
    ORDER BY c.name ASC
  `,
    countyId ? [countyId] : []
  );

  return cities.map((city) => ({
    id: city.id as string,
    name: city.name as string,
    slug: city.slug as string,
    type: 'city' as const,
    countyId: city.county_id as string,
    createdAt: new Date(city.createdAt as string),
    updatedAt: new Date(city.updatedAt as string),
    neighborhoods: JSON.parse(city.neighborhoods || "[]") as Neighborhood[],
    county: JSON.parse(city.county) as County,
  }));
}

export async function createCity(data: {
  name: string;
  slug: string;
  countyId: string;
}): Promise<ExtendedCity> {
  const [result] = await query<QueryResult & { insertId: string }>(
    "INSERT INTO cities (name, slug, county_id) VALUES (?, ?, ?)",
    [data.name, data.slug, data.countyId]
  );

  const [city] = await query<CityResult>(
    `
    SELECT c.*, 
           JSON_OBJECT(
             'id', co.id,
             'name', co.name,
             'slug', co.slug
           ) as county
    FROM city c
    JOIN county co ON c.countyId = co.id
    WHERE c.id = ?
  `,
    [result.insertId]
  );

  return {
    id: city.id as string,
    name: city.name as string,
    slug: city.slug as string,
    type: 'city' as const,
    countyId: city.county_id as string,
    createdAt: new Date(city.createdAt as string),
    updatedAt: new Date(city.updatedAt as string),
    county: JSON.parse(city.county) as County,
  };
}

export async function updateCity(
  id: string,
  data: { name: string; slug: string; countyId: string }
): Promise<ExtendedCity> {
  await query(
    "UPDATE city SET name = ?, slug = ?, countyId = ? WHERE id = ?",
    [data.name, data.slug, data.countyId, id]
  );

  const [city] = await query<CityResult>(
    `
    SELECT c.*, 
           JSON_OBJECT(
             'id', co.id,
             'name', co.name,
             'slug', co.slug
           ) as county
    FROM city c
    JOIN county co ON c.countyId = co.id
    WHERE c.id = ?
  `,
    [id]
  );

  return {
    id: city.id as string,
    name: city.name as string,
    slug: city.slug as string,
    type: 'city' as const,
    countyId: city.countyId as string,
    createdAt: new Date(city.createdAt as string),
    updatedAt: new Date(city.updatedAt as string),
    county: JSON.parse(city.county) as County,
  };
}

export async function deleteCity(id: string): Promise<{ id: string }> {
  await query("DELETE FROM city WHERE id = ?", [id]);
  return { id };
}

export async function getNeighborhoods(
  cityId?: string
): Promise<ExtendedNeighborhood[]> {
  const neighborhoods = await query<NeighborhoodResult>(
    `
    SELECT n.*,
           JSON_OBJECT(
             'id', c.id,
             'name', c.name,
             'slug', c.slug,
             'countyId', c.countyId
           ) as city,
           JSON_OBJECT(
             'id', co.id,
             'name', co.name,
             'slug', co.slug
           ) as county
    FROM neighborhood n
    JOIN city c ON n.cityId = c.id
    JOIN county co ON n.countyId = co.id
    ${cityId ? "WHERE n.cityId = ?" : ""}
    ORDER BY n.name ASC
  `,
    cityId ? [cityId] : []
  );

  return neighborhoods.map((neighborhood) => ({
    id: neighborhood.id as string,
    name: neighborhood.name as string,
    slug: neighborhood.slug as string,
    type: 'neighborhood' as const,
    cityId: neighborhood.city_id as string,
    countyId: neighborhood.county_id as string,
    createdAt: new Date(neighborhood.createdAt as string),
    updatedAt: new Date(neighborhood.updatedAt as string),
    city: JSON.parse(neighborhood.city) as City,
    county: JSON.parse(neighborhood.county) as County,
  }));
}

export async function createNeighborhood(data: {
  name: string;
  slug: string;
  cityId: string;
  countyId: string;
}): Promise<ExtendedNeighborhood> {
  const [result] = await query<QueryResult & { insertId: string }>(
    "INSERT INTO neighborhoods (name, slug, city_id, county_id) VALUES (?, ?, ?, ?)",
    [data.name, data.slug, data.cityId, data.countyId]
  );

  const [neighborhood] = await query<NeighborhoodResult>(
    `
    SELECT n.*,
           JSON_OBJECT(
             'id', c.id,
             'name', c.name,
             'slug', c.slug,
             'countyId', c.countyId
           ) as city,
           JSON_OBJECT(
             'id', co.id,
             'name', co.name,
             'slug', co.slug
           ) as county
    FROM neighborhood n
    JOIN city c ON n.cityId = c.id
    JOIN county co ON n.countyId = co.id
    WHERE n.id = ?
  `,
    [result.insertId]
  );

  return {
    id: neighborhood.id as string,
    name: neighborhood.name as string,
    slug: neighborhood.slug as string,
    type: 'neighborhood' as const,
    cityId: neighborhood.city_id as string,
    countyId: neighborhood.county_id as string,
    createdAt: new Date(neighborhood.createdAt as string),
    updatedAt: new Date(neighborhood.updatedAt as string),
    city: JSON.parse(neighborhood.city) as City,
    county: JSON.parse(neighborhood.county) as County,
  };
}

export async function updateNeighborhood(
  id: string,
  data: { name: string; slug: string; cityId: string; countyId: string }
): Promise<ExtendedNeighborhood> {
  await query(
    "UPDATE neighborhood SET name = ?, slug = ?, cityId = ?, countyId = ? WHERE id = ?",
    [data.name, data.slug, data.cityId, data.countyId, id]
  );

  const [neighborhood] = await query<NeighborhoodResult>(
    `
    SELECT n.*,
           JSON_OBJECT(
             'id', c.id,
             'name', c.name,
             'slug', c.slug,
             'countyId', c.countyId
           ) as city,
           JSON_OBJECT(
             'id', co.id,
             'name', co.name,
             'slug', co.slug
           ) as county
    FROM neighborhood n
    JOIN city c ON n.cityId = c.id
    JOIN county co ON n.countyId = co.id
    WHERE n.id = ?
  `,
    [id]
  );

  return {
    id: neighborhood.id as string,
    name: neighborhood.name as string,
    slug: neighborhood.slug as string,
    type: 'neighborhood' as const,
    cityId: neighborhood.cityId as string,
    countyId: neighborhood.countyId as string,
    createdAt: new Date(neighborhood.createdAt as string),
    updatedAt: new Date(neighborhood.updatedAt as string),
    city: JSON.parse(neighborhood.city) as City,
    county: JSON.parse(neighborhood.county) as County,
  };
}

export async function deleteNeighborhood(id: string): Promise<{ id: string }> {
  await query("DELETE FROM neighborhood WHERE id = ?", [id]);
  return { id };
}

interface SearchResult {
  counties: County[];
  cities: City[];
  neighborhoods: Neighborhood[];
}

export async function searchLocations(
  searchQuery: string
): Promise<SearchResult> {
  const pattern = `%${searchQuery}%`;

  const [counties, citiesRaw, neighborhoodsRaw] = await Promise.all([
    query<County>("SELECT * FROM county WHERE name LIKE ?", [pattern]),
    query<CityResult>(
      `SELECT c.*,
        JSON_OBJECT(
          'id', co.id,
          'name', co.name,
          'slug', co.slug
        ) as county
       FROM city c
       JOIN county co ON c.countyId = co.id
       WHERE c.name LIKE ?`,
      [pattern]
    ),
    query<NeighborhoodResult>(
      `SELECT n.*,
        JSON_OBJECT(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'countyId', c.countyId
        ) as city,
        JSON_OBJECT(
          'id', co.id,
          'name', co.name,
          'slug', co.slug
        ) as county
       FROM neighborhood n
       JOIN city c ON n.cityId = c.id
       JOIN county co ON n.countyId = co.id
       WHERE n.name LIKE ?`,
      [pattern]
    ),
  ]);

  const cities = citiesRaw.map((city) => ({
    id: city.id as string,
    name: city.name as string,
    slug: city.slug as string,
    type: 'city' as const,
    countyId: city.county_id as string,
    createdAt: new Date(city.createdAt as string),
    updatedAt: new Date(city.updatedAt as string),
    county: JSON.parse(city.county) as County,
  }));

  const neighborhoods = neighborhoodsRaw.map((neighborhood) => ({
    id: neighborhood.id as string,
    name: neighborhood.name as string,
    slug: neighborhood.slug as string,
    type: 'neighborhood' as const,
    cityId: neighborhood.city_id as string,
    countyId: neighborhood.county_id as string,
    createdAt: new Date(neighborhood.createdAt as string),
    updatedAt: new Date(neighborhood.updatedAt as string),
    city: JSON.parse(neighborhood.city) as City,
    county: JSON.parse(neighborhood.county) as County,
  }));

  return { counties, cities, neighborhoods };
}
