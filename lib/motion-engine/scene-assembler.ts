/**
 * Scene Assembler — Phase 3 of the 3-phase pipeline.
 * Stitches all generated scenes into a single standalone HTML document.
 * No LLM call needed — purely mechanical assembly.
 */
import "server-only";
import type { ScenePlan } from "./scene-planner";
import type { GeneratedScene } from "./scene-generator";

export function assembleFilm(
  plan: ScenePlan,
  scenes: GeneratedScene[],
): string {
  const totalDuration = plan.totalDuration;

  // Build combined CSS from all scenes
  const combinedCSS = scenes.map(s => s.css).filter(Boolean).join("\n\n");

  // Build scene HTML elements
  const scenesHTML = scenes.map((s, i) => {
    const planItem = plan.scenes[i];
    return `    <!-- Scene ${i}: ${s.title} [${planItem.startTime}s - ${planItem.endTime}s] -->
    <div id="scene-${i}" class="scene" data-start="${planItem.startTime}" data-end="${planItem.endTime}">
      ${s.html}
    </div>`;
  }).join("\n\n");

  // Build scene render functions
  const sceneRenderFunctions = scenes.map((s, i) => {
    const planItem = plan.scenes[i];
    return `
      // ═══ Scene ${i}: ${s.title} [${planItem.startTime}s - ${planItem.endTime}s] ═══
      function renderScene_${i}(t, sceneEl) {
        try {
          ${s.js}
        } catch (sceneErr) {
          console.warn("Scene ${i} execution warning:", sceneErr);
        }
      }`;
  }).join("\n");

  // Build scene timing data
  const sceneTimingArray = plan.scenes.map((s, i) => 
    `{ idx: ${i}, start: ${s.startTime}, end: ${s.endTime}, render: renderScene_${i} }`
  ).join(",\n        ");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${plan.filmTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap');

    :root {
      --primary: ${plan.scenes[0]?.colorPalette?.primary || '#d9b66d'};
      --accent: ${plan.scenes[0]?.colorPalette?.accent || '#f5e3b8'};
      --bg: ${plan.scenes[0]?.colorPalette?.bg || '#050606'};
    }

    *{box-sizing:border-box;margin:0;padding:0}
    html,body{
      width:100%;height:100%;overflow:hidden;
      background:var(--bg);color:white;
      font-family:Cairo,sans-serif;position:relative;
    }

    #film-stage{
      position:absolute;
      width:1080px;height:1920px;
      left:50%;top:50%;
      overflow:hidden;
      transform-origin:center center;
      background:var(--bg);
      isolation:isolate;
    }

    #film-stage.english{direction:ltr;font-family:Montserrat,sans-serif}

    .scene{
      position:absolute;inset:0;
      width:1080px;height:1920px;
      overflow:hidden;
      opacity:0;visibility:hidden;
    }
    .scene.visible{visibility:visible}

    .vignette{
      position:absolute;inset:0;z-index:30;pointer-events:none;
      background:
        linear-gradient(180deg,rgba(0,0,0,.22),transparent 25%,transparent 65%,rgba(0,0,0,.65)),
        radial-gradient(circle,transparent 38%,rgba(0,0,0,.5) 120%);
    }

    .grain{
      position:absolute;inset:-40%;z-index:31;pointer-events:none;opacity:.055;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    /* ═══ Scene-specific CSS ═══ */
    ${combinedCSS}
  </style>
</head>
<body>
  <div id="film-stage">
    <div class="vignette"></div>
    <div class="grain"></div>

${scenesHTML}
  </div>

<script>
(function(){
  "use strict";

  // ═══ Math utilities ═══
  const clamp = (v, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v));
  const ease = p => 1 - Math.pow(1 - clamp(p), 3);
  const easeInOut = p => { p = clamp(p); return p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2; };
  const easeOut = ease;
  const easeIn = p => clamp(p) * clamp(p) * clamp(p);
  const elastic = t => { const p=0.3; return Math.pow(2,-10*t)*Math.sin((t-p/4)*(2*Math.PI)/p)+1; };
  const mix = (a, b, p) => a + (b - a) * clamp(p);
  const $ = id => document.getElementById(id);

  const stage = $("film-stage");
  const TOTAL_DURATION = ${totalDuration};
  let time = 0;
  let playing = false;
  let origin = 0;
  let originTime = 0;
  let frame = 0;

  // ═══ Scene definitions ═══
  const SCENES = [
        ${sceneTimingArray}
      ];

  const sceneEls = SCENES.map(s => $("scene-" + s.idx));

  // ═══ Scene render functions ═══
  ${sceneRenderFunctions}

  // ═══ Main render ═══
  function renderAtTime(t) {
    time = clamp(t, 0, TOTAL_DURATION);

    // Find active scene
    let activeIdx = -1;
    for (let i = 0; i < SCENES.length; i++) {
      if (time >= SCENES[i].start && time < SCENES[i].end) {
        activeIdx = i;
        break;
      }
    }
    if (activeIdx === -1) activeIdx = SCENES.length - 1;

    // Show/hide scenes with crossfade
    for (let i = 0; i < SCENES.length; i++) {
      const el = sceneEls[i];
      if (!el) continue;

      if (i === activeIdx) {
        el.classList.add("visible");
        const localT = time - SCENES[i].start;
        const dur = SCENES[i].end - SCENES[i].start;

        // Fade in/out at boundaries
        let opacity = 1;
        if (localT < 0.4) opacity = ease(localT / 0.4);
        if (dur - localT < 0.4) opacity = Math.min(opacity, ease((dur - localT) / 0.4));
        el.style.opacity = opacity;

        // Call scene-specific render
        try {
          SCENES[i].render(localT, el);
        } catch(e) {
          console.warn("Scene " + i + " render error:", e.message);
        }
      } else {
        el.classList.remove("visible");
        el.style.opacity = 0;
      }
    }
  }

  // ═══ Playback engine ═══
  function tick(now) {
    if (!playing) return;
    const elapsed = (now - origin) / 1000;
    const t = originTime + elapsed;
    if (t >= TOTAL_DURATION) {
      renderAtTime(TOTAL_DURATION);
      playing = false;
      return;
    }
    renderAtTime(t);
    frame = requestAnimationFrame(tick);
  }

  function play() {
    if (time >= TOTAL_DURATION) renderAtTime(0);
    playing = true;
    origin = performance.now();
    originTime = time;
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    playing = false;
    cancelAnimationFrame(frame);
  }

  function toggle() { playing ? stop() : play(); }

  function setLanguage(lang) {
    stage.classList.toggle("english", lang === "en");
    stage.dir = lang === "ar" ? "rtl" : "ltr";
  }

  // ═══ Auto-scale ═══
  function resize() {
    if (!stage) return;
    const scale = Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
    stage.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
  }

  window.addEventListener("resize", resize);
  resize();
  renderAtTime(0);

  // ═══ Studio API ═══
  window.renderAtTime = renderAtTime;
  window.__studioAPI = {
    play, stop, toggle, renderAtTime,
    getTime: () => time,
    isPlaying: () => playing,
    setLanguage
  };

  setTimeout(() => play(), 300);
})();
</script>
</body>
</html>`;

  console.log(`[SceneAssembler] Film assembled: "${plan.filmTitle}", ${scenes.length} scenes, ${html.length} chars total`);
  return html;
}
