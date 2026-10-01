/**
 * Motion Studio Lottie Sync Helper
 * Allows seamless frame-by-frame scrubbing and timeline synchronization
 * for @lottiefiles/dotlottie-web canvas animations.
 */

export async function createLottieTrack({
  canvas,
  src,          // URL to .lottie / .json OR inline Lottie JSON object
  startSec = 0,
  durationSec = 3,
  loop = false,
}) {
  const canvasEl = typeof canvas === 'string' ? document.querySelector(canvas) : canvas;
  if (!canvasEl) return () => {};

  let DotLottieClass;
  try {
    const mod = await import('/vendor/dotlottie/index.js');
    DotLottieClass = mod.DotLottie;
  } catch (e) {
    const mod = await import('https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm');
    DotLottieClass = mod.DotLottie;
  }

  const dotLottie = new DotLottieClass({
    canvas: canvasEl,
    src: typeof src === 'string' ? src : undefined,
    data: typeof src === 'object' ? src : undefined,
    autoplay: false,
    loop: false,
  });

  let isReady = false;
  dotLottie.addEventListener('load', () => { isReady = true; });

  return function update(t) {
    if (!isReady || !dotLottie.totalFrames) return;
    if (t < startSec) {
      dotLottie.setFrame(0);
      return;
    }
    const elapsed = t - startSec;
    if (elapsed > durationSec && !loop) {
      dotLottie.setFrame(dotLottie.totalFrames - 1);
      return;
    }
    const progress = loop 
      ? (elapsed % durationSec) / durationSec 
      : Math.min(1, elapsed / durationSec);
    const targetFrame = Math.round(progress * (dotLottie.totalFrames - 1));
    dotLottie.setFrame(targetFrame);
  };
}

if (typeof window !== 'undefined') {
  window.createLottieTrack = createLottieTrack;
}
