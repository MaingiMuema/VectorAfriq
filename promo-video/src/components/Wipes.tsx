import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { useJobDesign } from "../job/script";
import { usePalette } from "../theme";

/**
 * Design-driven scene transition. The style comes from the AI-authored design
 * (band / slide / iris / fade / none); colors come from the derived palette so
 * transitions always sit on the brand.
 */
export const Wipe: React.FC = () => {
  const frame = useCurrentFrame();
  const design = useJobDesign();
  const palette = usePalette();
  const style = design?.wipe ?? "band";

  const p = interpolate(frame, [0, 20], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: "clamp",
  });
  const x = interpolate(p, [0, 1], [1.5, -1.6]);

  if (style === "none") return null;

  if (style === "iris") {
    const r = interpolate(p, [0, 1], [0, 2800]);
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `circle(${r}px at 50% 50%)`,
            background: `linear-gradient(160deg, ${palette.surfaceDeep} 0%, ${palette.surface} 100%)`,
            opacity: interpolate(frame, [0, 4, 14, 20], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `circle(${r}px at 50% 50%)`,
            boxShadow: `inset 0 0 140px ${palette.accent}33`,
          }}
        />
      </AbsoluteFill>
    );
  }

  if (style === "slide") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "100%",
            background: `linear-gradient(180deg, ${palette.surface} 0%, ${palette.accentSoft}2E 50%, ${palette.surface} 100%)`,
            transform: `translateX(${x * 100}%)`,
            opacity: interpolate(frame, [0, 3, 12, 20], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      </AbsoluteFill>
    );
  }

  if (style === "fade") {
    return (
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: palette.surfaceDeep,
          opacity: interpolate(frame, [0, 5, 13, 20], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    );
  }

  // band — the editorial page-turn (dark on light tones, light on dark tones)
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "100%",
          background: `linear-gradient(105deg, ${palette.ink} 0%, ${palette.inkSoft} 55%, ${palette.ink} 100%)`,
          transform: `translateX(${x * 100}%) skewX(-14deg)`,
          opacity: interpolate(frame, [0, 5, 20], [0, 1, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "10%",
          background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)`,
          transform: `translateX(${x * 100 - 8}%) skewX(-14deg)`,
          mixBlendMode: "screen",
          opacity: interpolate(frame, [2, 12, 20], [0, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};

export const Wipes: React.FC<{ boundaries: number[] }> = ({ boundaries }) => (
  <>
    {boundaries.map((b, i) => (
      <Sequence key={i} from={b - 3} durationInFrames={23}>
        <Wipe />
      </Sequence>
    ))}
  </>
);
