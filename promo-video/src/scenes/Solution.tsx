import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { Counter, FadeUp, Words } from "../components/Text";
import { COLORS, FONTS } from "../theme";

const STATS = [
  { to: 10, suffix: "K+", label: "Listings" },
  { to: 2, suffix: "K+", label: "Agents & partners" },
  { to: 47, suffix: "", label: "Counties covered" },
  { to: 1, suffix: "", label: "Home, yours" },
];

export const Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const pan = interpolate(frame, [0, 240], [1.06, 1.16], { extrapolateRight: "clamp" });
  return (
    <SceneShell>
      <AbsoluteFill>
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <Img
            src={staticFile("images/hero.jpeg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${pan})`,
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(100deg, rgba(246,239,227,0.94) 0%, rgba(246,239,227,0.78) 38%, rgba(246,239,227,0.18) 100%)",
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(180deg, rgba(246,239,227,0.25) 0%, transparent 34%, rgba(246,239,227,0.35) 100%)",
            }}
          />
        </AbsoluteFill>

        <AbsoluteFill style={{ justifyContent: "center", padding: "0 110px" }}>
          <div style={{ maxWidth: 1200 }}>
            <FadeUp delay={4} dist={20}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 26px",
                  borderRadius: 999,
                  background: COLORS.red,
                  color: COLORS.white,
                  fontFamily: FONTS.sans,
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  boxShadow: "0 14px 34px rgba(230,55,79,0.4)",
                }}
              >
                ● Meet the fix
              </div>
            </FadeUp>
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 800,
                fontSize: 92,
                lineHeight: 1.05,
                color: COLORS.ink,
                marginTop: 30,
              }}
            >
              <Words text="Meet VectorAfriq." delay={12} stagger={5} />
              <div style={{ color: COLORS.red, fontSize: 58, fontStyle: "italic", marginTop: 10 }}>
                <Words text="Kenya's smartest way to buy, rent & invest." delay={30} stagger={4} />
              </div>
            </div>
          </div>

          {/* stats bar — white glass */}
          <div
            style={{
              marginTop: 64,
              display: "flex",
              gap: 0,
              background: "rgba(255,253,248,0.92)",
              border: `1px solid ${COLORS.line}`,
              borderRadius: 26,
              padding: "28px 36px",
              width: "fit-content",
              boxShadow: "0 30px 60px rgba(88,60,25,0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            {STATS.map((s, i) => {
              const f = interpolate(frame, [40 + i * 8, 52 + i * 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={s.label}
                  style={{
                    opacity: f,
                    transform: `translateY(${(1 - f) * 30}px)`,
                    padding: "0 46px",
                    borderRight: i < STATS.length - 1 ? `1px solid ${COLORS.line}` : undefined,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontWeight: 800,
                      fontSize: 62,
                      color: COLORS.ink,
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "center",
                    }}
                  >
                    <Counter to={s.to} delay={42 + i * 8} format={(n) => n.toLocaleString()} />
                    <span style={{ color: COLORS.red, fontSize: 36 }}>{s.suffix}</span>
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 16,
                      letterSpacing: 3,
                      textTransform: "uppercase",
                      color: COLORS.textDim,
                      marginTop: 6,
                      fontWeight: 700,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneShell>
  );
};
