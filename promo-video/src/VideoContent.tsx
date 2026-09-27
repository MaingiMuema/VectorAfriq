import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { FPS, SCHEDULE, VIDEO_DURATION } from "./timings";
import { Background } from "./components/Background";
import { FilmGrain } from "./components/FilmGrain";
import { HUD } from "./components/HUD";
import { Wipes } from "./components/Wipes";
import { Intro } from "./scenes/Intro";
import { Problem } from "./scenes/Problem";
import { Solution } from "./scenes/Solution";
import { SearchScene } from "./scenes/SearchScene";
import { AIScene } from "./scenes/AIScene";
import { ServicesScene } from "./scenes/ServicesScene";
import { CTAScene } from "./scenes/CTAScene";
import { OutroScene } from "./scenes/OutroScene";

const SCENE_COMPS = [
  Intro,
  Problem,
  Solution,
  SearchScene,
  AIScene,
  ServicesScene,
  CTAScene,
  OutroScene,
];

const boundaries = SCHEDULE.map((s) => Math.round(s.start * FPS));

export const VideoContent: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#f6efe3", overflow: "hidden" }}>
      <Background />
      {SCENE_COMPS.map((Comp, i) => {
        const from = boundaries[i];
        const to = i + 1 < boundaries.length ? boundaries[i + 1] : VIDEO_DURATION;
        const CompScoped = Comp as React.ComponentType;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <CompScoped />
          </Sequence>
        );
      })}
      <Wipes boundaries={boundaries.slice(1)} />
      <FilmGrain />
      <HUD />
      {/* warm vignette */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 58%, rgba(88,56,18,0.22) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
