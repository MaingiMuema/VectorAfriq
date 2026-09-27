import React from "react";
import { Composition, getInputProps } from "remotion";
import { FPS, VIDEO_DURATION } from "./timings";
import { LandscapeVideo, VerticalVideo } from "./Video";
import { JobVideo } from "./JobVideo";
import type { JobDesign, JobVideoProps } from "./job/script";
import { derivePalette } from "./theme";

const DEFAULT_JOB_PROPS: JobVideoProps = {
  script: {
    brand: {
      name: "VectorAfriq",
      tagline: "Your home. Your future.",
      website: "vectorafriqproperties.co.ke",
    },
    scenes: [
      { type: "intro", narration: "Welcome to VectorAfriq." },
      {
        type: "listing",
        narration: "Homes for every budget, all in one place.",
        kicker: "Smart search",
        headline: "Filter like a pro.",
        subline: "Find your match.",
        searchQuery: "3-bedroom house in Kilimani",
        items: [
          { title: "4 Bed Villa — Kilimani", price: "KSh 48,500,000", image: "house1.jpg" },
          { title: "3 Bed Apartment — Westlands", price: "KSh 26,000,000", image: "house2.jpg" },
          { title: "5 Bed Mansion — Karen", price: "KSh 92,000,000", image: "house3.jpg" },
        ],
      },
      {
        type: "services",
        narration: "Valuations, mortgages, legal support and moving day.",
        kicker: "Beyond the listing",
        headline: "The whole journey.",
        subline: "One platform.",
        items: [
          { title: "Valuation", sub: "Know your property's true worth", icon: "🏠", image: "house1.jpg" },
          { title: "Mortgages", sub: "Financing that fits your budget", icon: "🏦", image: "house2.jpg" },
          { title: "Legal", sub: "Verified title checks", icon: "⚖️", image: "house3.jpg" },
          { title: "Moving", sub: "Settle in smoothly", icon: "🚚", image: "house4.jpg" },
        ],
      },
      {
        type: "cta",
        narration: "Find your next home today.",
        headline: "STOP SCROLLING.",
        subline: "START LIVING.",
        button: "Find your home →",
      },
      { type: "outro", narration: "VectorAfriq. Your home. Your future." },
    ],
  },
  schedule: [
    { scene: 0, start: 0, duration: 4 },
    { scene: 1, start: 5, duration: 6 },
    { scene: 2, start: 12, duration: 6 },
    { scene: 3, start: 19, duration: 5 },
    { scene: 4, start: 25, duration: 4 },
  ],
  durationInFrames: 1800,
};

const resolveDuration = (props: Partial<JobVideoProps> | undefined): number =>
  typeof props?.durationInFrames === "number" && props.durationInFrames > 0
    ? props.durationInFrames
    : VIDEO_DURATION;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="vectorafriq-promo"
        component={LandscapeVideo}
        durationInFrames={VIDEO_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="vectorafriq-promo-vertical"
        component={VerticalVideo}
        durationInFrames={VIDEO_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="vectorafriq-promo-job"
        component={JobVideo}
        defaultProps={DEFAULT_JOB_PROPS}
        durationInFrames={VIDEO_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        calculateMetadata={({ props }) => ({
          durationInFrames: resolveDuration(props as Partial<JobVideoProps>),
        })}
      />
      <Composition
        id="vectorafriq-promo-job-vertical"
        component={VerticalJobVideo}
        defaultProps={DEFAULT_JOB_PROPS}
        durationInFrames={VIDEO_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
        calculateMetadata={({ props }) => ({
          durationInFrames: resolveDuration(props as Partial<JobVideoProps>),
        })}
      />
    </>
  );
};

const VerticalJobVideo: React.FC = () => {
  const scale = 1080 / 1920;
  const input = React.useMemo(
    () => getInputProps() as { script?: { design?: Partial<JobDesign> } } | undefined,
    []
  );
  // The letterbox backdrop follows the scripted design so dark (midnight) or
  // amber (sunset) directions don't clash with the cream fallback.
  const palette = derivePalette(input?.script?.design);
  return (
    <AbsoluteFillJobWrap backgroundColor={palette.surfaceDeep}>
      <div
        style={{
          width: 1080,
          height: 1920,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <JobVideo />
      </div>
    </AbsoluteFillJobWrap>
  );
};

/** Backdrop fills the letterbox of the vertical job video. */
const AbsoluteFillJobWrap: React.FC<{
  children: React.ReactNode;
  backgroundColor: string;
}> = ({ children, backgroundColor }) => (
  <div style={{ width: "100%", height: "100%", backgroundColor, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
    {children}
  </div>
);
