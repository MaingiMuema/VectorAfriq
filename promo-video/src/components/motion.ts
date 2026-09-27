import { Easing, interpolate, spring } from "remotion";

export const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1);

export const pop = (
  frame: number,
  fps: number,
  delay = 0,
  config: Partial<{ damping: number; mass: number; stiffness: number }> = {}
): number =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 13, mass: 0.7, stiffness: 170, ...config },
  });

export const fade = (frame: number, delay = 0, dur = 16): number =>
  interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const slideIn = (
  frame: number,
  delay = 0,
  dist = 42,
  dur = 20
): { opacity: number; transform: string } => {
  const f = fade(frame, delay, dur);
  return { opacity: f, transform: `translateY(${(1 - f) * dist}px)` };
};

export const scaleIn = (
  frame: number,
  fps: number,
  delay = 0
): number => pop(frame, fps, delay, { damping: 14, mass: 0.6, stiffness: 190 });
