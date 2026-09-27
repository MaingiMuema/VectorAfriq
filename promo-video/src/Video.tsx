import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile } from "remotion";
import { FPS, SCHEDULE, VIDEO_DURATION } from "./timings";
import { FontsGate } from "./Fonts";
import { VideoContent } from "./VideoContent";

const Narration: React.FC = () => (
  <>
    {SCHEDULE.map((line) => (
      <Sequence
        key={line.name}
        from={Math.round(line.start * FPS)}
        durationInFrames={Math.ceil(line.duration * FPS)}
      >
        <Audio src={staticFile(`narration/${line.name}.mp3`)} />
      </Sequence>
    ))}
  </>
);

const musicVolume = (frame: number): number => {
  const t = frame / FPS;
  const fadeIn = Math.min(1, Math.max(0, t / 1.2));
  const fadeOut = Math.min(1, Math.max(0, (VIDEO_DURATION - frame) / 30));
  let duck = 1;
  for (const line of SCHEDULE) {
    if (t >= line.start - 0.15 && t <= line.start + line.duration + 0.3) {
      duck = 0.45;
      break;
    }
  }
  return fadeIn * fadeOut * 0.34 * duck;
};

const Music: React.FC = () => (
  <Audio src={staticFile("music.wav")} volume={musicVolume} />
);

export const LandscapeVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#f6efe3" }}>
    <FontsGate>
      <VideoContent />
    </FontsGate>
    <Narration />
    <Music />
  </AbsoluteFill>
);

export const VerticalVideo: React.FC = () => {
  const scale = 1080 / 1920;
  return (
    <AbsoluteFill style={{ backgroundColor: "#ecdfcc" }}>
      {/* warm blurred backdrop fills the letterbox */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile("images/hero.jpeg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(1.05) saturate(1.2)", transform: "scale(1.4)" }}
        />
        <AbsoluteFill style={{ background: "rgba(246,239,227,0.55)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: 1080,
            height: 1920,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <FontsGate>
            <VideoContent />
          </FontsGate>
        </div>
      </AbsoluteFill>
      <Narration />
      <Music />
    </AbsoluteFill>
  );
};
