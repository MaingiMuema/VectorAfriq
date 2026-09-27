import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FONTS, usePalette } from "../theme";
import { useJobDesign } from "../job/script";
import { easeOutExpo, fade } from "./motion";

// Editorial kicker: accent bar + letter-spaced label. On "minimal" tones the
// bar moves under the label for a quieter look.
export const Kicker: React.FC<{
  children: React.ReactNode;
  delay?: number;
  color?: string;
  center?: boolean;
}> = ({ children, delay = 0, color, center }) => {
  const frame = useCurrentFrame();
  const palette = usePalette();
  const design = useJobDesign();
  const f = fade(frame, delay, 14);
  const accent = color ?? palette.accent;
  const underline = design?.tone === "minimal";
  return (
    <div
      style={{
        opacity: f,
        transform: `translateY(${(1 - f) * 14}px)`,
        display: "flex",
        flexDirection: underline ? "column" : "row",
        alignItems: "center",
        gap: underline ? 8 : 12,
        justifyContent: center ? "center" : "flex-start",
      }}
    >
      {!underline && (
        <span
          style={{
            width: 34,
            height: 10,
            background: accent,
            display: "inline-block",
            borderRadius: 3,
          }}
        />
      )}
      <span
        style={{
          fontFamily: FONTS.sans,
          fontWeight: 800,
          fontSize: 19,
          letterSpacing: 7,
          textTransform: "uppercase",
          color: accent,
        }}
      >
        {children}
      </span>
      {center && !underline && (
        <span
          style={{
            width: 34,
            height: 10,
            background: accent,
            display: "inline-block",
            borderRadius: 3,
          }}
        />
      )}
      {underline && (
        <span
          style={{
            width: center ? 64 : 40,
            height: 4,
            background: accent,
            borderRadius: 2,
          }}
        />
      )}
    </div>
  );
};

export const FadeUp: React.FC<{
  children: React.ReactNode;
  delay?: number;
  dist?: number;
  dur?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, dist = 46, dur = 24, style }) => {
  const frame = useCurrentFrame();
  const f = fade(frame, delay, dur);
  return (
    <div
      style={{
        opacity: f,
        transform: `translateY(${(1 - f) * dist}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Words: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  style?: React.CSSProperties;
  wordStyle?: React.CSSProperties;
  /** Accent (italic) the final word — used by the "accent-word" headline style. */
  accentLast?: boolean;
}> = ({ text, delay = 0, stagger = 4, style, wordStyle, accentLast }) => {
  const frame = useCurrentFrame();
  const palette = usePalette();
  const words = text.split(" ");
  // When accenting the last word, peel off trailing punctuation (and the
  // closing quote from the intro tagline) so only the word itself gets colored.
  const lastRaw = accentLast ? words[words.length - 1] : "";
  const punctMatch = lastRaw.match(/[^\w']+$/);
  const punct = accentLast && punctMatch ? punctMatch[0] : "";
  const core = accentLast ? lastRaw.slice(0, lastRaw.length - punct.length) : "";
  return (
    <span style={style}>
      {words.map((w, i) => {
        const f = interpolate(
          frame,
          [delay + i * stagger, delay + i * stagger + 12],
          [0, 1],
          { easing: easeOutExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const isLast = accentLast && i === words.length - 1;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: f,
              transform: `translateY(${(1 - f) * 26}px) rotate(${(1 - f) * 2.5}deg)`,
              marginRight: "0.26em",
              ...wordStyle,
            }}
          >
            {isLast ? (
              <>
                <span style={{ color: palette.accent, fontStyle: "italic" }}>{core}</span>
                {punct}
              </>
            ) : (
              w
            )}
          </span>
        );
      })}
    </span>
  );
};

export const Typewriter: React.FC<{
  text: string;
  delay?: number;
  speed?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, speed = 9, style }) => {
  const frame = useCurrentFrame();
  const palette = usePalette();
  const n = Math.max(0, Math.floor((frame - delay) / speed));
  const shown = text.slice(0, n);
  const done = n >= text.length;
  const blink = Math.abs(Math.sin(frame * 0.28)) > 0.4;
  return (
    <span style={style}>
      {shown}
      <span
        style={{
          display: "inline-block",
          width: 3,
          height: 26,
          marginLeft: 4,
          background: done ? "transparent" : palette.accent,
          opacity: blink ? 1 : 0.2,
          verticalAlign: "-4px",
          borderRadius: 2,
        }}
      />
    </span>
  );
};

export const Counter: React.FC<{
  to: number;
  delay?: number;
  dur?: number;
  format?: (n: number) => string;
  style?: React.CSSProperties;
}> = ({ to, delay = 0, dur = 42, format = (n) => `${n}`, style }) => {
  const frame = useCurrentFrame();
  const v = Math.round(
    interpolate(frame, [delay, delay + dur], [0, to], {
      easing: easeOutExpo,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  return <span style={style}>{format(v)}</span>;
};

// Editorial highlight: soft accent marker behind serif italic text.
export const Highlight: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const palette = usePalette();
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        color: palette.accent,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: "6px -10px 0px -10px",
          background: `${palette.accentSoft}55`,
          transform: "skewX(-8deg) rotate(-0.6deg)",
          borderRadius: 8,
          zIndex: 0,
        }}
      />
      <span style={{ position: "relative", zIndex: 1, fontStyle: "italic" }}>
        {children}
      </span>
    </span>
  );
};
