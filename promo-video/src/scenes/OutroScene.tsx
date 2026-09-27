import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { LogoMark, Wordmark } from "../components/Logo";
import { FadeUp } from "../components/Text";
import { pop } from "../components/motion";
import { useJobScript } from "../job/script";
import { applyCase, FONTS, usePalette } from "../theme";

const isVectorAfriq = (name: string): boolean =>
  name.toLowerCase().replace(/[^a-z]/g, "") === "vectorafriq";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const script = useJobScript();
  const palette = usePalette();
  const t = frame / 30;
  const s = pop(frame, 30, 4);

  const brandName = script?.brand.name ?? "VectorAfriq";
  const tagline = script?.brand.tagline ?? "YOUR HOME. YOUR FUTURE.";
  const website = script?.brand.website ?? "www.vectorafriqproperties.co.ke";

  return (
    <SceneShell>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* glow */}
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${palette.glow},0.5) 0%, rgba(${palette.glow},0.22) 45%, rgba(${palette.glow},0) 70%)`,
            transform: `scale(${0.75 + t * 0.1})`,
          }}
        />
        {/* expanding dashed rings */}
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: "50%",
            border: `2px dashed ${palette.accent}`,
            transform: `scale(${0.7 + t * 0.25}) rotate(${t * 30}deg)`,
            opacity: (1 - t * 0.03) * 0.4,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 1000,
            height: 1000,
            borderRadius: "50%",
            border: `2px dashed ${palette.line}`,
            transform: `scale(${0.6 + t * 0.3}) rotate(-${t * 20}deg)`,
            opacity: 1 - t * 0.03,
          }}
        />
        <div style={{ transform: `scale(${s})` }}>
          <LogoMark size={150} />
        </div>
        <div style={{ marginTop: 30, opacity: pop(frame, 30, 10) }}>
          {isVectorAfriq(brandName) ? (
            <Wordmark size={52} />
          ) : (
            <div
              style={{
                fontFamily: FONTS.sans,
                fontWeight: 900,
                fontSize: 52,
                letterSpacing: 4,
                color: palette.ink,
              }}
            >
              {applyCase(brandName.toUpperCase(), script?.design)}
            </div>
          )}
        </div>
        <div style={{ marginTop: 30 }}>
          <FadeUp delay={18} dist={24}>
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 800,
                fontSize: 46,
                letterSpacing: 3,
                color: palette.ink,
                textAlign: "center",
              }}
            >
              {applyCase(tagline, script?.design)}
            </div>
          </FadeUp>
        </div>
        <div style={{ marginTop: 40 }}>
          <FadeUp delay={26} dist={18}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 34px",
                borderRadius: 999,
                background: palette.accent,
                color: palette.onAccent,
                fontFamily: FONTS.sans,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 2,
                boxShadow: `0 18px 44px ${palette.accent}66`,
              }}
            >
              {website}
            </div>
          </FadeUp>
        </div>
        <div style={{ marginTop: 34 }}>
          <FadeUp delay={34} dist={14}>
            <div
              style={{
                display: "flex",
                gap: 30,
                fontFamily: FONTS.sans,
                fontSize: 18,
                letterSpacing: 5,
                color: palette.textDim,
                fontWeight: 700,
              }}
            >
              <span>BUY</span>
              <span style={{ color: palette.accent }}>●</span>
              <span>RENT</span>
              <span style={{ color: palette.accent }}>●</span>
              <span>INVEST</span>
              <span style={{ color: palette.accent }}>●</span>
              <span>SELL</span>
            </div>
          </FadeUp>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
