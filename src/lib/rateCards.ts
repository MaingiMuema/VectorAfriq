import { query, type DatabaseValue } from "@/lib/db";

export type RateCardTierSlug = "SILVER" | "GOLD" | "PLATINUM";
export type BillingCycle = "MONTHLY" | "ANNUAL";
export type SubscriptionStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

/** Admin-selectable listing quotas for agents */
export const LISTING_QUOTA_OPTIONS = [
  5, 15, 30, 60, 100, 150, 200, 400, 1000,
] as const;

export type ListingQuotaOption = (typeof LISTING_QUOTA_OPTIONS)[number];

export interface RateCardTier {
  id: string;
  slug: RateCardTierSlug;
  name: string;
  subtitle: string | null;
  description: string | null;
  features: string[];
  visibilityPercent: number;
  sortOrder: number;
  isActive: boolean;
  bgGradient: string | null;
  accentColor: string | null;
  plans?: RateCardPlan[];
}

export interface RateCardPlan {
  id: string;
  tierId: string;
  name: string;
  listingLimit: number;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  sortOrder: number;
  isActive: boolean;
  tierSlug?: RateCardTierSlug;
  tierName?: string;
}

export interface RateCardPaymentSettings {
  tillNumber: string;
  tillName: string;
  instructions: string;
}

export interface AgentListingStatus {
  listingQuota: number;
  listingCount: number;
  remaining: number;
  rateCardTier: string;
  rateCardExpiresAt: Date | null;
  canCreateListing: boolean;
  isExpired: boolean;
}

interface TierRow {
  id: string;
  slug: RateCardTierSlug;
  name: string;
  subtitle: string | null;
  description: string | null;
  features: string | string[] | null;
  visibilityPercent: number;
  sortOrder: number;
  isActive: number | boolean;
  bgGradient: string | null;
  accentColor: string | null;
}

interface PlanRow {
  id: string;
  tierId: string;
  name: string;
  listingLimit: number;
  monthlyPrice: number | string;
  annualPrice: number | string;
  features: string | string[] | null;
  sortOrder: number;
  isActive: number | boolean;
  tierSlug?: RateCardTierSlug;
  tierName?: string;
}

function parseFeatures(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function mapTier(row: TierRow): RateCardTier {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    features: parseFeatures(row.features),
    visibilityPercent: Number(row.visibilityPercent) || 0,
    sortOrder: Number(row.sortOrder) || 0,
    isActive: Boolean(row.isActive),
    bgGradient: row.bgGradient,
    accentColor: row.accentColor,
  };
}

function mapPlan(row: PlanRow): RateCardPlan {
  return {
    id: row.id,
    tierId: row.tierId,
    name: row.name,
    listingLimit: Number(row.listingLimit),
    monthlyPrice: Number(row.monthlyPrice),
    annualPrice: Number(row.annualPrice),
    features: parseFeatures(row.features),
    sortOrder: Number(row.sortOrder) || 0,
    isActive: Boolean(row.isActive),
    tierSlug: row.tierSlug,
    tierName: row.tierName,
  };
}

export async function getRateCardTiers(options?: {
  activeOnly?: boolean;
  includePlans?: boolean;
}): Promise<RateCardTier[]> {
  const activeOnly = options?.activeOnly ?? false;
  const includePlans = options?.includePlans ?? true;

  const tiers = await query<TierRow>(
    `SELECT * FROM rate_card_tier
     ${activeOnly ? "WHERE isActive = 1" : ""}
     ORDER BY sortOrder ASC`
  );

  const mapped = tiers.map(mapTier);

  if (!includePlans || mapped.length === 0) {
    return mapped;
  }

  const plans = await query<PlanRow>(
    `SELECT p.*, t.slug as tierSlug, t.name as tierName
     FROM rate_card_plan p
     JOIN rate_card_tier t ON t.id = p.tierId
     ${activeOnly ? "WHERE p.isActive = 1 AND t.isActive = 1" : ""}
     ORDER BY t.sortOrder ASC, p.sortOrder ASC, p.listingLimit ASC`
  );

  const byTier = new Map<string, RateCardPlan[]>();
  for (const plan of plans.map(mapPlan)) {
    const list = byTier.get(plan.tierId) || [];
    list.push(plan);
    byTier.set(plan.tierId, list);
  }

  return mapped.map((tier) => ({
    ...tier,
    plans: byTier.get(tier.id) || [],
  }));
}

export async function getRateCardPlanById(
  planId: string
): Promise<RateCardPlan | null> {
  const [row] = await query<PlanRow>(
    `SELECT p.*, t.slug as tierSlug, t.name as tierName
     FROM rate_card_plan p
     JOIN rate_card_tier t ON t.id = p.tierId
     WHERE p.id = ?`,
    [planId]
  );
  return row ? mapPlan(row) : null;
}

export async function getPaymentSettings(): Promise<RateCardPaymentSettings> {
  const rows = await query<{ key: string; value: string }>(
    `SELECT \`key\`, value FROM systemsetting
     WHERE \`key\` IN ('RATE_CARD_TILL_NUMBER','RATE_CARD_TILL_NAME','RATE_CARD_PAYMENT_INSTRUCTIONS')`
  );

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    tillNumber:
      map.RATE_CARD_TILL_NUMBER ||
      process.env.MPESA_SHORTCODE ||
      "174379",
    tillName: map.RATE_CARD_TILL_NAME || "VectorAfriq Kenya",
    instructions:
      map.RATE_CARD_PAYMENT_INSTRUCTIONS ||
      "Pay via M-Pesa using the till number below, then upload your payment confirmation screenshot.",
  };
}

export async function updatePaymentSettings(
  settings: Partial<RateCardPaymentSettings>
): Promise<void> {
  const pairs: [string, string][] = [];
  if (settings.tillNumber !== undefined) {
    pairs.push(["RATE_CARD_TILL_NUMBER", settings.tillNumber]);
  }
  if (settings.tillName !== undefined) {
    pairs.push(["RATE_CARD_TILL_NAME", settings.tillName]);
  }
  if (settings.instructions !== undefined) {
    pairs.push(["RATE_CARD_PAYMENT_INSTRUCTIONS", settings.instructions]);
  }

  for (const [key, value] of pairs) {
    const [existing] = await query<{ id: string }>(
      `SELECT id FROM systemsetting WHERE \`key\` = ?`,
      [key]
    );
    if (existing) {
      await query(
        `UPDATE systemsetting SET value = ?, updatedAt = NOW() WHERE \`key\` = ?`,
        [value, key]
      );
    } else {
      const id = `setting_${key.toLowerCase()}`;
      await query(
        `INSERT INTO systemsetting (id, \`key\`, value, type, category, description, createdAt, updatedAt)
         VALUES (?, ?, ?, 'STRING', 'Rate Cards', ?, NOW(), NOW())`,
        [id, key, value, key]
      );
    }
  }
}

const DEFAULT_LISTING_QUOTA_KEY = "DEFAULT_LISTING_QUOTA";
const FALLBACK_DEFAULT_LISTING_QUOTA = 5;

/** Global default listing quota granted to new / free-tier users. */
export async function getDefaultListingQuota(): Promise<number> {
  const [row] = await query<{ value: string }>(
    `SELECT value FROM systemsetting WHERE \`key\` = ?`,
    [DEFAULT_LISTING_QUOTA_KEY]
  );
  const parsed = row ? Number(row.value) : NaN;
  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : FALLBACK_DEFAULT_LISTING_QUOTA;
}

export async function updateDefaultListingQuota(quota: number): Promise<void> {
  const value = String(quota);
  const [existing] = await query<{ id: string }>(
    `SELECT id FROM systemsetting WHERE \`key\` = ?`,
    [DEFAULT_LISTING_QUOTA_KEY]
  );
  if (existing) {
    await query(
      `UPDATE systemsetting SET value = ?, updatedAt = NOW() WHERE \`key\` = ?`,
      [value, DEFAULT_LISTING_QUOTA_KEY]
    );
  } else {
    await query(
      `INSERT INTO systemsetting (id, \`key\`, value, type, category, description, createdAt, updatedAt)
       VALUES ('setting_default_listing_quota', ?, ?, 'NUMBER', 'Users', 'Default listing quota granted to new users and free-tier agents', NOW(), NOW())`,
      [DEFAULT_LISTING_QUOTA_KEY, value]
    );
  }
}

/** Bulk-apply a quota to every user currently on the free tier (no paid rate card). */
export async function applyListingQuotaToFreeTierUsers(
  quota: number
): Promise<number> {
  // mysql2's execute() returns a single ResultSetHeader (not an array) for
  // UPDATE statements; query() forwards it through its generic T[] typing.
  const result = (await query(
    `UPDATE user SET listingQuota = ?, updatedAt = NOW()
     WHERE rateCardTier IS NULL OR rateCardTier = 'NONE'`,
    [quota]
  )) as unknown as { affectedRows: number };
  return result.affectedRows ?? 0;
}

export async function getFreeTierUserCount(): Promise<number> {
  const [row] = await query<{ count: number }>(
    `SELECT COUNT(*) as count FROM user WHERE rateCardTier IS NULL OR rateCardTier = 'NONE'`
  );
  return Number(row?.count || 0);
}

export async function getAgentListingStatus(
  userId: string
): Promise<AgentListingStatus | null> {
  const [user] = await query<{
    listingQuota: number;
    rateCardTier: string;
    rateCardExpiresAt: Date | null;
    role: string;
  }>(
    `SELECT listingQuota, rateCardTier, rateCardExpiresAt, role FROM user WHERE id = ?`,
    [userId]
  );

  if (!user) return null;

  const [countRow] = await query<{ count: number }>(
    `SELECT COUNT(*) as count FROM property WHERE userId = ?`,
    [userId]
  );

  const listingCount = Number(countRow?.count || 0);
  const listingQuota = Number(user.listingQuota ?? 5);
  const isExpired = Boolean(
    user.rateCardExpiresAt && new Date(user.rateCardExpiresAt) < new Date()
  );

  // Admins always allowed; expired paid tier still keeps admin-set quota
  const canCreateListing =
    user.role === "ADMIN" || listingCount < listingQuota;

  return {
    listingQuota,
    listingCount,
    remaining: Math.max(0, listingQuota - listingCount),
    rateCardTier: user.rateCardTier || "NONE",
    rateCardExpiresAt: user.rateCardExpiresAt
      ? new Date(user.rateCardExpiresAt)
      : null,
    canCreateListing,
    isExpired,
  };
}

/**
 * Build visibility weights from active tiers (defaults to 50/30/20).
 */
export async function getVisibilityWeights(): Promise<
  Record<RateCardTierSlug | "NONE", number>
> {
  try {
    const tiers = await getRateCardTiers({ activeOnly: true, includePlans: false });
    const weights: Record<string, number> = {
      PLATINUM: 50,
      GOLD: 30,
      SILVER: 20,
      NONE: 0,
    };
    for (const tier of tiers) {
      weights[tier.slug] = Math.max(0, Number(tier.visibilityPercent) || 0);
    }
    return weights as Record<RateCardTierSlug | "NONE", number>;
  } catch {
    return { PLATINUM: 50, GOLD: 30, SILVER: 20, NONE: 0 };
  }
}

/**
 * Interleave properties so each page roughly matches tier visibility percentages.
 * Properties without a paid tier fill remaining slots.
 */
export function interleaveByRateCardTier<
  T extends { rateCardTier?: string | null },
>(
  items: T[],
  limit: number,
  page: number,
  weights: Record<string, number>
): T[] {
  if (items.length === 0 || limit < 1) return [];

  const buckets: Record<string, T[]> = {
    PLATINUM: [],
    GOLD: [],
    SILVER: [],
    NONE: [],
  };

  for (const item of items) {
    const tier = (item.rateCardTier || "NONE").toUpperCase();
    if (tier === "PLATINUM" || tier === "GOLD" || tier === "SILVER") {
      buckets[tier].push(item);
    } else {
      buckets.NONE.push(item);
    }
  }

  const pPct = weights.PLATINUM ?? 50;
  const gPct = weights.GOLD ?? 30;
  const sPct = weights.SILVER ?? 20;
  const totalPct = Math.max(1, pPct + gPct + sPct);

  const pSlots = Math.round((limit * pPct) / totalPct);
  const gSlots = Math.round((limit * gPct) / totalPct);
  const sSlots = Math.max(0, limit - pSlots - gSlots);

  // Page offsets per bucket (approximate)
  const start = (page - 1) * limit;
  // Global interleaved stream approach for stable pagination
  const stream: T[] = [];
  const pointers: Record<string, number> = {
    PLATINUM: 0,
    GOLD: 0,
    SILVER: 0,
    NONE: 0,
  };

  const takeFrom = (key: keyof typeof buckets) => {
    if (pointers[key] < buckets[key].length) {
      stream.push(buckets[key][pointers[key]++]);
      return true;
    }
    return false;
  };

  // Build enough stream items for this page (+ a little buffer)
  const needed = page * limit;
  while (stream.length < needed) {
    let added = false;
    for (let i = 0; i < pSlots; i++) {
      if (stream.length >= needed) break;
      if (takeFrom("PLATINUM")) added = true;
      else if (takeFrom("GOLD")) added = true;
      else if (takeFrom("SILVER")) added = true;
      else if (takeFrom("NONE")) added = true;
    }
    for (let i = 0; i < gSlots; i++) {
      if (stream.length >= needed) break;
      if (takeFrom("GOLD")) added = true;
      else if (takeFrom("PLATINUM")) added = true;
      else if (takeFrom("SILVER")) added = true;
      else if (takeFrom("NONE")) added = true;
    }
    for (let i = 0; i < sSlots; i++) {
      if (stream.length >= needed) break;
      if (takeFrom("SILVER")) added = true;
      else if (takeFrom("GOLD")) added = true;
      else if (takeFrom("PLATINUM")) added = true;
      else if (takeFrom("NONE")) added = true;
    }
    // Drain remaining if pattern couldn't fill
    if (!added) {
      if (
        !takeFrom("PLATINUM") &&
        !takeFrom("GOLD") &&
        !takeFrom("SILVER") &&
        !takeFrom("NONE")
      ) {
        break;
      }
    }
  }

  return stream.slice(start, start + limit);
}

export function planAmount(
  plan: RateCardPlan,
  cycle: BillingCycle
): number {
  return cycle === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice;
}

export function subscriptionPeriod(cycle: BillingCycle): {
  startsAt: Date;
  expiresAt: Date;
} {
  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  if (cycle === "ANNUAL") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  return { startsAt, expiresAt };
}

export async function approveSubscription(params: {
  subscriptionId: string;
  adminId: string;
  adminNotes?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const [sub] = await query<{
    id: string;
    userId: string;
    planId: string;
    tierSlug: RateCardTierSlug;
    billingCycle: BillingCycle;
    listingLimit: number;
    status: string;
  }>(`SELECT * FROM rate_card_subscription WHERE id = ?`, [
    params.subscriptionId,
  ]);

  if (!sub) return { ok: false, error: "Subscription not found" };
  if (sub.status !== "PENDING") {
    return { ok: false, error: "Only pending payments can be approved" };
  }

  const { startsAt, expiresAt } = subscriptionPeriod(sub.billingCycle);

  await query(
    `UPDATE rate_card_subscription
     SET status = 'APPROVED', reviewedBy = ?, reviewedAt = NOW(),
         adminNotes = ?, startsAt = ?, expiresAt = ?, updatedAt = NOW()
     WHERE id = ?`,
    [
      params.adminId,
      params.adminNotes || null,
      startsAt,
      expiresAt,
      params.subscriptionId,
    ]
  );

  // Grant tier + quota (use the higher of plan limit and current quota)
  const [user] = await query<{ listingQuota: number }>(
    `SELECT listingQuota FROM user WHERE id = ?`,
    [sub.userId]
  );
  const nextQuota = Math.max(
    Number(user?.listingQuota || 0),
    Number(sub.listingLimit)
  );

  await query(
    `UPDATE user SET
       rateCardTier = ?,
       listingQuota = ?,
       rateCardPlanId = ?,
       rateCardExpiresAt = ?,
       updatedAt = NOW()
     WHERE id = ?`,
    [sub.tierSlug, nextQuota, sub.planId, expiresAt, sub.userId]
  );

  return { ok: true };
}

export async function rejectSubscription(params: {
  subscriptionId: string;
  adminId: string;
  adminNotes?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const [sub] = await query<{ status: string }>(
    `SELECT status FROM rate_card_subscription WHERE id = ?`,
    [params.subscriptionId]
  );
  if (!sub) return { ok: false, error: "Subscription not found" };
  if (sub.status !== "PENDING") {
    return { ok: false, error: "Only pending payments can be rejected" };
  }

  await query(
    `UPDATE rate_card_subscription
     SET status = 'REJECTED', reviewedBy = ?, reviewedAt = NOW(),
         adminNotes = ?, updatedAt = NOW()
     WHERE id = ?`,
    [params.adminId, params.adminNotes || null, params.subscriptionId]
  );

  return { ok: true };
}

/** Safe dynamic update helper */
export function buildUpdateSet(
  allowed: string[],
  updates: Record<string, unknown>
): { setClause: string; values: DatabaseValue[] } {
  const sets: string[] = [];
  const values: DatabaseValue[] = [];

  for (const key of allowed) {
    if (updates[key] === undefined) continue;
    let value = updates[key] as DatabaseValue | string[] | object;
    if (key === "features" && typeof value !== "string") {
      value = JSON.stringify(value ?? []);
    }
    if (typeof value === "boolean") {
      value = value ? 1 : 0;
    }
    sets.push(`\`${key}\` = ?`);
    values.push(value as DatabaseValue);
  }

  return {
    setClause: sets.length ? sets.join(", ") + ", updatedAt = NOW()" : "",
    values,
  };
}
