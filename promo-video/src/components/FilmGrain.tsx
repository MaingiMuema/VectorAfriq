import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useJobDesign } from "../job/script";

const GRAIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/></filter><rect width="240" height="240" filter="url(%23n)" opacity="0.9"/></svg>`
);

/** Film grain, intensity follows the design's texture role. */
export const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const design = useJobDesign();
  const texture = design?.texture ?? "film";
  if (texture === "clean") return null;
  const base = texture === "paper" ? 0.045 : 0.028;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: base + 0.012 * Math.sin(frame * 0.63),
        mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,${GRAIN_SVG}")`,
      }}
    />
  );
};
