/**
 * Universal Studio API Bridge for Motion Graphic HTML films.
 * Guarantees that every film preview inside PlayerView or Export
 * provides the standard `window.__studioAPI` and `window.renderAtTime` contract:
 * {
 *   play: (from?: number) => void,
 *   stop: () => void,
 *   toggle: () => void,
 *   renderAtTime: (t: number) => void,
 *   getTime: () => number,
 *   isPlaying: () => boolean,
 *   setLanguage: (lang: string) => void
 * }
 */

import { getSpringsInjectionCode } from "./springs";

export function injectStudioBridge(html: string, durationSeconds: number = 30): string {
  if (!html) return html;

  // Don't inject multiple times if already present
  if (html.includes("__motion_studio_bridge__")) {
    return html;
  }

  let sanitized = html;

  // 1. Critical Syntax Guard: Ensure any unclosed <script> is properly terminated first
  const lastScriptOpen = sanitized.lastIndexOf("<script");
  const lastScriptClose = sanitized.lastIndexOf("</script>");
  if (lastScriptOpen > -1 && (lastScriptClose < lastScriptOpen || lastScriptClose === -1)) {
    // Balance any unclosed braces before closing tag
    const scriptBody = sanitized.substring(lastScriptOpen);
    const openBraces = (scriptBody.match(/\{/g) || []).length;
    const closeBraces = (scriptBody.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      sanitized += "\n" + "}".repeat(openBraces - closeBraces) + "\n";
    }
    sanitized += "\n</script>\n";
  }

  const durationNum = Number(durationSeconds) || 30;

  const bridgeScript = `<script id="__motion_studio_bridge__">
(function() {
  try {
    if (typeof window.renderAtTime !== 'function' && typeof renderAtTime === 'function') {
      window.renderAtTime = renderAtTime;
    }
  } catch(e) {}

  if (window.__studioAPI && typeof window.__studioAPI.toggle === 'function') {
    return;
  }

  var DURATION = ${durationNum} || (window.motionProject && window.motionProject.duration) || (window.motion && window.motion.duration) || 30;
  var _time = 0;
  var _playing = false;
  var _raf = null;
  var _origin = 0;
  var _originTime = 0;

  function _getRenderFn() {
    if (typeof window.renderAtTime === 'function') return window.renderAtTime;
    if (window.motionProject && typeof window.motionProject.renderAtTime === 'function') return window.motionProject.renderAtTime;
    if (window.motion && typeof window.motion.renderAtTime === 'function') return window.motion.renderAtTime;
    try {
      if (typeof renderAtTime === 'function') return renderAtTime;
    } catch(e) {}
    return null;
  }

  function _tick(now) {
    if (!_playing) return;
    var next = _originTime + (now - _origin) / 1000;
    if (next >= DURATION) {
      _time = DURATION;
      _playing = false;
      var fn = _getRenderFn();
      if (fn) {
        try { fn(DURATION); } catch(e) {}
      }
      if (typeof window.pauseMotion === 'function') {
        try { window.pauseMotion(); } catch(e) {}
      } else if (window.motion && typeof window.motion.stop === 'function') {
        try { window.motion.stop(); } catch(e) {}
      }
      return;
    }
    _time = next;
    _enforceSceneIsolation(next);
    var fn = _getRenderFn();
    if (fn) {
      try { fn(next); } catch(e) {}
    }
    _raf = requestAnimationFrame(_tick);
  }

  function _play(from) {
    if (typeof from === 'number') {
      _time = Math.max(0, Math.min(DURATION, from));
    } else if (_time >= DURATION - 0.1) {
      _time = 0;
    }

    _playing = true;
    _origin = performance.now();
    _originTime = _time;

    // Trigger native playMotion or motion.play if available
    if (typeof window.playMotion === 'function') {
      try { window.playMotion(_time); } catch(e) {}
    } else if (window.motion && typeof window.motion.play === 'function') {
      try { window.motion.play(_time); } catch(e) {}
    }

    if (_raf) cancelAnimationFrame(_raf);
    _raf = requestAnimationFrame(_tick);
  }

  function _stop() {
    _playing = false;
    if (_raf) {
      cancelAnimationFrame(_raf);
      _raf = null;
    }
    if (typeof window.pauseMotion === 'function') {
      try { window.pauseMotion(); } catch(e) {}
    } else if (window.motion && typeof window.motion.stop === 'function') {
      try { window.motion.stop(); } catch(e) {}
    }
  }

  function _toggle() {
    if (_playing) _stop();
    else _play();
  }

  function _enforceSceneIsolation(t) {
    try {
      var scenes = document.querySelectorAll('.scene, [id^="scene-"]');
      if (scenes.length > 1) {
        scenes.forEach(function(sc, idx) {
          var start = parseFloat(sc.getAttribute('data-start'));
          var end = parseFloat(sc.getAttribute('data-end'));

          if (isNaN(start)) start = (idx * DURATION) / scenes.length;
          if (isNaN(end)) end = ((idx + 1) * DURATION) / scenes.length;

          if (t < start - 0.05 || t >= end + 0.05) {
            sc.style.opacity = '0';
            sc.style.visibility = 'hidden';
            sc.style.pointerEvents = 'none';
          } else {
            sc.style.visibility = 'visible';
            sc.style.pointerEvents = 'auto';
          }
        });
      }
    } catch(e) {}
  }

  function _renderAtTime(t) {
    _time = Math.max(0, Math.min(DURATION, Number(t) || 0));
    _originTime = _time;
    _origin = performance.now();
    _enforceSceneIsolation(_time);
    var fn = _getRenderFn();
    if (fn) {
      try { fn(_time); } catch(e) {}
    }
  }

  window.__studioAPI = {
    play: _play,
    stop: _stop,
    toggle: _toggle,
    renderAtTime: _renderAtTime,
    getTime: function() { return _time; },
    isPlaying: function() { return _playing; },
    setLanguage: function(l) {
      if (typeof window.setLanguage === 'function') {
        try { window.setLanguage(l); } catch(e) {}
      }
    }
  };

  // Initial draw at 0
  setTimeout(function() {
    var fn = _getRenderFn();
    if (fn && _time === 0) {
      try { fn(0); } catch(e) {}
    }
  }, 50);
})();
</script>`;

  const fullInjection = `<script id="__motion_springs_physics__">${getSpringsInjectionCode()}</script>\n${bridgeScript}`;

  if (sanitized.includes("</body>")) {
    return sanitized.replace("</body>", `${fullInjection}\n</body>`);
  }
  if (sanitized.includes("</html>")) {
    return sanitized.replace("</html>", `${fullInjection}\n</html>`);
  }
  return sanitized + "\n" + fullInjection + "\n</body>\n</html>";
}
