import React from "react";
import {
  useJobDesign,
  type JobDesign,
  type JobSceneDesign,
  type DesignTone,
  type DesignAccent,
  type DesignLayout,
  type DesignHeadline,
} from "./job/script";

/**
 * Fixed VectorAfriq brand palette — the ONLY colors the video ever uses.
 * The AI authors design by picking tone/accent *roles*; the actual hex values
 * are derived here at render time, so every video stays on-brand no matter
 * what the prompt asks for.
 */
export const COLORS = {
  // paper / surfaces
  paper: "#f6efe3",
  paperDeep: "#ecdfcc",
  card: "#fffdf8",
  white: "#ffffff",

  // ink (warm near-black)
  ink: "#241a0f",
  inkSoft: "#4c3f2e",
  textDim: "rgba(36,26,15,0.62)",
  textFaint: "rgba(36,26,15,0.42)",
  line: "rgba(36,26,15,0.12)",

  // accents
  red: "#e6374f",
  redSoft: "#f06a7c",
  redDeep: "#b91c33",
  sun: "#f2a03d",
  sunSoft: "#f9c97a",
  green: "#2f9e77",
  // hue-consistent shades of the brand accents
  greenSoft: "#5cb995",
  greenDeep: "#1e7a5a",
  sunDeep: "#c97b1f",
};

export const FONTS = { sans: "Inter", display: "Playfair Display" };
export const ease = [0.16, 1, 0.3, 1] as const;

// ─── Design system ───────────────────────────────────────────────────────────

/** The concrete color set a scene draws from, derived from the brand palette. */
export interface Palette {
  surface: string;
  surfaceDeep: string;
  card: string;
  ink: string;
  inkSoft: string;
  textDim: string;
  textFaint: string;
  line: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
  onAccent: string;
  /** RGB triplet (no alpha) for building rgba() glows, e.g. "242,160,61". */
  glow: string;
  shadow: string;
  gradientA: string;
  gradientB: string;
  vignette: string;
}

interface ToneSpec {
  surface: string;
  surfaceDeep: string;
  card: string;
  ink: string;
  inkSoft: string;
  textDim: string;
  textFaint: string;
  line: string;
  shadow: string;
  gradientA: string;
  gradientB: string;
  vignette: string;
}

const TONES: Record<DesignTone, ToneSpec> = {
  // cream paper + ink — the classic VectorAfriq look
  warm: {
    surface: COLORS.paper,
    surfaceDeep: COLORS.paperDeep,
    card: COLORS.card,
    ink: COLORS.ink,
    inkSoft: COLORS.inkSoft,
    textDim: "rgba(36,26,15,0.62)",
    textFaint: "rgba(36,26,15,0.42)",
    line: "rgba(36,26,15,0.12)",
    shadow: "rgba(88,60,25,0.28)",
    gradientA: COLORS.paper,
    gradientB: COLORS.paperDeep,
    vignette: "rgba(88,56,18,0.22)",
  },
  // white surfaces, high contrast, punchy shadows
  bold: {
    surface: COLORS.white,
    surfaceDeep: COLORS.paper,
    card: COLORS.white,
    ink: COLORS.ink,
    inkSoft: COLORS.inkSoft,
    textDim: "rgba(36,26,15,0.62)",
    textFaint: "rgba(36,26,15,0.42)",
    line: "rgba(36,26,15,0.12)",
    shadow: "rgba(88,60,25,0.30)",
    gradientA: COLORS.white,
    gradientB: COLORS.paper,
    vignette: "rgba(88,56,18,0.18)",
  },
  // clean cream, restrained ink accent, quiet shadows
  minimal: {
    surface: "#faf7f0",
    surfaceDeep: "#f1ebe0",
    card: COLORS.white,
    ink: COLORS.ink,
    inkSoft: COLORS.inkSoft,
    textDim: "rgba(36,26,15,0.60)",
    textFaint: "rgba(36,26,15,0.40)",
    line: "rgba(36,26,15,0.10)",
    shadow: "rgba(36,26,15,0.16)",
    gradientA: "#faf7f0",
    gradientB: "#f1ebe0",
    vignette: "rgba(36,26,15,0.10)",
  },
  // amber-dominant warmth
  sunset: {
    surface: "#f3e6cf",
    surfaceDeep: "#ecd9b8",
    card: "#fffaf0",
    ink: COLORS.ink,
    inkSoft: COLORS.inkSoft,
    textDim: "rgba(36,26,15,0.62)",
    textFaint: "rgba(36,26,15,0.42)",
    line: "rgba(36,26,15,0.12)",
    shadow: "rgba(140,90,20,0.25)",
    gradientA: "#f3e6cf",
    gradientB: "#ecd9b8",
    vignette: "rgba(140,80,20,0.18)",
  },
  // inverted: ink surfaces, cream text (the CTA mood throughout)
  midnight: {
    surface: COLORS.ink,
    surfaceDeep: "#3a2c1a",
    card: "#3a2c1a",
    ink: COLORS.paper,
    inkSoft: COLORS.paperDeep,
    textDim: "rgba(246,239,227,0.66)",
    textFaint: "rgba(246,239,227,0.46)",
    line: "rgba(246,239,227,0.14)",
    shadow: "rgba(0,0,0,0.5)",
    gradientA: COLORS.ink,
    gradientB: "#3a2c1a",
    vignette: "rgba(0,0,0,0.35)",
  },
};

interface AccentSpec {
  accent: string;
  accentSoft: string;
  accentDeep: string;
  onAccent: string;
  glow: string;
}

const ACCENTS: Record<DesignAccent, AccentSpec> = {
  red: {
    accent: COLORS.red,
    accentSoft: COLORS.redSoft,
    accentDeep: COLORS.redDeep,
    onAccent: COLORS.white,
    glow: "230,55,79",
  },
  sun: {
    accent: COLORS.sun,
    accentSoft: COLORS.sunSoft,
    accentDeep: COLORS.sunDeep,
    onAccent: COLORS.ink,
    glow: "242,160,61",
  },
  green: {
    accent: COLORS.green,
    accentSoft: COLORS.greenSoft,
    accentDeep: COLORS.greenDeep,
    onAccent: COLORS.white,
    glow: "47,158,119",
  },
  ink: {
    accent: COLORS.ink,
    accentSoft: COLORS.inkSoft,
    accentDeep: COLORS.ink,
    onAccent: COLORS.paper,
    glow: "36,26,15",
  },
};

/** The art direction used when a script carries no design (backwards-compatible). */
export const DEFAULT_DESIGN: JobDesign = {
  name: "Warm Editorial",
  description:
    "Cream paper, serif display type and the signature brand-red accent — the classic VectorAfriq look.",
  tone: "warm",
  background: "blobs",
  energy: "steady",
  wipe: "band",
  accent: "red",
  case: "normal",
  texture: "film",
  headline: "accent-word",
  layout: "center",
};

/** Derive the concrete palette for a design (falls back to the warm default). */
export function derivePalette(design?: Partial<JobDesign> | null): Palette {
  const tone: DesignTone =
    design?.tone && design.tone in TONES ? design.tone : "warm";
  const accent: DesignAccent =
    design?.accent && design.accent in ACCENTS ? design.accent : "red";
  const t = TONES[tone];
  const a = ACCENTS[accent];
  return {
    surface: t.surface,
    surfaceDeep: t.surfaceDeep,
    card: t.card,
    ink: t.ink,
    inkSoft: t.inkSoft,
    textDim: t.textDim,
    textFaint: t.textFaint,
    line: t.line,
    accent: a.accent,
    accentSoft: a.accentSoft,
    accentDeep: a.accentDeep,
    onAccent: a.onAccent,
    glow: a.glow,
    shadow: t.shadow,
    gradientA: t.gradientA,
    gradientB: t.gradientB,
    vignette: t.vignette,
  };
}

/** The derived palette for the active design (warm default when none is set). */
export function usePalette(): Palette {
  const design = useJobDesign();
  return React.useMemo(() => derivePalette(design ?? undefined), [design]);
}

/** Apply the design's text-case preference to display copy. */
export function applyCase(text: string, design?: JobDesign | null): string {
  const c = design?.case ?? "normal";
  if (c === "uppercase") return text.toUpperCase();
  if (c === "title") return text.replace(/\b\w/g, (ch) => ch.toUpperCase());
  return text;
}

/** Resolved per-scene design (global defaults merged with scene-type overrides). */
export function sceneDesign(
  design: JobDesign | null | undefined,
  sceneType: string
): {
  layout: DesignLayout;
  headline: DesignHeadline;
  size: "default" | "large" | "compact";
} {
  const d = design ?? DEFAULT_DESIGN;
  const sceneOverrides = d.scenes as
    | Record<string, Partial<JobSceneDesign>>
    | undefined;
  const overrides = sceneOverrides?.[sceneType] ?? {};
  return {
    layout: overrides.layout ?? d.layout,
    headline: overrides.headline ?? d.headline,
    size: overrides.size ?? "default",
  };
}
