import React from "react";

/**
 * Job script types — the JSON contract between the admin promo-video pipeline
 * (which asks an OpenRouter model to write the script and resolves image
 * assets) and this Remotion composition.
 *
 * Every scene has a narration line (TTS), so the render pipeline can lay the
 * scenes out sequentially with audio. Image fields hold the filename resolved
 * by the asset pipeline, relative to the bundled public dir (assets/images/).
 */

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
  /** Resolved image filename inside assets/images/ (e.g. "listing/0.jpg") */
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
  /** Narration line — rendered to speech by scripts/render-job.mjs */
  narration?: string;
  kicker?: string;
  headline?: string;
  subline?: string;
  /** Placeholder text shown in the search bar of a "listing" scene */
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

/** Per-scene timing produced by scripts/render-job.mjs (one entry per scene). */
export interface JobTiming {
  scene: number;
  start: number;
  duration: number;
}

export interface JobVideoProps {
  script: JobScript;
  schedule: JobTiming[];
  durationInFrames: number;
}

// ─── AI-authored design direction ─────────────────────────────────────────────

/** Surface tone of the video. All tones are built from the fixed brand palette. */
export type DesignTone = "warm" | "bold" | "minimal" | "sunset" | "midnight";
/** Background treatment behind every scene. */
export type DesignBackground =
  | "blobs"
  | "gradient"
  | "grid"
  | "sunburst"
  | "split";
/** Motion energy: fade/spring intensities across the video. */
export type DesignEnergy = "calm" | "steady" | "energetic";
/** Transition style between scenes. */
export type DesignWipe = "band" | "slide" | "iris" | "fade" | "none";
/** Which brand accent dominates buttons, chips, rules and glows. */
export type DesignAccent = "red" | "sun" | "green" | "ink";
/** Text case applied to display copy (headlines, brand names). */
export type DesignCase = "normal" | "uppercase" | "title";
/** Film grain / texture level. */
export type DesignTexture = "film" | "paper" | "clean";
/** How headlines are emphasized. */
export type DesignHeadline = "accent-word" | "underline" | "mark" | "plain";
/** Content layout for a scene. */
export type DesignLayout = "center" | "left" | "split";

/** Per-scene-type design overrides. */
export interface JobSceneDesign {
  layout?: DesignLayout;
  headline?: DesignHeadline;
  size?: "default" | "large" | "compact";
}

/**
 * AI-authored art direction for the video. The model picks from a constrained
 * vocabulary — every value maps to an implemented variant in the renderer, and
 * all colors are derived at render time from the fixed brand palette, so the
 * model never supplies hex values and a render can never break on a bad color.
 */
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

const JobScriptContext = React.createContext<JobScript | null>(null);

export const JobScriptProvider = JobScriptContext.Provider;

/** Returns the active job script, or null when rendering the hardcoded promo. */
export function useJobScript(): JobScript | null {
  return React.useContext(JobScriptContext);
}

/** Returns the active design direction, or null when none is provided. */
export function useJobDesign(): JobDesign | null {
  const script = useJobScript();
  return script?.design ?? null;
}
