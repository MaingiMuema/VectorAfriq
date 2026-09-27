import React from "react";
import { Img, staticFile } from "remotion";
import { FONTS, usePalette } from "../theme";

export const LogoMark: React.FC<{ size?: number; glow?: boolean }> = ({
  size = 150,
  glow = true,
}) => {
  const palette = usePalette();
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {glow ? (
        <div
          style={{
            position: "absolute",
            inset: -30,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${palette.glow},0.5) 0%, rgba(${palette.glow},0) 65%)`,
          }}
        />
      ) : null}
      <Img
        src={staticFile("images/logo.png")}
        style={{ width: size, height: size, objectFit: "contain", position: "relative", zIndex: 1 }}
      />
    </div>
  );
};

export const Wordmark: React.FC<{ size?: number; color?: string }> = ({
  size = 54,
  color,
}) => {
  const palette = usePalette();
  const ink = color ?? palette.ink;
  return (
    <div
      style={{
        fontFamily: FONTS.sans,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: 4,
        color: ink,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      VECTOR<span style={{ color: palette.accent }}>A</span>FRIQ
    </div>
  );
};
