import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { PhotoCard } from "../components/PhotoCard";
import { FadeUp, Kicker, Words } from "../components/Text";
import { pop } from "../components/motion";
import { COLORS, FONTS } from "../theme";

const PAINS = [
  { icon: "⇅", title: "Endless scrolling", sub: "Pages of listings, none of them right" },
  { icon: "⚠", title: "Conflicting listings", sub: "Same home, three different prices" },
  { icon: "✕", title: "What you see ≠ what you get", sub: "Photos can hide a lot" },
];

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <SceneShell>
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 120px" }}>
        {/* Left copy */}
        <div style={{ flex: 1, maxWidth: 780 }}>
          <Kicker delay={4}>The problem</Kicker>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: 74,
              lineHeight: 1.1,
              color: COLORS.ink,
              marginTop: 26,
            }}
          >
            <Words text="Searching for the right home shouldn't be this hard." delay={10} stagger={5} />
          </div>
          <div style={{ marginTop: 42, display: "flex", flexDirection: "column", gap: 16 }}>
            {PAINS.map((p, i) => {
              const f = pop(frame, 30, 20 + i * 7);
              return (
                <div
                  key={p.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    opacity: f,
                    transform: `translateX(${(1 - f) * -50}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 16,
                      background: "rgba(230,55,79,0.10)",
                      border: "2px solid rgba(230,55,79,0.35)",
                      color: COLORS.red,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {p.icon}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: COLORS.card,
                      border: `1px solid ${COLORS.line}`,
                      borderRadius: 18,
                      padding: "16px 24px",
                      boxShadow: "0 14px 30px rgba(88,60,25,0.12)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 24,
                        fontWeight: 800,
                        color: COLORS.ink,
                      }}
                    >
                      {p.title}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 17,
                        color: COLORS.textDim,
                        marginTop: 2,
                      }}
                    >
                      {p.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right visual: tilted photo stack */}
        <div style={{ width: 620, height: 620, position: "relative", flexShrink: 0 }}>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 60,
              transform: `rotate(${6 + Math.sin(t * 0.6) * 2}deg)`,
              opacity: interpolate(frame, [18, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            <PhotoCard
              src="images/house3.jpg"
              width={300}
              height={300}
              dim={0.18}
              grayscale
              stamp={{ label: "NO", x: 90, y: 100 }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: 210,
              top: 250,
              transform: `rotate(${-8 + Math.sin(t * 0.5 + 2) * 2.5}deg)`,
              opacity: interpolate(frame, [26, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            <PhotoCard
              src="images/house2.jpg"
              width={300}
              height={300}
              dim={0.2}
              sepia
              stamp={{ label: "SOLD", x: 90, y: 100, color: COLORS.sun }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 300,
              transform: `rotate(${4 + Math.sin(t * 0.7 + 4) * 2}deg)`,
              opacity: interpolate(frame, [34, 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            <PhotoCard
              src="images/house4.jpg"
              width={300}
              height={300}
              dim={0.14}
              stamp={{ label: "??", x: 105, y: 100 }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
