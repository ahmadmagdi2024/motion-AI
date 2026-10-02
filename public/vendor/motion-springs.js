/* === Motion Springs Physics Engine === */
(function(w){
  function spring(t, k, d) {
    if (k === undefined) k = 170;
    if (d === undefined) d = 26;
    if (t <= 0) return 0;
    var w0 = Math.sqrt(k), z = d / (2 * w0);
    if (z < 1) {
      var wd = w0 * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
    }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  }
  function track(t, keys, k, d) {
    if (k === undefined) k = 170;
    if (d === undefined) d = 26;
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
  if (!w.spring) w.spring = spring;
  if (!w.track) w.track = track;
  if (!w.indicator) w.indicator = indicator;
  if (!w.swapAlpha) w.swapAlpha = swapAlpha;
  if (!w.rng) w.rng = rng;
  if (!w.loopT) w.loopT = loopT;
})(typeof window !== 'undefined' ? window : globalThis);
