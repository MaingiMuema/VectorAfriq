import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useJobDesign } from "../job/script";

// Scene entry/exit timing per motion-energy role.
const ENERGY_FADES = {
  calm: { in: [0, 15], out: [-14, 0] },
  steady: { in: [0, 9], out: [-7, 0] },
  energetic: { in: [0, 5], out: [-4, 0] },
} as const;

export const SceneShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const design = useJobDesign();
  const fades = ENERGY_FADES[design?.energy ?? "steady"];
  const inOp = interpolate(frame, fades.in, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outOp = interpolate(
    frame,
    [durationInFrames + fades.out[0], durationInFrames + fades.out[1]],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <AbsoluteFill style={{ opacity: inOp * outOp }}>{children}</AbsoluteFill>
  );
};
