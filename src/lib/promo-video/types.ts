/**
 * Promo Video — shared types.
 *
 * The JobScript mirrors promo-video/src/job/script.ts (the renderer contract).
 * Duplicated deliberately so the main app and the promo-video package stay
 * decoupled.
 */

export type PromoVideoStatus =
  | "queued"
  | "claimed"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type PromoVideoFormat = "landscape" | "vertical" | "both";

// ─── JobScript (mirror of promo-video/src/job/script.ts) ─────────────────────

export type JobSceneType =
  | "intro"
  | "message"
  | "listing"
  | "services"
  | "cta"
  | "outro";

export interface JobListingItem {
  title: string;
  price?: string;
  /** Resolved image filename inside assets/images/ (e.g. "resolved/0.jpg") */
  image?: string;
  /** Search query / image prompt used to source the image */
  imageQuery?: string;
}

export interface JobServiceItem {
  title: string;
  sub: string;
  icon?: string;
  image?: string;
  imageQuery?: string;
}

export interface JobScene {
  type: JobSceneType;
  narration?: string;
  kicker?: string;
  headline?: string;
  subline?: string;
  searchQuery?: string;
  items?: JobListingItem[] | JobServiceItem[];
  button?: string;
}

export interface JobBrand {
  name: string;
  tagline: string;
  website: string;
}

export interface JobScript {
  brand: JobBrand;
  scenes: JobScene[];
  /** AI-authored art direction. Optional — omitted scripts render with the
   *  classic Warm Editorial default. */
  design?: JobDesign;
}

// ─── AI-authored design direction (mirror of promo-video/src/job/script.ts) ──

/** Surface tone of the video. All tones are built from the fixed brand palette. */
export type DesignTone = "warm" | "bold" | "minimal" | "sunset" | "midnight";
export type DesignBackground =
  | "blobs"
  | "gradient"
  | "grid"
  | "sunburst"
  | "split";
export type DesignEnergy = "calm" | "steady" | "energetic";
export type DesignWipe = "band" | "slide" | "iris" | "fade" | "none";
export type DesignAccent = "red" | "sun" | "green" | "ink";
export type DesignCase = "normal" | "uppercase" | "title";
export type DesignTexture = "film" | "paper" | "clean";
export type DesignHeadline = "accent-word" | "underline" | "mark" | "plain";
export type DesignLayout = "center" | "left" | "split";

export interface JobSceneDesign {
  layout?: DesignLayout;
  headline?: DesignHeadline;
  size?: "default" | "large" | "compact";
}

export interface JobDesign {
  /** Short art-direction title, e.g. "Bold Sunset". */
  name: string;
  /** One-line creative rationale (surfaced in the admin UI). */
  description?: string;
  tone: DesignTone;
  background: DesignBackground;
  energy: DesignEnergy;
  wipe: DesignWipe;
  accent: DesignAccent;
  case: DesignCase;
  texture: DesignTexture;
  headline: DesignHeadline;
  layout: DesignLayout;
  /** Optional per-scene-type overrides (keyed by scene type). */
  scenes?: Partial<Record<JobSceneType, Partial<JobSceneDesign>>>;
}

export interface JobTiming {
  scene: number;
  start: number;
  duration: number;
}

// ─── Asset manifest ───────────────────────────────────────────────────────────

export type AssetSource = "upload" | "pexels" | "unsplash" | "platform" | "ai" | "fallback";

export interface ResolvedAsset {
  /** Where the asset came from (shown in the admin UI). */
  source: AssetSource;
  /** What the asset was requested for, e.g. "listing[0]". */
  usedFor: string;
  /** Local filename inside the job's assets/images/resolved dir. */
  file: string;
  /** Original remote URL (when applicable). */
  url?: string;
}

// ─── DB row ───────────────────────────────────────────────────────────────────

export interface PromoVideoJob {
  id: string;
  userId: string | null;
  prompt: string;
  model: string;
  format: PromoVideoFormat;
  /** Admin-uploaded asset URLs (browser-visible /api/images/serve/... paths). */
  uploadedAssets: string[] | null;
  status: PromoVideoStatus;
  progress: number;
  step: string | null;
  script: JobScript | null;
  assets: ResolvedAsset[] | null;
  /** Output filename(s) relative to the job dir. */
  videoFile: string | null;
  videoFileVertical: string | null;
  errorMessage: string | null;
  attempts: number;
  maxAttempts: number;
  claimedAt: string | null;
  heartbeatAt: string | null;
  createdAt: string;
  completedAt: string | null;
  createdBy: string | null;
}

export const JOB_STEPS = [
  "script",
  "assets",
  "render",
  "finalize",
] as const;
export type JobStep = (typeof JOB_STEPS)[number];
