/**
 * Closed-form Analytical Springs & Physics Engine
 * Inspired by modern code-to-video studio architectures (Movez / Opus 5.5).
 * 
 * Provides pure analytical functions of time (seek(t) friendly):
 * - No tick-based simulation state
 * - O(1) random access frame evaluation
 * - Natural physical overshoot and mass
 */

export interface SpringConfig {
  k: number; // Stiffness
  d: number; // Damping
}

export const SPRING_PRESETS: Record<string, SpringConfig> = {
  snappy: { k: 320, d: 28 },   // Fast UI: buttons, toggles, leading edges
  default: { k: 170, d: 26 },  // Smooth cards, containers, cameras
  heavy: { k: 110, d: 22 },    // High-mass: big typography, 3D titles, logos
  bouncy: { k: 220, d: 16 },   // Playful: mascots, badges, visible bounce
};

/**
 * Closed-form damped spring function, evaluates 0 -> 1.
 * Pure mathematical function of elapsed time t.
 */
export function spring(t: number, k = 170, d = 26): number {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k);
  const z = d / (2 * w0);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  // Critically damped or overdamped fallback
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

/**
 * Multi-target keyframe tracker: superposition of independent spring responses.
 * Allows arbitrary sequences of targets without state simulation.
 * @param t current time
 * @param keys Array of [timestamp, targetValue] sorted by time
 */
export function track(t: number, keys: [number, number][], k = 170, d = 26): number {
  if (!keys || keys.length === 0) return 0;
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t >= keys[i][0]) {
      v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], k, d);
    }
  }
  return v;
}

/**
 * Asymmetric tab / pill stretch indicator.
 * Leading edge has stiffer spring than trailing edge, physically stretching during motion.
 */
export function indicator(t: number, stops: [number, number][]): { left: number; right: number; width: number } {
  const lead = track(t, stops, 320, 30);
  const trail = track(t, stops, 140, 22);
  const left = Math.min(lead, trail);
  const right = Math.max(lead, trail) + 120;
  return { left, right, width: Math.max(120, right - left) };
}

/**
 * Content cross-fade helper inside morphing containers.
 * Fades in after morph starts, fades out before next morph begins.
 */
export function swapAlpha(t: number, tIn: number, tOut: number): number {
  const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  return Math.min(clamp((t - tIn - 0.08) / 0.12), clamp((tOut - 0.1 - t) / 0.1));
}

/**
 * Deterministic PRNG (mulberry32).
 * Guarantees identical frame rendering on every run (never use Math.random in seek(t)).
 */
export function rng(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seamless periodic timeline loop.
 */
export function loopT(t: number, dur: number): number {
  return ((t % dur) + dur) % dur;
}

/**
 * Embedded JavaScript runtime string to inject into any standalone HTML video canvas.
 */
export function getSpringsInjectionCode(): string {
  return `
/* === Motion Springs Physics Engine === */
(function(w){
  function spring(t, k=170, d=26) {
    if (t <= 0) return 0;
    var w0 = Math.sqrt(k), z = d / (2 * w0);
    if (z < 1) {
      var wd = w0 * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
    }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  }
  function track(t, keys, k=170, d=26) {
    if (!keys || !keys.length) return 0;
    var v = keys[0][1];
    for (var i = 1; i < keys.length; i++) {
      if (t >= keys[i][0]) {
        v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], k, d);
      }
    }
    return v;
  }
  function indicator(t, stops) {
    var lead = track(t, stops, 320, 30);
    var trail = track(t, stops, 140, 22);
    var l = Math.min(lead, trail);
    var r = Math.max(lead, trail) + 120;
    return { left: l, right: r, width: Math.max(120, r - l) };
  }
  function swapAlpha(t, tIn, tOut) {
    var clamp = function(x, a, b){ return Math.min(b===undefined?1:b, Math.max(a===undefined?0:a, x)); };
    return Math.min(clamp((t - tIn - 0.08) / 0.12), clamp((tOut - 0.1 - t) / 0.1));
  }
  function rng(seed) {
    return function() {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function loopT(t, dur) { return ((t % dur) + dur) % dur; }
  
  w.MotionSprings = {
    spring: spring,
    track: track,
    indicator: indicator,
    swapAlpha: swapAlpha,
    rng: rng,
    loopT: loopT,
    presets: {
      snappy: { k: 320, d: 28 },
      default: { k: 170, d: 26 },
      heavy: { k: 110, d: 22 },
      bouncy: { k: 220, d: 16 }
    }
  };
  // Expose directly to window for seamless script use
  if (!w.spring) w.spring = spring;
  if (!w.track) w.track = track;
  if (!w.indicator) w.indicator = indicator;
  if (!w.swapAlpha) w.swapAlpha = swapAlpha;
  if (!w.rng) w.rng = rng;
  if (!w.loopT) w.loopT = loopT;
})(typeof window !== 'undefined' ? window : globalThis);
`;
}
