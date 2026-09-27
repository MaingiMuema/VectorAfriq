import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark, Wordmark } from "../components/Logo";
import { SceneShell } from "../components/SceneShell";
import { FadeUp, Words } from "../components/Text";
import { pop } from "../components/motion";
import { useJobDesign, useJobScript } from "../job/script";
import { applyCase, FONTS, sceneDesign, usePalette } from "../theme";

const isVectorAfriq = (name: string): boolean =>
  name.toLowerCase().replace(/[^a-z]/g, "") === "vectorafriq";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const design = useJobDesign();
  const script = useJobScript();
  const palette = usePalette();
  const sd = sceneDesign(design, "intro");
  const s = pop(frame, fps, 2);
  const ringP = frame / fps;

  const brandName = script?.brand.name ?? "VectorAfriq";
  const tagline =
    script?.brand.tagline ?? "Finding your home shouldn't feel like a full-time job.";

  return (
    <SceneShell>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* sun disc behind the logo */}
        <div
          style={{
            position: "absolute",
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${palette.glow},0.55) 0%, rgba(${palette.glow},0.28) 42%, rgba(${palette.glow},0) 70%)`,
            transform: `scale(${0.8 + ringP * 0.06})`,
          }}
        />
        {/* rotating dashed rings */}
        <div
          style={{
            position: "absolute",
            width: 760,
            height: 760,
            borderRadius: "50%",
            border: `2px dashed ${palette.accent}`,
            transform: `rotate(${ringP * 40}deg) scale(${1 + ringP * 0.04})`,
            opacity: 0.35,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 940,
            height: 940,
            borderRadius: "50%",
            border: `2px dashed ${palette.line}`,
            transform: `rotate(-${ringP * 22}deg)`,
          }}
        />
        <div style={{ transform: `scale(${s})` }}>
          <LogoMark size={170} />
        </div>
        <div
          style={{
            marginTop: 34,
            transform: `translateY(${(1 - pop(frame, fps, 8)) * 30}px)`,
            opacity: pop(frame, fps, 8),
          }}
        >
          {isVectorAfriq(brandName) ? (
            <Wordmark size={54} />
          ) : (
            <div
              style={{
                fontFamily: FONTS.sans,
                fontWeight: 900,
                fontSize: 54,
                letterSpacing: 4,
                color: palette.ink,
              }}
            >
              {applyCase(brandName.toUpperCase(), design)}
            </div>
          )}
        </div>
        <div style={{ marginTop: 26 }}>
          <FadeUp delay={16} dist={18}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 20,
                letterSpacing: 10,
                color: palette.textDim,
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {isVectorAfriq(brandName)
                ? "KENYA\u2019S PROPERTY MARKETPLACE"
                : "REAL ESTATE, MADE SIMPLE"}
            </div>
          </FadeUp>
        </div>
        <div style={{ marginTop: 44 }}>
          <FadeUp delay={22} dist={26}>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 58,
                color: palette.ink,
                fontStyle: "italic",
                fontWeight: 500,
                maxWidth: 1020,
                textAlign: "center",
                lineHeight: 1.28,
              }}
            >
              {sd.headline === "accent-word" ? (
                <Words text={`\u201C${applyCase(tagline, design)}\u201D`} delay={22} stagger={3} accentLast />
              ) : (
                <span>&ldquo;{applyCase(tagline, design)}&rdquo;</span>
              )}
            </div>
          </FadeUp>
        </div>
        <div
          style={{
            marginTop: 48,
            display: "flex",
            gap: 14,
            opacity: interpolate(frame, [30, 42], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {["BUY", "RENT", "INVEST"].map((c, i) => (
            <div
              key={c}
              style={{
                padding: "11px 30px",
                borderRadius: 999,
                border: `2px solid ${i === 0 ? palette.accent : palette.line}`,
                background: i === 0 ? palette.accent : palette.card,
                color: i === 0 ? palette.onAccent : palette.ink,
                fontFamily: FONTS.sans,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 4,
                boxShadow: i === 0 ? `0 12px 30px ${palette.accent}59` : "none",
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
