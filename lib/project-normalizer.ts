import type {Scene, VideoProject} from './schema';

const MIN_SCENE_FRAMES = 30;

export function normalizeSceneDurations(project: VideoProject, targetSeconds: number): VideoProject {
  const target = Math.max(MIN_SCENE_FRAMES, Math.round(targetSeconds * project.fps));
  let scenes = project.scenes.slice();

  while (scenes.length > 1 && scenes.length * MIN_SCENE_FRAMES > target) scenes = scenes.slice(0, -1);
  const requested = scenes.map((scene) => Math.max(MIN_SCENE_FRAMES, Math.round(scene.durationInFrames || MIN_SCENE_FRAMES)));
  const flexible = target - scenes.length * MIN_SCENE_FRAMES;
  const weights = requested.map((value) => Math.max(1, value - MIN_SCENE_FRAMES));
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  let used = 0;

  const normalized = scenes.map((scene, index) => {
    const extra = index === scenes.length - 1
      ? flexible - used
      : Math.floor(flexible * (weights[index] / weightTotal));
    used += extra;
    return {...scene, durationInFrames: MIN_SCENE_FRAMES + Math.max(0, extra)};
  });

  const actual = normalized.reduce((sum, scene) => sum + scene.durationInFrames, 0);
  normalized[normalized.length - 1].durationInFrames += target - actual;
  return {...project, scenes: normalized};
}

export function cleanProjectAssetIds(project: VideoProject, validIds: Set<string>): VideoProject {
  const clean = (id?: string | null) => id && validIds.has(id) ? id : undefined;
  return {
    ...project,
    musicAssetId: clean(project.musicAssetId),
    brand: {...project.brand, logoAssetId: clean(project.brand.logoAssetId)},
    scenes: project.scenes.map((scene: Scene) => ({
      ...scene,
      backgroundAssetId: clean(scene.backgroundAssetId),
      foregroundAssetId: clean(scene.foregroundAssetId)
    }))
  };
}
