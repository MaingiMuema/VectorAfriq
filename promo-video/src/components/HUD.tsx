import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SCHEDULE, VIDEO_DURATION } from "../timings";
import { FONTS, usePalette } from "../theme";

/** Optional schedule + scene count for scripted (job) videos; falls back to the
 *  hardcoded promo timings when omitted. */
export const HUD: React.FC<{
  schedule?: { start: number }[];
  totalScenes?: number;
}> = ({ schedule, totalScenes }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const palette = usePalette();
  const p = Math.min(1, frame / durationInFrames);

  const activeSchedule = schedule ?? SCHEDULE;
  const sceneTotal = totalScenes ?? 8;

  let sceneIdx = 0;
  for (let i = 0; i < activeSchedule.length; i++) {
    if (frame >= Math.round(activeSchedule[i].start * 30)) sceneIdx = i;
  }
  // Fade the HUD out toward the end of the actual composition (scripted jobs
  // have dynamic durations), falling back to the fixed promo duration.
  const endFrame = schedule ? durationInFrames : VIDEO_DURATION;
  const fadeOut = interpolate(frame, [endFrame - 20, endFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 30,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 3,
            background: palette.accent,
            transform: "rotate(45deg)",
          }}
        />
        <div
          style={{
            flex: 1,
            height: 5,
            background: palette.line,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${p * 100}%`,
              background: `linear-gradient(90deg, ${palette.accent}, ${palette.accentSoft})`,
              borderRadius: 4,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 13,
            letterSpacing: 3,
            color: palette.textDim,
            fontWeight: 800,
          }}
        >
          {String(sceneIdx + 1).padStart(2, "0")} / {String(sceneTotal).padStart(2, "0")}
        </div>
      </div>
    </AbsoluteFill>
  );
};
