import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { FadeUp, Kicker } from "../components/Text";
import { pop } from "../components/motion";
import { useJobDesign, useJobScript, type JobServiceItem } from "../job/script";
import { applyCase, FONTS, sceneDesign, usePalette } from "../theme";

const DEFAULT_SERVICES: JobServiceItem[] = [
  { icon: "🏠", title: "Valuation", sub: "Know your property's true worth", image: "house1.jpg" },
  { icon: "🏦", title: "Mortgages", sub: "Financing that fits your budget", image: "house2.jpg" },
  { icon: "⚖️", title: "Legal", sub: "Verified title checks & conveyancing", image: "house3.jpg" },
  { icon: "🚚", title: "Moving", sub: "We help you settle in smoothly", image: "house4.jpg" },
];

export const ServicesScene: React.FC<{ index?: number }> = ({ index = 0 }) => {
  const frame = useCurrentFrame();
  const script = useJobScript();
  const design = useJobDesign();
  const palette = usePalette();
  const sd = sceneDesign(design, "services");
  const scene = script?.scenes[index];

  const kicker = scene?.kicker ?? "Beyond the listing";
  const headline = scene?.headline ?? "The whole journey.";
  const headlineAccent = scene?.subline ?? "One platform.";
  const services: JobServiceItem[] =
    scene?.type === "services" && scene.items && scene.items.length > 0
      ? (scene.items as JobServiceItem[]).slice(0, 4)
      : DEFAULT_SERVICES;

  return (
    <SceneShell>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 110px" }}>
        <div style={{ textAlign: "center", marginBottom: 54 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Kicker center delay={2}>
              {kicker}
            </Kicker>
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: sd.size === "large" ? 72 : sd.size === "compact" ? 52 : 62,
              color: palette.ink,
              marginTop: 16,
            }}
          >
            <FadeUp delay={8}>
              {applyCase(headline, design)}{" "}
              <span style={{ color: palette.accent, fontStyle: "italic" }}>
                {applyCase(headlineAccent, design)}
              </span>
            </FadeUp>
          </div>
        </div>

        <div style={{ display: "flex", gap: 22 }}>
          {services.map((s, i) => {
            const f = pop(frame, 30, 14 + i * 7);
            const lift = Math.sin(frame / 30 * 1.2 + i * 2) * 4;
            return (
              <div
                key={s.title}
                style={{
                  width: 380,
                  height: 430,
                  borderRadius: 26,
                  overflow: "hidden",
                  position: "relative",
                  background: palette.card,
                  border: `1px solid ${palette.line}`,
                  boxShadow: `0 26px 54px ${palette.shadow}`,
                  opacity: f,
                  transform: `translateY(${(1 - f) * 60 + lift}px) scale(${0.92 + f * 0.08})`,
                }}
              >
                <Img
                  src={staticFile(`images/${s.image || "house1.jpg"}`)}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.95) contrast(1.02)" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(255,253,248,0.06) 0%, rgba(36,26,15,0.28) 50%, rgba(36,26,15,0.82) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 24,
                    top: 22,
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    background: palette.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    boxShadow: `0 10px 28px ${palette.accent}73`,
                  }}
                >
                  {s.icon || "✦"}
                </div>
                <div style={{ position: "absolute", left: 24, right: 24, bottom: 24 }}>
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontWeight: 800,
                      fontSize: 34,
                      color: "#ffffff",
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      width: 46,
                      height: 4,
                      borderRadius: 2,
                      background: palette.accentSoft,
                      marginTop: 8,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 16,
                      color: "rgba(255,253,248,0.85)",
                      marginTop: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    {s.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
