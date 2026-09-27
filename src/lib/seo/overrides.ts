import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import { classifyUrl, type EntityType } from "./routes";

export interface ResolvedMeta {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  noIndex?: boolean;
  source: "admin" | "agent" | "default";
}

interface PageMetaRow {
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  noIndex: number;
}

interface OverrideRow {
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogImage: string | null;
  noIndex: number;
}

/**
 * `entityId` is stored as an empty string (never NULL) for non-entity rows so the
 * `(urlPattern, entityType, entityId)` unique key actually dedupes — MySQL treats
 * every NULL in a unique index as distinct, which would defeat it for static pages.
 */
function normalizeEntityId(entityId: string | null | undefined): string {
  return entityId ?? "";
}

async function fetchResolvedMeta(
  pathname: string,
  entityType: EntityType,
  entityId: string
): Promise<ResolvedMeta | null> {
  // 1. Admin-owned page_meta always wins, keyed by exact path.
  const pageMetaRows = await query<PageMetaRow>(
    `SELECT title, description, keywords, ogTitle, ogDescription, ogImage, noIndex
     FROM page_meta WHERE path = ? AND isActive = true LIMIT 1`,
    [pathname]
  );
  const admin = pageMetaRows[0];
  if (admin && (admin.title || admin.description)) {
    return {
      title: admin.ogTitle || admin.title || undefined,
      description: admin.ogDescription || admin.description || undefined,
      keywords: admin.keywords || undefined,
      ogImage: admin.ogImage || undefined,
      noIndex: !!admin.noIndex,
      source: "admin",
    };
  }

  // 2. Agent-applied override, keyed by (urlPattern, entityType, entityId).
  const overrideRows = await query<OverrideRow>(
    `SELECT title, description, keywords, ogImage, noIndex
     FROM seo_page_override
     WHERE urlPattern = ? AND entityType = ? AND entityId = ? AND revertedAt IS NULL
     LIMIT 1`,
    [pathname, entityType, entityId]
  );
  const agentOverride = overrideRows[0];
  if (agentOverride) {
    return {
      title: agentOverride.title || undefined,
      description: agentOverride.description || undefined,
      keywords: agentOverride.keywords || undefined,
      ogImage: agentOverride.ogImage || undefined,
      noIndex: !!agentOverride.noIndex,
      source: "agent",
    };
  }

  return null;
}

/**
 * Precedence: page_meta (admin) > seo_page_override (agent) > computed default (null).
 * Never throws — a DB error returns null so the caller falls back to its own computed
 * defaults; SEO metadata must not be able to break page rendering.
 */
export async function resolvePageMeta(
  pathname: string,
  entity?: { type: string; id: string }
): Promise<ResolvedMeta | null> {
  const classified = entity
    ? { entityType: entity.type as EntityType, entityId: entity.id }
    : classifyUrl(pathname);
  const entityType = classified.entityType;
  const entityId = normalizeEntityId(classified.entityId);

  try {
    const cached = unstable_cache(
      () => fetchResolvedMeta(pathname, entityType, entityId),
      ["seo-meta", pathname, entityType, entityId],
      { tags: ["seo-meta"], revalidate: 300 }
    );
    return await cached();
  } catch (error) {
    console.error("[SEO Overrides] resolvePageMeta failed, falling back to defaults:", error);
    return null;
  }
}

export { normalizeEntityId };
