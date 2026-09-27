import React from "react";
import { AbsoluteFill, Audio, Sequence, getInputProps, staticFile } from "remotion";
import { FPS } from "./timings";
import { FontsGate } from "./Fonts";
import { Background } from "./components/Background";
import { FilmGrain } from "./components/FilmGrain";
import { HUD } from "./components/HUD";
import { Wipes } from "./components/Wipes";
import { Intro } from "./scenes/Intro";
import { MessageScene } from "./scenes/MessageScene";
import { SearchScene } from "./scenes/SearchScene";
import { ServicesScene } from "./scenes/ServicesScene";
import { CTAScene } from "./scenes/CTAScene";
import { OutroScene } from "./scenes/OutroScene";
import { JobScriptProvider, type JobScript, type JobTiming } from "./job/script";
import { COLORS, usePalette } from "./theme";

interface JobVideoInput {
  script: JobScript;
  schedule: JobTiming[];
  durationInFrames: number;
}

const SCENE_COMPONENTS: Record<
  string,
  React.ComponentType<{ index?: number }>
> = {
  intro: Intro,
  message: MessageScene,
  listing: SearchScene,
  services: ServicesScene,
  cta: CTAScene,
  outro: OutroScene,
};

const musicVolume = (
  frame: number,
  schedule: JobTiming[],
  durationInFrames: number
): number => {
  const t = frame / FPS;
  const fadeIn = Math.min(1, Math.max(0, t / 1.2));
  const fadeOut = Math.min(1, Math.max(0, (durationInFrames - frame) / 30));
  let duck = 1;
  for (const line of schedule) {
    if (t >= line.start - 0.15 && t <= line.start + line.duration + 0.3) {
      duck = 0.45;
      break;
    }
  }
  return fadeIn * fadeOut * 0.34 * duck;
};

/**
 * Scripted promo composition. Reads the job script + timing schedule from input
 * props (set by scripts/render-job.mjs) and renders the scripted scenes, TTS
 * narration clips and synthesized music bed. When no props are provided (e.g.
 * opening the composition in Studio without a script) it renders a styled
 * placeholder.
 */
export const JobVideo: React.FC = () => {
  const input = React.useMemo(
    () => getInputProps() as Partial<JobVideoInput> | undefined,
    []
  );
  const script = input?.script;
  const schedule = input?.schedule ?? [];
  const durationInFrames = input?.durationInFrames ?? FPS * 60;
  const palette = usePalette();

  if (!script || !script.scenes || script.scenes.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.paper,
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Inter, sans-serif",
          color: COLORS.ink,
          fontSize: 40,
          textAlign: "center",
          padding: 80,
        }}
      >
        <div>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎬</div>
          No job script provided. Render this composition via scripts/render-job.mjs
        </div>
      </AbsoluteFill>
    );
  }

  const boundaries = schedule.map((t) => Math.round(t.start * FPS));
  const sceneFrames = schedule.map((t, i) => {
    const from = boundaries[i];
    const to =
      i + 1 < boundaries.length ? boundaries[i + 1] : durationInFrames;
    return { from, to };
  });
  // The render pipeline always emits one timing entry per scene, but guard
  // against a script that has more scenes than timings so nothing overlaps.
  const renderableScenes = script.scenes.slice(0, sceneFrames.length);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, overflow: "hidden" }}>
      <FontsGate>
        <Background />
        <JobScriptProvider value={script}>
          {renderableScenes.map((scene, i) => {
            const Comp = SCENE_COMPONENTS[scene.type] ?? MessageScene;
            const { from, to } = sceneFrames[i];
            return (
              <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>
                <Comp index={i} />
              </Sequence>
            );
          })}
          <Wipes boundaries={boundaries.slice(1)} />
          <FilmGrain />
          <HUD schedule={schedule} totalScenes={script.scenes.length} />
          {/* vignette */}
          <AbsoluteFill
            style={{
              pointerEvents: "none",
              background: `radial-gradient(ellipse at center, transparent 58%, ${palette.vignette} 100%)`,
            }}
          />
        </JobScriptProvider>
      </FontsGate>

      {/* narration */}
      {schedule.map((t) => (
        <Sequence
          key={t.scene}
          from={Math.round(t.start * FPS)}
          durationInFrames={Math.max(1, Math.ceil(t.duration * FPS))}
        >
          <Audio src={staticFile(`narration/${t.scene}.mp3`)} />
        </Sequence>
      ))}
      {/* music */}
      <Audio
        src={staticFile("music.wav")}
        volume={(f) => musicVolume(f, schedule, durationInFrames)}
      />
    </AbsoluteFill>
  );
};
