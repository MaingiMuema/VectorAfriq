import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { PhotoCard } from "../components/PhotoCard";
import { FadeUp, Kicker, Typewriter } from "../components/Text";
import { pop } from "../components/motion";
import { useJobDesign, useJobScript, type JobListingItem } from "../job/script";
import { applyCase, FONTS, sceneDesign, usePalette } from "../theme";

const DEFAULT_RESULTS: JobListingItem[] = [
  { title: "4 Bed Villa \u2014 Kilimani", price: "KSh 48,500,000", image: "house1.jpg" },
  { title: "3 Bed Apartment \u2014 Westlands", price: "KSh 26,000,000", image: "house2.jpg" },
  { title: "5 Bed Mansion \u2014 Karen", price: "KSh 92,000,000", image: "house3.jpg" },
];

const DEFAULT_CHIPS = ["Houses", "3+ Beds", "Under 50M", "With parking"];

export const SearchScene: React.FC<{ index?: number }> = ({ index = 0 }) => {
  const frame = useCurrentFrame();
  const script = useJobScript();
  const design = useJobDesign();
  const palette = usePalette();
  const sd = sceneDesign(design, "listing");
  const scene = script?.scenes[index];

  const kicker = scene?.kicker ?? "Smart search";
  const headline = scene?.headline ?? "Filter like a pro.";
  const headlineAccent = scene?.subline ?? "Find your match.";
  const description =
    "Neighbourhood, budget, bedrooms, amenities \u2014 narrow it down in seconds with instant, verified results.";
  const searchQuery =
    scene?.type === "listing"
      ? scene.searchQuery ?? "3-bedroom house in Kilimani"
      : "3-bedroom house in Kilimani";
  const results: JobListingItem[] =
    scene?.type === "listing" && scene.items && scene.items.length > 0
      ? (scene.items as JobListingItem[]).slice(0, 3)
      : DEFAULT_RESULTS;

  const centered = sd.layout === "center";

  return (
    <SceneShell>
      <AbsoluteFill
        style={{
          flexDirection: centered ? "column" : "row",
          alignItems: "center",
          justifyContent: centered ? "center" : undefined,
          padding: "0 110px",
          gap: centered ? 48 : undefined,
        }}
      >
        {/* Left copy */}
        <div
          style={{
            width: centered ? "auto" : 520,
            marginRight: centered ? 0 : 70,
            flexShrink: 0,
            textAlign: centered ? "center" : "left",
          }}
        >
          <div style={{ display: "flex", justifyContent: centered ? "center" : "flex-start" }}>
            <Kicker center={centered} delay={3}>
              {kicker}
            </Kicker>
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: centered ? 60 : 66,
              lineHeight: 1.08,
              color: palette.ink,
              marginTop: 24,
            }}
          >
            <FadeUp delay={8} dist={30}>
              {applyCase(headline, design)}
            </FadeUp>
            <FadeUp
              delay={16}
              dist={30}
              style={{ color: palette.accent, fontStyle: "italic" }}
            >
              {applyCase(headlineAccent, design)}
            </FadeUp>
          </div>
          <FadeUp delay={26} dist={20}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 21,
                color: palette.textDim,
                marginTop: 22,
                lineHeight: 1.6,
                maxWidth: 440,
                textAlign: centered ? "center" : "left",
              }}
            >
              {description}
            </div>
          </FadeUp>
        </div>

        {/* Right: light UI mockup */}
        <div
          style={{
            flex: centered ? "0 1 1150px" : 1,
            position: "relative",
            width: centered ? 1150 : undefined,
          }}
        >
          <div
            style={{
              background: palette.card,
              border: `1px solid ${palette.line}`,
              borderRadius: 28,
              boxShadow: `0 40px 80px ${palette.shadow}`,
              overflow: "hidden",
              padding: 26,
            }}
          >
            {/* window chrome */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["#e6374f", "#f2a03d", "#2f9e77"].map((c) => (
                <span key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c }} />
              ))}
              <div
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 10,
                  background: palette.surfaceDeep,
                  marginLeft: 14,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 16,
                  fontFamily: FONTS.sans,
                  fontSize: 14,
                  fontWeight: 600,
                  color: palette.textFaint,
                }}
              >
                {script?.brand.website ?? "vectorafriqproperties.co.ke"}
              </div>
            </div>
            {/* search bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: `${palette.accent}12`,
                border: `2px solid ${palette.accent}66`,
                borderRadius: 16,
                padding: "16px 20px",
              }}
            >
              <span style={{ color: palette.accent, fontSize: 26 }}>🔍</span>
              <Typewriter
                text={searchQuery}
                delay={14}
                speed={5}
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 24,
                  fontWeight: 700,
                  color: palette.ink,
                }}
              />
            </div>
            {/* filter chips */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 16,
                justifyContent: centered ? "center" : undefined,
              }}
            >
              {DEFAULT_CHIPS.map((chip, i) => {
                const f = interpolate(frame, [30 + i * 4, 40 + i * 4], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={chip}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 999,
                      background: i === 0 ? palette.accent : `${palette.ink}0F`,
                      color: i === 0 ? palette.onAccent : palette.ink,
                      fontFamily: FONTS.sans,
                      fontSize: 16,
                      fontWeight: 700,
                      opacity: f,
                      transform: `translateY(${(1 - f) * 14}px)`,
                    }}
                  >
                    {i === 0 ? "✓ " : ""}
                    {chip}
                  </div>
                );
              })}
            </div>
            {/* results */}
            <div style={{ display: "flex", gap: 14, marginTop: 20 }}>
              {results.map((r, i) => {
                const f = pop(frame, 30, 36 + i * 8);
                return (
                  <div
                    key={r.title}
                    style={{
                      flex: 1,
                      opacity: f,
                      transform: `translateY(${(1 - f) * 40}px)`,
                    }}
                  >
                    <PhotoCard
                      src={r.image ? `images/${r.image}` : "images/house1.jpg"}
                      width={210}
                      height={150}
                      radius={14}
                      sepia
                      overlay={
                        <div
                          style={{
                            position: "absolute",
                            left: 10,
                            top: 10,
                            background: palette.accent,
                            color: palette.onAccent,
                            fontFamily: FONTS.sans,
                            fontSize: 12,
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: 8,
                            letterSpacing: 1,
                          }}
                        >
                          FEATURED
                        </div>
                      }
                    />
                    <div
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 15,
                        fontWeight: 800,
                        color: palette.ink,
                        marginTop: 10,
                      }}
                    >
                      {r.title}
                    </div>
                    {r.price ? (
                      <div
                        style={{
                          fontFamily: FONTS.sans,
                          fontSize: 14,
                          color: palette.accent,
                          fontWeight: 700,
                          marginTop: 3,
                        }}
                      >
                        {r.price}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          {/* floating badge */}
          <div
            style={{
              position: "absolute",
              right: -24,
              bottom: -22,
              background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentDeep})`,
              color: palette.onAccent,
              fontFamily: FONTS.sans,
              fontWeight: 800,
              fontSize: 20,
              padding: "16px 26px",
              borderRadius: 18,
              boxShadow: `0 20px 50px ${palette.accent}66`,
              transform: "rotate(-4deg)",
              opacity: interpolate(frame, [60, 74], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            ⚡ 12,483 homes
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
