import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { FadeUp, Kicker, Words } from "../components/Text";
import { useJobDesign, useJobScript } from "../job/script";
import { applyCase, FONTS, sceneDesign, usePalette } from "../theme";

/**
 * Generic "statement" scene — used for problem/solution-style beats in the
 * scripted (job) video. Falls back to the classic VectorAfriq problem copy
 * when no job script is active. Layout, headline treatment, type scale and
 * case all follow the AI-authored design.
 */
export const MessageScene: React.FC<{ index?: number }> = ({ index = 0 }) => {
  const script = useJobScript();
  const design = useJobDesign();
  const palette = usePalette();
  const frame = useCurrentFrame();
  const sd = sceneDesign(design, "message");
  const scene = script?.scenes[index];

  const kicker = scene?.kicker ?? "The problem";
  const headline =
    scene?.headline ?? "Searching for the right home shouldn't be this hard.";
  const subline =
    scene?.subline ?? "Endless scrolling. Conflicting listings. Sinking feeling.";

  const left = sd.layout === "left";
  const fontSize = sd.size === "large" ? 92 : sd.size === "compact" ? 64 : 78;

  return (
    <SceneShell>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: left ? "flex-start" : "center",
          padding: left ? "0 190px" : "0 150px",
        }}
      >
        <div style={{ display: "flex", justifyContent: left ? "flex-start" : "center" }}>
          <Kicker center={!left} delay={4}>
            {kicker}
          </Kicker>
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize,
            lineHeight: 1.12,
            color: palette.ink,
            marginTop: 30,
            maxWidth: 1500,
            textAlign: left ? "left" : "center",
            ...(sd.headline === "mark"
              ? {
                  background: `${palette.accentSoft}3D`,
                  transform: "skewX(-4deg)",
                  borderRadius: 18,
                  padding: "8px 38px",
                }
              : {}),
          }}
        >
          {sd.headline === "accent-word" ? (
            <Words text={applyCase(headline, design)} delay={10} stagger={4} accentLast />
          ) : (
            <Words text={applyCase(headline, design)} delay={10} stagger={4} />
          )}
        </div>
        {sd.headline === "underline" ? (
          <div
            style={{
              width: 150,
              height: 9,
              borderRadius: 5,
              background: palette.accent,
              marginTop: 28,
              opacity: Math.min(1, Math.max(0, (frame - 20) / 14)),
            }}
          />
        ) : null}
        {subline ? (
          <div style={{ marginTop: 34 }}>
            <FadeUp delay={34} dist={20}>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 27,
                  color: palette.textDim,
                  lineHeight: 1.6,
                  maxWidth: 1100,
                  textAlign: left ? "left" : "center",
                  fontWeight: 500,
                }}
              >
                {subline}
              </div>
            </FadeUp>
          </div>
        ) : null}
        {/* accent rule */}
        <div
          style={{
            marginTop: 40,
            width: 120,
            height: 8,
            borderRadius: 4,
            background: palette.accent,
            opacity: Math.min(1, Math.max(0, (frame - 30) / 14)),
          }}
        />
      </AbsoluteFill>
    </SceneShell>
  );
};
