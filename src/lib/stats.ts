import { query } from "@/lib/db";

export interface PropertyTypeStat {
    type: string;
    category: string;
    count: number;
}

export interface LocationStat {
    location: string;
    count: number;
}

export async function getPropertyTypeStats() {
    const sql = `
    SELECT type, category, COUNT(*) as count
    FROM property
    WHERE status = 'AVAILABLE'
    GROUP BY type, category
    ORDER BY count DESC
  `;
    return query<PropertyTypeStat>(sql);
}

export async function getPopularLocations() {
    const sql = `
    SELECT location, COUNT(*) as count
    FROM property
    WHERE status = 'AVAILABLE'
    GROUP BY location
    ORDER BY count DESC
    LIMIT 10
  `;
    return query<LocationStat>(sql);
}

export async function getPopularAgentLocations(limit = 5) {
    const sql = `
    SELECT p.location as location, COUNT(*) as count
    FROM property p
    INNER JOIN user u ON u.id = p.userId
    WHERE u.role = 'AGENT'
    GROUP BY p.location
    ORDER BY count DESC
    LIMIT ?
  `;
    return query<LocationStat>(sql, [limit]);
}
