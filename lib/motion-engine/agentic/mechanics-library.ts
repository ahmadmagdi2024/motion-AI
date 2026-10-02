import "server-only";

export interface MotionMechanic {
  id: string;
  nameArabic: string;
  category: "data" | "comparison" | "process" | "display";
  bestFor: string;
  parameters: string;
  exampleCall: string;
  code: string;
}

export const CANV_RUNTIME_HELPERS = `
// ─── CANV / SVG RUNTIME HELPERS ───
const cl = (v, min, max) => Math.max(min, Math.min(max, v));
const eio = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const pr = (t, a, b) => a === b ? 1 : (t - a) / (b - a);
const rgba = (hex, a) => {
  if (!hex) return 'rgba(255,255,255,1)';
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return \`rgba(\${(num >> 16) & 255}, \${(num >> 8) & 255}, \${num & 255}, \${a !== undefined ? a : 1})\`;
};
function rr(x, y, w, h, r) {
  if (X.roundRect) { X.beginPath(); X.roundRect(x, y, w, h, r); return; }
  X.beginPath();
  X.moveTo(x + r, y);
  X.lineTo(x + w - r, y);
  X.quadraticCurveTo(x + w, y, x + w, y + r);
  X.lineTo(x + w, y + h - r);
  X.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  X.lineTo(x + r, y + h);
  X.quadraticCurveTo(x, y + h, x, y + h - r);
  X.lineTo(x, y + r);
  X.quadraticCurveTo(x, y, x + r, y);
  X.closePath();
}
function sh(b, y, a) { X.shadowColor = \`rgba(0,0,0,\${a || 0.35})\`; X.shadowBlur = b; X.shadowOffsetY = y; }
function nsh() { X.shadowColor = 'transparent'; X.shadowBlur = 0; X.shadowOffsetY = 0; }
function T(txt, x, y, font, col, align) {
  X.save();
  X.font = font;
  X.fillStyle = col;
  X.textAlign = align || 'center';
  X.textBaseline = 'middle';
  X.fillText(txt, x, y);
  X.restore();
}
`;

export const MOTION_MECHANICS: Record<string, MotionMechanic> = {
  odometer: {
    id: "odometer",
    nameArabic: "عدّاد الأرقام الميكانيكي الدوار",
    category: "data",
    bestFor: "الأرقام الكبيرة، الإحصائيات، النمو، الأسعار والنتائج المالية",
    parameters: "odometer(cx, cy, val, k, { label, fs, col })",
    exampleCall: "odometer(540, 960, 48500, k, { label: 'مستخدم نشط', fs: 96 })",
    code: `/* ① عدّاد أرقام يلف وينزل على الرقم — للأرقام والأسعار */
function odometer(cx, cy, val, k, o) {
  o = o || {};
  const txt = String(Math.floor(val * cl(k, 0, 1)));
  const fs = o.fs || 96, dw = fs * 0.62;
  X.save();
  X.font = '700 ' + fs + 'px ' + FONT;
  X.textAlign = 'center';
  X.textBaseline = 'middle';
  const tot = txt.length * dw, x0 = cx - tot / 2 + dw / 2;
  for (let i = 0; i < txt.length; i++) {
    const x = x0 + i * dw;
    X.save();
    rr(x - dw / 2 + 3, cy - fs * 0.62, dw - 6, fs * 1.24, 14);
    X.clip();
    X.fillStyle = rgba(SKY, 0.10);
    X.fillRect(x - dw / 2 + 3, cy - fs * 0.62, dw - 6, fs * 1.24);
    const d = +txt[i], frac = (val * k * Math.pow(10, txt.length - 1 - i)) % 1;
    X.fillStyle = o.col || CREAM;
    X.fillText(String(d), x, cy + frac * fs * 0.2);
    X.globalAlpha *= 0.25;
    X.fillText(String((d + 9) % 10), x, cy + frac * fs * 0.2 - fs * 1.1);
    X.restore();
  }
  X.restore();
  if (o.label) T(o.label, cx, cy + fs * 0.95, '700 34px ' + FONT, SKY);
}`,
  },

  dotGrid: {
    id: "dotGrid",
    nameArabic: "شبكة النقاط التفاعلية (1 من كثير)",
    category: "data",
    bestFor: "إظهار الندرة، الاحتمالات، نسبة 1 من 100، أو الحالات الشاذة والفرص",
    parameters: "dotGrid(x, y, w, h, cols, rows, oneIdx, k, o)",
    exampleCall: "dotGrid(140, 700, 800, 400, 10, 5, 23, k)",
    code: `/* ② شبكة نقاط — واحد من كثير. للنسب النادرة والاحتمالات */
function dotGrid(x, y, w, h, cols, rows, oneIdx, k, o) {
  o = o || {}; const gx = w / cols, gy = h / rows, n = cols * rows;
  const shown = Math.floor(n * eio(cl(k, 0, 1)));
  X.save();
  for (let i = 0; i < n; i++) {
    if (i > shown) break;
    const cx = x + (i % cols) * gx + gx / 2, cy = y + Math.floor(i / cols) * gy + gy / 2;
    const one = i === oneIdx;
    if (one) {
      X.save(); X.globalAlpha *= 0.6; X.shadowColor = rgba(ACC, 0.9); X.shadowBlur = 22;
      X.fillStyle = ACC; X.beginPath(); X.arc(cx, cy, Math.min(gx, gy) * 0.30, 0, 7); X.fill(); nsh(); X.restore();
    }
    X.fillStyle = one ? ACC : rgba(SKY, 0.30);
    X.beginPath(); X.arc(cx, cy, Math.min(gx, gy) * (one ? 0.30 : 0.16), 0, 7); X.fill();
  }
  X.restore();
}`,
  },

  donutSplit: {
    id: "donutSplit",
    nameArabic: "مخطط الدونات المنفصل للنسب",
    category: "data",
    bestFor: "النسب المئوية، تقسيم الميزانية أو الحصص السوقية والقطاعات",
    parameters: "donutSplit(cx, cy, r, items: [{v, s, label}], t, { th })",
    exampleCall: "donutSplit(540, 960, 220, [{v: 60, s: 1.0}, {v: 40, s: 2.5}], t, { th: 46 })",
    code: `/* ③ دائرة تُقسم لقطاعات — للتقسيم والنسب */
function donutSplit(cx, cy, r, items, t, o) {
  o = o || {}; const th = o.th || 46;
  X.save();
  X.strokeStyle = rgba(SKY, 0.14); X.lineWidth = th;
  X.beginPath(); X.arc(cx, cy, r, 0, 7); X.stroke();
  let ang = -Math.PI / 2;
  const sum = items.reduce((a, b) => a + b.v, 0) || 1;
  items.forEach((it, i) => {
    const k = eio(cl(pr(t, it.s, it.s + 0.55), 0, 1)); if (k <= 0) return;
    const sweep = (it.v / sum) * Math.PI * 2;
    const live = t >= it.s && t < it.s + 1.1;
    X.strokeStyle = live ? WARM : rgba(ACC, 0.62 - i * 0.08);
    X.lineWidth = live ? th + 8 : th; X.lineCap = 'butt';
    X.beginPath(); X.arc(cx, cy, r, ang, ang + sweep * k); X.stroke();
    ang += sweep;
  });
  X.restore();
}`,
  },

  flipCard: {
    id: "flipCard",
    nameArabic: "البطاقات ثلاثية الأبعاد القلابة (3D Flip)",
    category: "comparison",
    bestFor: "كشف المفاجآت، مقارنة قبل وبعد، سؤال وجواب، والتحول الجذري",
    parameters: "flipCard(x, y, w, h, frontText, backText, k, { fs })",
    exampleCall: "flipCard(180, 800, 720, 360, 'المفهوم التقليدي', 'الحل الذكي المبتكر', k)",
    code: `/* ④ بطاقات تنقلب — للكشف والمقارنة */
function flipCard(x, y, w, h, front, back, k, o) {
  o = o || {}; k = cl(k, 0, 1);
  const p = eio(k), sc = Math.abs(Math.cos(p * Math.PI)), showBack = p > 0.5;
  X.save();
  X.translate(x + w / 2, y + h / 2);
  X.scale(Math.max(0.02, sc), 1);
  X.translate(-(x + w / 2), -(y + h / 2));
  sh(26, 14, 0.38);
  X.fillStyle = showBack ? ACC : rgba(SKY, 0.10); rr(x, y, w, h, 26); X.fill(); nsh();
  X.strokeStyle = showBack ? rgba(WARM, 0.8) : rgba(SKY, 0.26); X.lineWidth = 2; rr(x, y, w, h, 26); X.stroke();
  T(showBack ? back : front, x + w / 2, y + h / 2 + 3, '700 ' + (o.fs || 40) + 'px ' + FONT, showBack ? CREAM : '#DCE3E7');
  X.restore();
}`,
  },

  stackBlocks: {
    id: "stackBlocks",
    nameArabic: "المكعبات المتراكمة بالفيزياء والسقوط",
    category: "data",
    bestFor: "تراكم المشاكل، تصاعد التكاليف، بناء الأساسات طبقة فوق طبقة",
    parameters: "stackBlocks(cx, baseY, n, k, { w, h })",
    exampleCall: "stackBlocks(540, 1200, 5, k, { w: 460, h: 56 })",
    code: `/* ⑤ كومة كتل تتراكم بفيزياء ارتداد — للتراكم والتكلفة */
function stackBlocks(cx, baseY, n, k, o) {
  o = o || {}; const bw = o.w || 420, bh = o.h || 52, gap = 8;
  const shown = Math.floor(n * eio(cl(k, 0, 1)));
  X.save();
  for (let i = 0; i <= shown && i < n; i++) {
    const drop = 1 - cl((k * n - i) * 2, 0, 1);
    const y = baseY - i * (bh + gap) - drop * 90;
    X.save(); X.globalAlpha *= (1 - drop * 0.6);
    const w = bw - i * 10;
    X.fillStyle = i === shown ? ACC : rgba(ACC, 0.34 + i * 0.05);
    sh(18, 9, 0.34); rr(cx - w / 2, y - bh, w, bh, 14); X.fill(); nsh();
    X.restore();
  }
  X.restore();
}`,
  },

  growBars: {
    id: "growBars",
    nameArabic: "الأعمدة البيانية المتصاعدة للمقارنة",
    category: "comparison",
    bestFor: "مقارنة قيمتين أو أكثر (قبل مقابل بعد، أسعار، أداء)",
    parameters: "growBars(x, baseY, w, items: [{t: 'اسم', v: 80, s: 1.2}], t, { h, gap })",
    exampleCall: "growBars(160, 1250, 760, [{t: 'الطريقة السابقة', v: 30, s: 0.5}, {t: 'مع نظامنا', v: 95, s: 2.0}], t)",
    code: `/* ⑥ أعمدة تنمو بتوهج — لمقارنة رقمين أو ثلاثة */
function growBars(x, baseY, w, items, t, o) {
  o = o || {}; const maxv = Math.max(...items.map(i => i.v), 1), gap = o.gap || 60;
  const bw = (w - gap * (items.length - 1)) / items.length, maxH = o.h || 420;
  X.save();
  items.forEach((it, i) => {
    const k = eio(cl(pr(t, it.s, it.s + 0.9), 0, 1)); if (k <= 0) return;
    const bx = x + i * (bw + gap), bh = maxH * (it.v / maxv) * k;
    const live = t >= it.s && t < it.s + 1.2;
    if (live) {
      X.save(); X.globalAlpha *= 0.5; X.shadowColor = rgba(ACC, 0.9); X.shadowBlur = 34;
      X.fillStyle = ACC; rr(bx, baseY - bh, bw, bh, 18); X.fill(); nsh(); X.restore();
    }
    X.fillStyle = live ? WARM : rgba(ACC, 0.55);
    rr(bx, baseY - bh, bw, bh, 18); X.fill();
    T(it.t, bx + bw / 2, baseY + 48, '700 32px ' + FONT, SKY);
    if (k > 0.9) T(String(it.v), bx + bw / 2, baseY - bh - 32, '700 40px ' + FONT, CREAM);
  });
  X.restore();
}`,
  },

  iconStrip: {
    id: "iconStrip",
    nameArabic: "شريط الأيقونات المتتابعة المضيئة",
    category: "display",
    bestFor: "تعداد مجالات أو مميزات متتالية، تسليط الضوء على كل ميزة مع نطقها",
    parameters: "iconStrip(cx, cy, items: [{t: 'النص', s: 1.0}], t, { r, gap })",
    exampleCall: "iconStrip(540, 960, [{t:'السرعة', s:1.0}, {t:'الأمان', s:2.0}, {t:'الدقة', s:3.0}], t)",
    code: `/* ⑦ صف أيقونات تتوهّج بالتتابع — لتعداد المجالات والميزات */
function iconStrip(cx, cy, items, t, o) {
  o = o || {}; const r = o.r || 62, gap = o.gap || 168, x0 = cx - (items.length - 1) * gap / 2;
  X.save();
  items.forEach((it, i) => {
    const k = eio(cl(pr(t, it.s, it.s + 0.35), 0, 1)); if (k <= 0) return;
    const live = t >= it.s && t < it.s + 1.0, x = x0 + i * gap;
    X.save(); X.globalAlpha *= k;
    if (live) {
      X.save(); X.globalAlpha *= 0.55; X.shadowColor = rgba(ACC, 0.95); X.shadowBlur = 38;
      X.fillStyle = ACC; X.beginPath(); X.arc(x, cy, r, 0, 7); X.fill(); nsh(); X.restore();
    }
    X.fillStyle = live ? ACC : rgba(SKY, 0.12);
    X.beginPath(); X.arc(x, cy, r, 0, 7); X.fill();
    X.strokeStyle = live ? rgba(WARM, 0.8) : rgba(SKY, 0.28); X.lineWidth = 2.5;
    X.beginPath(); X.arc(x, cy, r, 0, 7); X.stroke();
    T(it.t, x, cy + r + 46, '700 30px ' + FONT, live ? CREAM : rgba(SKY, 0.7));
    X.restore();
  });
  X.restore();
}`,
  },

  windingPath: {
    id: "windingPath",
    nameArabic: "المسار المتعرج بمحطات زمنية (Roadmap)",
    category: "process",
    bestFor: "خارطة الطريق، مراحل التنفيذ، رحلة العميل أو التطور التاريخي",
    parameters: "windingPath(x, y, w, h, items: [{t: 'مرحلة', s: 1.0}], t, o)",
    exampleCall: "windingPath(150, 850, 780, 160, [{t: 'التخطيط', s: 1.0}, {t: 'التطوير', s: 2.5}, {t: 'الإطلاق', s: 4.0}], t)",
    code: `/* ⑧ مسار متعرّج بمحطات — للرحلة والمراحل المتتابعة */
function windingPath(x, y, w, h, items, t, o) {
  o = o || {};
  const n = items.length, pts = [];
  for (let i = 0; i < n; i++) {
    pts.push([x + (w / (n - 1)) * i, y + (i % 2 ? h : 0)]);
  }
  const k = cl(pr(t, items[0].s, items[n - 1].s + 0.9), 0, 1);
  X.save();
  X.strokeStyle = rgba(SKY, 0.20); X.lineWidth = 5; X.lineCap = 'round'; X.lineJoin = 'round';
  X.beginPath(); X.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < n; i++) X.quadraticCurveTo(pts[i - 1][0] + (w / (n - 1)) / 2, pts[i - 1][1], pts[i][0], pts[i][1]);
  X.stroke();
  X.save(); X.beginPath(); X.rect(x - 10, y - h, w * k + 10, h * 3); X.clip();
  X.strokeStyle = ACC; X.lineWidth = 5; X.shadowColor = rgba(ACC, 0.7); X.shadowBlur = 16;
  X.beginPath(); X.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < n; i++) X.quadraticCurveTo(pts[i - 1][0] + (w / (n - 1)) / 2, pts[i - 1][1], pts[i][0], pts[i][1]);
  X.stroke(); nsh(); X.restore();
  items.forEach((it, i) => {
    const done = t >= it.s, live = t >= it.s && t < it.s + 1.1;
    X.fillStyle = done ? ACC : rgba(SKY, 0.16);
    X.beginPath(); X.arc(pts[i][0], pts[i][1], live ? 26 : 20, 0, 7); X.fill();
    T(it.t, pts[i][0], pts[i][1] + (i % 2 ? 52 : -46), '700 28px ' + FONT, done ? CREAM : rgba(SKY, 0.7));
  });
  X.restore();
}`,
  },

  rings: {
    id: "rings",
    nameArabic: "الدوائر متحدة المركز الدوارة (Concentric Rings)",
    category: "display",
    bestFor: "الهيكل الهرمي، الطبقات التقنية، الأولويات الدائرية والنظام البيئي",
    parameters: "rings(cx, cy, items: [{t: 'طبقة', s: 1.0}], t, { step, r0 })",
    exampleCall: "rings(540, 960, [{t:'النواة', s:1.0}, {t:'البرمجيات', s:2.0}, {t:'المستخدم', s:3.0}], t)",
    code: `/* ⑨ حلقات متحدة المركز — للطبقات والأولويات والأنظمة */
function rings(cx, cy, items, t, o) {
  o = o || {}; const step = o.step || 58, r0 = o.r0 || 70;
  X.save();
  items.forEach((it, i) => {
    const k = eio(cl(pr(t, it.s, it.s + 0.55), 0, 1)); if (k <= 0) return;
    const live = t >= it.s && t < it.s + 1.1, r = r0 + i * step;
    X.save(); X.globalAlpha *= k;
    if (live) { X.shadowColor = rgba(ACC, 0.85); X.shadowBlur = 30; }
    X.strokeStyle = live ? WARM : rgba(ACC, 0.30 + 0.10 * i);
    X.lineWidth = live ? 16 : 11;
    X.beginPath(); X.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); X.stroke(); nsh();
    T(it.t, cx, cy - r - 24, '700 28px ' + FONT, live ? CREAM : rgba(SKY, 0.75));
    X.restore();
  });
  X.restore();
}`,
  },

  gauge: {
    id: "gauge",
    nameArabic: "عداد السرعة والمؤشر الحركي (Speed Gauge)",
    category: "data",
    bestFor: "السرعة، الضغط، الكفاءة، قياس الإنجاز ومؤشرات الأداء KPI",
    parameters: "gauge(cx, cy, r, val, max, k, { label })",
    exampleCall: "gauge(540, 960, 220, 85, 100, k, { label: 'كفاءة النظام' })",
    code: `/* ⑩ مقياس نصف دائري بإبرة متحركة — للسرعة والضغط ومؤشرات الأداء */
function gauge(cx, cy, r, val, max, k, o) {
  o = o || {}; const A0 = Math.PI * 0.78, A1 = Math.PI * 2.22;
  X.save();
  X.strokeStyle = rgba(SKY, 0.16); X.lineWidth = 22; X.lineCap = 'round';
  X.beginPath(); X.arc(cx, cy, r, A0, A1); X.stroke();
  const p = cl(val / max, 0, 1) * cl(k, 0, 1);
  X.strokeStyle = ACC; X.lineWidth = 22;
  X.beginPath(); X.arc(cx, cy, r, A0, A0 + (A1 - A0) * p); X.stroke();
  for (let i = 0; i <= 8; i++) {
    const a = A0 + (A1 - A0) * (i / 8);
    X.strokeStyle = rgba(SKY, 0.35); X.lineWidth = 3;
    X.beginPath(); X.moveTo(cx + Math.cos(a) * (r - 30), cy + Math.sin(a) * (r - 30));
    X.lineTo(cx + Math.cos(a) * (r - 14), cy + Math.sin(a) * (r - 14)); X.stroke();
  }
  const na = A0 + (A1 - A0) * p;
  X.strokeStyle = WARM; X.lineWidth = 7; X.lineCap = 'round';
  X.shadowColor = rgba(ACC, 0.8); X.shadowBlur = 18;
  X.beginPath(); X.moveTo(cx, cy); X.lineTo(cx + Math.cos(na) * (r - 40), cy + Math.sin(na) * (r - 40)); X.stroke(); nsh();
  X.fillStyle = CREAM; X.beginPath(); X.arc(cx, cy, 14, 0, 7); X.fill();
  if (o.label) T(o.label, cx, cy + r + 56, '700 34px ' + FONT, SKY);
  X.restore();
}`,
  },

  listRow: {
    id: "listRow",
    nameArabic: "صف القائمة التفاعلي مع شريط امتلاء",
    category: "process",
    bestFor: "سرد النقاط أو الخطوات مع رقم يمين وشريط يتعبأ وميض حي",
    parameters: "listRow(x, y, w, h, { n, t, sub, live, fill })",
    exampleCall: "listRow(140, 800, 800, 110, { n: 1, t: 'التحليل المالي الدقيق', live: true, fill: 0.8 })",
    code: `/* صف قائمة بالأسلوب المعتمد: الرقم يمين ثم النص وشريط يتعبّى */
function listRow(x, y, w, h, o) {
  const R = h / 2.8, live = !!o.live, fill = cl(o.fill || 0, 0, 1);
  X.save();
  sh(24, 13, 0.40);
  X.fillStyle = rgba(SKY, live ? 0.13 : 0.075); rr(x, y, w, h, R); X.fill(); nsh();
  const g = X.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, rgba('#FFFFFF', 0.10)); g.addColorStop(1, rgba('#FFFFFF', 0.02));
  X.fillStyle = g; rr(x, y, w, h, R); X.fill();
  X.save(); rr(x, y, w, h, R); X.clip();
  const fg = X.createLinearGradient(x, 0, x + Math.max(1, w * fill), 0);
  fg.addColorStop(0, rgba(ACC, live ? 0.50 : 0.26));
  fg.addColorStop(1, rgba(ACC, live ? 0.14 : 0.07));
  X.fillStyle = fg; X.fillRect(x, y, w * fill, h);
  X.fillStyle = live ? WARM : rgba(ACC, 0.5); X.fillRect(x, y + h - 4, w * fill, 4);
  X.restore();
  X.strokeStyle = live ? rgba(WARM, 0.8) : rgba(SKY, 0.24);
  X.lineWidth = live ? 2.4 : 1.6; rr(x, y, w, h, R); X.stroke();
  const cy = y + h / 2, nx = x + w - 54;
  if (o.n !== undefined) {
    X.fillStyle = live ? ACC : rgba(SKY, 0.16);
    X.beginPath(); X.arc(nx, cy, 34, 0, 7); X.fill();
    T(String(o.n), nx, cy + 2, '700 32px ' + FONT, live ? CREAM : SKY);
  }
  const tx = o.n !== undefined ? nx - 58 : x + w - 34;
  if (o.sub) {
    T(o.t, tx, cy - 26, '700 40px ' + FONT, live ? CREAM : '#DCE3E7', 'right');
    T(o.sub, tx, cy + 42, '700 24px ' + FONT, rgba(SKY, live ? 0.95 : 0.55), 'right');
  } else {
    T(o.t, tx, cy + 3, '700 42px ' + FONT, live ? CREAM : '#DCE3E7', 'right');
  }
  X.restore();
}`,
  },

  summaryCard: {
    id: "summaryCard",
    nameArabic: "كرت الخلاصة الحاسم الفاتح",
    category: "display",
    bestFor: "ختام الفيديو، إعلان الفكرة الفائزة، أو النصيحة الذهبية بتباين قوي",
    parameters: "summaryCard(x, y, w, h, txt, a)",
    exampleCall: "summaryCard(160, 750, 760, 320, 'الاستثمار في الذكاء الاصطناعي ليس خياراً، بل ضرورة', 1)",
    code: `/* كرت خلاصة فاتح — يقلب التباين ويغلق المشهد */
function summaryCard(x, y, w, h, txt, a) {
  X.save(); X.globalAlpha *= (a === undefined ? 1 : a);
  sh(34, 18, 0.42); X.fillStyle = INK; rr(x, y, w, h, 40); X.fill(); nsh();
  T(txt, x + w / 2, y + h / 2 + 6, '700 46px ' + FONT, BG); X.restore();
}`,
  },
};
