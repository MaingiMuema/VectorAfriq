import React from "react";
import { Img, staticFile } from "remotion";
import { FONTS, usePalette } from "../theme";

export const Stamp: React.FC<{
  label: string;
  color?: string;
  size?: number;
}> = ({ label, color, size = 74 }) => {
  const palette = usePalette();
  const accent = color ?? palette.accent;
  return (
  <div
    style={{
      position: "absolute",
      width: size,
      height: size * 0.52,
      border: `3px solid ${accent}`,
      color: accent,
      fontFamily: FONTS.display,
      fontWeight: 900,
      fontSize: size * 0.3,
      letterSpacing: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textTransform: "uppercase",
      transform: "rotate(-10deg)",
      borderRadius: 10,
      opacity: 0.95,
      zIndex: 2,
      background: "rgba(255,253,248,0.35)",
      backdropFilter: "blur(2px)",
    }}
  >
    {label}
  </div>
);
};

export const PhotoCard: React.FC<{
  src: string;
  width: number;
  height: number;
  radius?: number;
  grayscale?: boolean;
  sepia?: boolean;
  dim?: number;
  stamp?: { label: string; x: number; y: number; color?: string };
  overlay?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ src, width, height, radius = 22, grayscale, sepia, dim, stamp, overlay, style }) => {
  const palette = usePalette();
  return (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      overflow: "hidden",
      position: "relative",
      boxShadow: `0 24px 48px ${palette.shadow}, 0 0 0 1px ${palette.line}`,
      ...style,
    }}
  >
    <Img
      src={staticFile(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: grayscale
          ? "grayscale(1) sepia(0.35)"
          : sepia
            ? "sepia(0.18) saturate(1.05)"
            : undefined,
      }}
    />
    {typeof dim === "number" ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(36,26,15,${dim})`,
        }}
      />
    ) : null}
    {stamp ? (
      <div style={{ position: "absolute", left: stamp.x, top: stamp.y }}>
        <Stamp label={stamp.label} color={stamp.color} />
      </div>
    ) : null}
    {overlay}
  </div>
  );
};
