import { query, type DatabaseValue } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BadgeTier = "NONE" | "VERIFIED" | "TRUSTED" | "ELITE";

/** Full badge tier configuration from the agent_badge_tier table */
export interface BadgeTierConfig {
  id: string;
  tier: BadgeTier;
  name: string;
  subtitle: string | null;
  description: string | null;
  features: string[];
  price: number;
  sortOrder: number;
  isActive: boolean;
  autoAssignEnabled: boolean;
  minListings: number;
  bgGradient: string | null;
  iconColor: string | null;
  accentColor: string | null;
}

export interface AgentBadgeInfo {
  userId: string;
  badgeTier: BadgeTier;
  badgeUpdatedAt: Date | null;
  /** True when the agent qualifies for Verified but hasn't been upgraded yet */
  eligibleForVerified: boolean;
  /** Number of active listings the agent owns */
  listingCount: number;
  /** Whether the agent profile is considered "complete" */
  profileComplete: boolean;
  /** All badge tier configs */
  tiers: BadgeTierConfig[];
  /** Configurable prices from badge tiers */
  trustedPrice: number;
  elitePrice: number;
  minListings: number;
}

export interface BadgePayment {
  id: string;
  userId: string;
  badgeTier: "TRUSTED" | "ELITE";
  amount: number;
  mpesaReceipt: string | null;
  checkoutRequestId: string | null;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Profile completeness check
// ---------------------------------------------------------------------------

interface UserProfileRow {
  name: string | null;
  phone: string | null;
  avatar: string | null;
}

/**
 * A profile is considered "complete" when the agent has provided the core
 * details that buyers look for: name, phone, and avatar.
 */
export async function isProfileComplete(userId: string): Promise<boolean> {
  const [row] = await query<UserProfileRow>(
    `SELECT name, phone, avatar
     FROM user WHERE id = ?`,
    [userId]
  );

  if (!row) return false;

  const hasName = !!row.name && row.name.trim().length > 0;
  const hasPhone = !!row.phone && row.phone.trim().length > 0;
  const hasAvatar =
    !!row.avatar &&
    !row.avatar.startsWith("/images/placeholder") &&
    row.avatar.trim().length > 0;

  return hasName && hasPhone && hasAvatar;
}

// ---------------------------------------------------------------------------
// Listing count
// ---------------------------------------------------------------------------

interface CountRow {
  cnt: number;
}

export async function getActiveListingCount(userId: string): Promise<number> {
  const [row] = await query<CountRow>(
    `SELECT COUNT(*) as cnt FROM property WHERE userId = ? AND status = 'AVAILABLE'`,
    [userId]
  );
  return row?.cnt ?? 0;
}

// ---------------------------------------------------------------------------
// Badge tier configuration (from agent_badge_tier table)
// ---------------------------------------------------------------------------

interface BadgeTierRow {
  id: string;
  tier: BadgeTier;
  name: string;
  subtitle: string | null;
  description: string | null;
  features: string | null;
  price: number;
  sortOrder: number;
  isActive: boolean;
  autoAssignEnabled: boolean;
  minListings: number;
  bgGradient: string | null;
  iconColor: string | null;
  accentColor: string | null;
}

/** Parse features JSON from DB row */
function parseFeatures(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Get all badge tier configs, ordered by sortOrder */
export async function getAllBadgeTiers(): Promise<BadgeTierConfig[]> {
  const rows = await query<BadgeTierRow>(
    `SELECT * FROM agent_badge_tier ORDER BY sortOrder ASC`
  );
  return rows.map((r) => ({
    ...r,
    features: parseFeatures(r.features),
    price: Number(r.price),
  }));
}

/** Get only active badge tier configs */
export async function getActiveBadgeTiers(): Promise<BadgeTierConfig[]> {
  const rows = await query<BadgeTierRow>(
    `SELECT * FROM agent_badge_tier WHERE isActive = TRUE ORDER BY sortOrder ASC`
  );
  return rows.map((r) => ({
    ...r,
    features: parseFeatures(r.features),
    price: Number(r.price),
  }));
}

/** Get a single badge tier config by tier key */
export async function getBadgeTierByTier(
  tier: BadgeTier
): Promise<BadgeTierConfig | null> {
  const [row] = await query<BadgeTierRow>(
    `SELECT * FROM agent_badge_tier WHERE tier = ?`,
    [tier]
  );
  if (!row) return null;
  return {
    ...row,
    features: parseFeatures(row.features),
    price: Number(row.price),
  };
}

/** Get badge prices from the tier table (backward-compatible helper) */
export async function getBadgePrices() {
  const tiers = await getAllBadgeTiers();
  const verifiedTier = tiers.find((t) => t.tier === "VERIFIED");
  const trustedTier = tiers.find((t) => t.tier === "TRUSTED");
  const eliteTier = tiers.find((t) => t.tier === "ELITE");

  return {
    trustedPrice: trustedTier?.price ?? 2500,
    elitePrice: eliteTier?.price ?? 5000,
    minListings: verifiedTier?.minListings ?? 5,
  };
}

// ---------------------------------------------------------------------------
// Get full badge info for an agent
// ---------------------------------------------------------------------------

interface UserBadgeRow {
  badgeTier: BadgeTier;
  badgeUpdatedAt: Date | null;
}

export async function getAgentBadgeInfo(userId: string): Promise<AgentBadgeInfo> {
  const [userRow, listingCount, profileComplete, tiers, prices] = await Promise.all([
    query<UserBadgeRow>(
      "SELECT badgeTier, badgeUpdatedAt FROM user WHERE id = ?",
      [userId]
    ).then((r) => r[0]),
    getActiveListingCount(userId),
    isProfileComplete(userId),
    getAllBadgeTiers(),
    getBadgePrices(),
  ]);

  const currentTier: BadgeTier = userRow?.badgeTier ?? "NONE";
  const verifiedTier = tiers.find((t) => t.tier === "VERIFIED");
  const autoAssignEnabled = verifiedTier?.autoAssignEnabled ?? true;
  const minListings = verifiedTier?.minListings ?? prices.minListings;
  const eligibleForVerified =
    currentTier === "NONE" && autoAssignEnabled && profileComplete && listingCount >= minListings;

  return {
    userId,
    badgeTier: currentTier,
    badgeUpdatedAt: userRow?.badgeUpdatedAt ?? null,
    eligibleForVerified,
    listingCount,
    profileComplete,
    tiers,
    trustedPrice: prices.trustedPrice,
    elitePrice: prices.elitePrice,
    minListings,
  };
}

// ---------------------------------------------------------------------------
// Auto-assign Verified badge if eligible
// ---------------------------------------------------------------------------

/**
 * Checks if the agent is eligible for the free Verified badge and upgrades
 * them automatically.  Returns the (potentially updated) badge tier.
 *
 * This is safe to call on every request – it only writes when necessary.
 */
export async function autoAssignVerifiedBadge(userId: string): Promise<BadgeTier> {
  const info = await getAgentBadgeInfo(userId);

  if (info.eligibleForVerified) {
    await query(
      `UPDATE user SET badgeTier = 'VERIFIED', badgeUpdatedAt = NOW() WHERE id = ? AND badgeTier = 'NONE'`,
      [userId]
    );
    return "VERIFIED";
  }

  return info.badgeTier;
}

// ---------------------------------------------------------------------------
// Badge payment helpers
// ---------------------------------------------------------------------------

export async function createBadgePayment(
  userId: string,
  badgeTier: "TRUSTED" | "ELITE",
  amount: number,
  checkoutRequestId: string
): Promise<BadgePayment> {
  const id = uuidv4().replace(/-/g, "");
  await query(
    `INSERT INTO agent_badge_payment (id, userId, badgeTier, amount, checkoutRequestId, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
    [id, userId, badgeTier, amount, checkoutRequestId]
  );
  const [row] = await query<BadgePayment>(
    "SELECT * FROM agent_badge_payment WHERE id = ?",
    [id]
  );
  return row;
}

export async function completeBadgePayment(
  checkoutRequestId: string,
  mpesaReceipt: string
): Promise<BadgePayment | null> {
  const [payment] = await query<BadgePayment>(
    `SELECT * FROM agent_badge_payment WHERE checkoutRequestId = ? AND status = 'PENDING'`,
    [checkoutRequestId]
  );

  if (!payment) return null;

  // Update payment record
  await query(
    `UPDATE agent_badge_payment SET status = 'COMPLETED', mpesaReceipt = ?, updatedAt = NOW() WHERE id = ?`,
    [mpesaReceipt, payment.id]
  );

  // Upgrade the user's badge tier
  await query(
    `UPDATE user SET badgeTier = ?, badgeUpdatedAt = NOW() WHERE id = ?`,
    [payment.badgeTier, payment.userId]
  );

  return { ...payment, status: "COMPLETED", mpesaReceipt };
}

export async function failBadgePayment(
  checkoutRequestId: string,
  reason: string
): Promise<void> {
  await query(
    `UPDATE agent_badge_payment SET status = 'FAILED', mpesaReceipt = ?, updatedAt = NOW() WHERE checkoutRequestId = ? AND status = 'PENDING'`,
    [reason, checkoutRequestId]
  );
}
