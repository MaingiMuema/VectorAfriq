import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SceneShell } from "../components/SceneShell";
import { FadeUp, Kicker, Typewriter } from "../components/Text";
import { pop } from "../components/motion";
import { COLORS, FONTS } from "../theme";

export const AIScene: React.FC = () => {
  const frame = useCurrentFrame();
  const typingDone = frame > 30;
  return (
    <SceneShell>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 150px" }}>
        {/* headline */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Kicker center delay={2}>
              AI matchmaking
            </Kicker>
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: 64,
              color: COLORS.ink,
              marginTop: 18,
            }}
          >
            <FadeUp delay={8}>
              Describe it. <span style={{ color: COLORS.red, fontStyle: "italic" }}>We find it.</span>
            </FadeUp>
          </div>
        </div>

        {/* chat card — light */}
        <div
          style={{
            width: 1060,
            background: COLORS.card,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 30,
            boxShadow: "0 40px 80px rgba(88,60,25,0.2)",
            padding: "30px 34px",
          }}
        >
          {/* user bubble */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                background: "rgba(230,55,79,0.09)",
                border: "2px solid rgba(230,55,79,0.45)",
                borderRadius: 20,
                borderBottomRightRadius: 6,
                padding: "18px 26px",
                maxWidth: 560,
              }}
            >
              <Typewriter
                text="I want a quiet 3-bedroom home in Kilimani, under 50M, with parking."
                delay={8}
                speed={6}
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 23,
                  color: COLORS.ink,
                  lineHeight: 1.45,
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          {/* AI typing dots */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: typingDone ? 0 : 1,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.sun})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              ✨
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 99,
                    background: COLORS.red,
                    opacity: Math.abs(Math.sin(frame * 0.3 + i)),
                  }}
                />
              ))}
            </div>
          </div>

          {/* AI reply */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 16,
              opacity: interpolate(frame, [58, 74], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              transform: `translateY(${interpolate(frame, [58, 80], [26, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.sun})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              ✨
            </div>
            <div
              style={{
                background: COLORS.paper,
                border: `1px solid ${COLORS.line}`,
                borderRadius: 20,
                borderTopLeftRadius: 6,
                padding: "18px 26px",
                flex: 1,
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 22,
                  color: COLORS.ink,
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}
              >
                Found <b style={{ color: COLORS.red }}>12 perfect matches</b> — including 3
                with gardens, 2 with servant quarters…
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                {["house1.jpg", "house2.jpg", "house4.jpg"].map((src, i) => {
                  const f = pop(frame, 30, 80 + i * 6);
                  return (
                    <div
                      key={src}
                      style={{
                        width: 130,
                        height: 92,
                        borderRadius: 12,
                        backgroundImage: `url(${JSON.stringify(staticFile(`images/${src}`))})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        opacity: f,
                        transform: `scale(${f})`,
                        border: "1px solid rgba(36,26,15,0.15)",
                        boxShadow: "0 10px 24px rgba(88,60,25,0.18)",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
