import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useJobDesign } from "../job/script";
import { usePalette, type Palette } from "../theme";

// Tiny floating "sun dust" motes.
const MOTES = Array.from({ length: 26 }, (_, i) => {
  const seed = (i * 4001) % 9973;
  return {
    x: (seed * 0.618) % 1,
    y: (seed * 0.381) % 1,
    r: 1.6 + (seed % 22) / 8,
    speed: 0.004 + ((seed * 0.013) % 0.016),
    drift: (seed % 2 === 0 ? 1 : -1) * (0.003 + ((seed * 0.017) % 0.005)),
  };
});

const RINGS = Array.from({ length: 9 }, (_, i) => ({
  r: 200 + i * 190,
  opacity: 0.05 + (i % 3) * 0.025,
}));

const Blobs: React.FC<{ palette: Palette; t: number }> = ({ palette, t }) => {
  const blobs = [
    { x: 0.08, y: 0.12, r: 900, color: `rgba(${palette.glow},0.30)`, sx: 0.2, sy: 0.16, phase: 0 },
    { x: 0.92, y: 0.28, r: 820, color: `${palette.accentSoft}26`, sx: 0.16, sy: 0.2, phase: 2.1 },
    { x: 0.5, y: 1.02, r: 1000, color: `rgba(${palette.glow},0.34)`, sx: 0.12, sy: 0.1, phase: 4.2 },
    { x: 0.2, y: 0.82, r: 640, color: `${palette.accentSoft}1A`, sx: 0.18, sy: 0.14, phase: 1.1 },
  ];
  return (
    <>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: b.r,
            height: b.r,
            borderRadius: "50%",
            left: `${b.x * 100}%`,
            top: `${b.y * 100}%`,
            marginLeft: -b.r / 2,
            marginTop: -b.r / 2,
            background: `radial-gradient(circle, ${b.color} 0%, transparent 62%)`,
            transform: `translate(${Math.sin(t * b.sx + b.phase) * 46}px, ${Math.cos(t * b.sy + b.phase) * 34}px)`,
          }}
        />
      ))}
    </>
  );
};

const GradientWash: React.FC<{ palette: Palette; t: number }> = ({ palette, t }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: "-15%",
        top: "-25%",
        width: 900,
        height: 900,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${palette.accentSoft}2E 0%, transparent 62%)`,
        transform: `translate(${Math.sin(t * 0.1) * 60}px, ${Math.cos(t * 0.14) * 40}px)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        right: "-10%",
        top: "20%",
        width: 1000,
        height: 1000,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${palette.glow},0.28) 0%, transparent 62%)`,
        transform: `translate(${Math.cos(t * 0.12) * 50}px, ${Math.sin(t * 0.1) * 46}px)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "25%",
        bottom: "-30%",
        width: 1100,
        height: 1100,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${palette.accentSoft}1F 0%, transparent 60%)`,
        transform: `translate(${Math.sin(t * 0.08 + 2) * 55}px, ${Math.cos(t * 0.11 + 2) * 35}px)`,
      }}
    />
  </>
);

const Grid: React.FC<{ palette: Palette }> = ({ palette }) => (
  <>
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.5,
        backgroundImage: `linear-gradient(${palette.line} 1px, transparent 1px), linear-gradient(90deg, ${palette.line} 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "10%",
        top: "-30%",
        width: 900,
        height: 900,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${palette.accentSoft}30 0%, transparent 60%)`,
      }}
    />
  </>
);

const Sunburst: React.FC<{ palette: Palette; t: number }> = ({ palette, t }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "42%",
        width: 1600,
        height: 1600,
        marginLeft: -800,
        marginTop: -800,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${palette.glow},0.32) 0%, transparent 58%)`,
        transform: `scale(${1 + Math.sin(t * 0.2) * 0.02})`,
      }}
    />
    {RINGS.map((r, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: r.r,
          height: r.r,
          marginLeft: -r.r / 2,
          marginTop: -r.r / 2,
          borderRadius: "50%",
          border: `1.5px solid ${palette.accent}`,
          opacity: r.opacity,
          transform: `rotate(${t * (6 + i * 2)}deg)`,
        }}
      />
    ))}
  </>
);

const Split: React.FC<{ palette: Palette; t: number }> = ({ palette, t }) => (
  <>
    <div
      style={{
        position: "absolute",
        top: "-10%",
        bottom: "-10%",
        left: 0,
        width: "46%",
        background: `linear-gradient(160deg, ${palette.accentSoft}1F 0%, transparent 100%)`,
        transform: `translateX(${Math.sin(t * 0.08) * 20}px)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: "46%",
        width: 2,
        background: `linear-gradient(180deg, transparent, ${palette.accent}66, transparent)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        top: "-10%",
        bottom: "-10%",
        right: 0,
        width: "30%",
        background: `linear-gradient(200deg, transparent 0%, ${palette.accentSoft}14 100%)`,
        transform: `translateX(${-Math.cos(t * 0.06) * 24}px)`,
      }}
    />
  </>
);

const Motes: React.FC<{ palette: Palette; t: number }> = ({ palette, t }) => (
  <>
    {MOTES.map((m, i) => {
      const y = ((m.y + t * m.speed) % 1.12) - 0.06;
      const x = m.x + Math.sin(t * 0.45 + i * 1.7) * m.drift * 20;
      const op = 0.12 + 0.25 * Math.abs(Math.sin(t * 0.6 + i * 1.9));
      const amber = i % 4 !== 0;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            width: m.r,
            height: m.r,
            borderRadius: "50%",
            background: amber ? `rgba(${palette.glow},0.9)` : palette.accentSoft,
            opacity: op,
          }}
        />
      );
    })}
  </>
);

/**
 * Design-driven background. The treatment (blobs / gradient / grid / sunburst
 * / split) and all colors come from the active design + derived palette, so a
 * prompt can completely re-skin the video while staying on the brand palette.
 */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const palette = usePalette();
  const design = useJobDesign();
  const bg = design?.background ?? "blobs";
  const clean = design?.texture === "clean";

  const showMotes = !clean && (bg === "blobs" || bg === "gradient" || bg === "sunburst");
  const showDots = !clean;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.surface, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(160deg, ${palette.surface} 0%, ${palette.gradientA} 45%, ${palette.gradientB} 100%)`,
        }}
      />
      {bg === "blobs" && <Blobs palette={palette} t={t} />}
      {bg === "gradient" && <GradientWash palette={palette} t={t} />}
      {bg === "grid" && <Grid palette={palette} />}
      {bg === "sunburst" && <Sunburst palette={palette} t={t} />}
      {bg === "split" && <Split palette={palette} t={t} />}
      {showDots && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage: `radial-gradient(${palette.ink}D9 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
      )}
      {showMotes && <Motes palette={palette} t={t} />}
    </AbsoluteFill>
  );
};
