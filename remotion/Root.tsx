import React from "react";
import {Composition} from "remotion";
import {VideoComposition} from "./VideoComposition";
import {createLocalProject} from "../lib/local-planner";
import {totalFrames, type VideoProject} from "../lib/schema";

export const REMOTION_COMPOSITION_ID = "AiVideo";

const sample = createLocalProject({
  prompt: "A cinematic brand story",
  language: "ar",
  duration: 30,
  assets: [],
});

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id={REMOTION_COMPOSITION_ID}
      component={VideoComposition}
      durationInFrames={totalFrames(sample)}
      fps={sample.fps || 30}
      width={sample.width || 1080}
      height={sample.height || 1920}
      defaultProps={{
        project: sample,
      }}
      calculateMetadata={({props}) => {
        const p = (props as {project: VideoProject}).project;
        const fps = p.fps || 30;
        const durationInFrames = totalFrames(p) || Math.max(1, Math.round(30 * fps));

        return {
          fps,
          durationInFrames,
          width: p.width || 1080,
          height: p.height || 1920,
        };
      }}
    />
  );
};
