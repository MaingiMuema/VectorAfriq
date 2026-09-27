import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { pop } from "../components/motion";
import { useJobScript } from "../job/script";
import { FONTS, usePalette } from "../theme";

const SLAM = { damping: 12, mass: 0.9, stiffness: 160 };

// The dark espresso moment — deliberate contrast after the light scenes.
export const CTAScene: React.FC<{ index?: number }> = ({ index = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const script = useJobScript();
  const palette = usePalette();
  const scene = script?.scenes[index];

  const headline = scene?.headline ?? "STOP SCROLLING.";
  const subline = scene?.subline ?? "START LIVING.";
  const button = scene?.button ?? "Find your home \u2192";
  const website = script?.brand.website ?? "vectorafriqproperties.co.ke";

  const pulse = 1 + Math.sin(frame / 30 * Math.PI * 2) * 0.03;
  const a = pop(frame, fps, 6, SLAM);
  const b = pop(frame, fps, 18, SLAM);
  const c = pop(frame, fps, 34, { damping: 14, mass: 0.8, stiffness: 150 });

  const scaleFor = (text: string, v: number): number => {
    const base = text.length > 16 ? 0.62 : text.length > 12 ? 0.75 : 1;
    return (0.7 + v * 0.3) * base;
  };

  return (
    <SceneShell>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile("images/house1.jpg")}
          style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", objectFit: "cover", filter: "blur(14px) brightness(0.4) saturate(1.1)" }}
        />
        <AbsoluteFill
          style={{
            background: `linear-gradient(160deg, ${palette.surface}CC 0%, ${palette.surfaceDeep}8C 55%, ${palette.accent}52 100%)`,
          }}
        />
        {/* accent glow */}
        <div
          style={{
            position: "absolute",
            right: -240,
            top: -260,
            width: 900,
            height: 900,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${palette.glow},0.35) 0%, transparent 62%)`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 148,
              color: "#ffffff",
              lineHeight: 1,
              opacity: a,
              transform: `scale(${scaleFor(headline, a)}) rotate(${(1 - a) * 4}deg)`,
              textShadow: "0 24px 70px rgba(0,0,0,0.55)",
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 148,
              lineHeight: 1.08,
              color: palette.accentSoft,
              fontStyle: "italic",
              opacity: b,
              transform: `scale(${scaleFor(subline, b)}) rotate(${(1 - b) * -4}deg)`,
              textShadow: `0 24px 70px rgba(${palette.glow},0.35)`,
            }}
          >
            {subline}
          </div>
          <div style={{ marginTop: 56 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 18,
                background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentDeep})`,
                padding: "24px 54px",
                borderRadius: 999,
                fontFamily: FONTS.sans,
                fontWeight: 800,
                fontSize: 34,
                color: palette.onAccent,
                letterSpacing: 2,
                boxShadow: `0 24px 60px ${palette.accent}73`,
                opacity: c,
                transform: `scale(${pulse * (0.8 + c * 0.2)})`,
              }}
            >
              {button}
            </div>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 24,
                color: "rgba(255,253,248,0.85)",
                marginTop: 26,
                letterSpacing: 3,
                fontWeight: 600,
                opacity: interpolate(frame, [48, 62], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              {website}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
