/**
 * Motion Recipes & Kinematics Library
 * Provides concrete, tested code recipes and mathematical equations extracted
 * from our local physics library and closed-form springs engine.
 * Used by both the Motion Critic (to diagnose & recommend) and the Scene Healer/Generator (to implement).
 */

export interface MotionRecipe {
  id: string;
  name: string;
  nameAr: string;
  defectItSolves: string[];
  mathFormula: string;
  codeSnippet: string;
  explanationAr: string;
}

export const MOTION_RECIPES: Record<string, MotionRecipe> = {
  closedFormSpring: {
    id: "closedFormSpring",
    name: "Closed-Form Damped Spring",
    nameAr: "النوابض الفيزيائية المخمدة (ارتداد بالقصور الذاتي)",
    defectItSolves: ["LINEAR_ROBOTIC", "NO_OVERSHOOT", "STIFF_MOTION", "حركة خطية جافة", "غياب الارتداد"],
    mathFormula: "x(t) = 1 - exp(-z*w0*t) * (cos(wd*t) + (z*w0/wd)*sin(wd*t))",
    codeSnippet: `// تطبيق النوابض الفيزيائية الحقيقية:
const s = typeof window.spring === 'function' 
  ? window.spring(localTime - delay, 200, 22) 
  : (1 - Math.pow(1 - Math.max(0, Math.min(1, (localTime - delay) / 0.8)), 3));

targetEl.style.transform = \`translateY(\${(1 - s) * 60}px) scale(\${0.85 + 0.15 * s})\`;
targetEl.style.opacity = Math.min(1, s * 2.2);`,
    explanationAr: "تمنح العناصر كتلة وقصوراً ذاتياً وتجاوزاً خفيفاً للهدف (Overshoot) واستقراراً ناعماً بدلاً من التوقف الفجائي أو الحركة الآلية الجافة.",
  },

  trackMultiPoint: {
    id: "trackMultiPoint",
    name: "Multi-Target Superposition Tracker",
    nameAr: "تعقب المسارات متعددة النقاط (حركة متصلة دون انقطاع)",
    defectItSolves: ["DISCONTINUOUS_MOTION", "JERKY_TRANSITION", "STATIC_FREEZE", "انتقال فجائي", "تقطع في المسار"],
    mathFormula: "v(t) = v0 + sum((vi - vi-1) * spring(t - ti, k, d))",
    codeSnippet: `// تحريك العنصر بسلاسة تامة بين 3 نقاط متتالية:
// [[زمن البداية, القيمة], [الزمن الثاني, القيمة], [الزمن الثالث, القيمة]]
const posX = typeof window.track === 'function'
  ? window.track(localTime, [[0.2, 100], [1.6, 540], [3.2, 900]], 180, 24)
  : mix(100, 900, Math.min(1, localTime / 3.2));

element.style.transform = \`translateX(\${posX}px)\`;`,
    explanationAr: "تسمح بتحريك أي عنصر (مؤشر ماوس، بطاقة، سيارة، أيقونة) بين عدة مواقع بسلاسة فيزيائية مستمرة دون الحاجة لإعادة تشغيل الحركة أو حدوث قفزات مفاجئة.",
  },

  kineticTypography: {
    id: "kineticTypography",
    name: "Staggered Kinetic Typography",
    nameAr: "الطباعة الحركية المتعاقبة (رقص الكلمات والنصوص)",
    defectItSolves: ["UNSTAGGERED", "BLOCKY_TEXT", "FADE_IN_SLOP", "ظهور جماعي متكتل للنصوص", "تلاشي تقليدي باهت"],
    mathFormula: "word[i].val = spring(t - i * staggerDelay, 260, 24)",
    codeSnippet: `// تفكيك النص وظهور الكلمات كلمة تلو الأخرى بنوابض متتابعة:
const words = sceneEl.querySelectorAll('.kinetic-word');
words.forEach((w, i) => {
  const tLocal = Math.max(0, localTime - 0.2 - i * 0.12);
  const st = typeof window.spring === 'function' ? window.spring(tLocal, 250, 22) : Math.min(1, tLocal / 0.5);
  w.style.display = "inline-block";
  w.style.transform = \`translateY(\${(1 - st) * 45}px) scale(\${0.82 + 0.18 * st})\`;
  w.style.opacity = Math.min(1, st * 2.5);
});`,
    explanationAr: "تحول العناوين والنصوص من ظهور ميت ومتكتل إلى سيمفونية حركية تتدفق فيها الكلمات بانسيابية جاذبة للانتباه في الثانية الأولى.",
  },

  trimPathDrawOn: {
    id: "trimPathDrawOn",
    name: "SVG Stroke Trim Path Draw-On",
    nameAr: "الرسم التدريجي التفاعلي للمسارات والأشكال",
    defectItSolves: ["STATIC_GRAPHICS", "INSTANT_POP", "رسوم بيانية أو أيقونات جامدة"],
    mathFormula: "strokeDashoffset = length * (1 - spring(t, k, d))",
    codeSnippet: `// رسم خطوط وأيقونات SVG تدريجياً كأنها ترسم بالقلم في الهواء:
const path = sceneEl.querySelector('.draw-path');
if (path && path.getTotalLength) {
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  const p = typeof window.spring === 'function' ? window.spring(localTime - 0.3, 170, 26) : Math.min(1, localTime / 1.5);
  path.style.strokeDashoffset = len * (1 - p);
}`,
    explanationAr: "تجعل الرسوم البيانية، الأيقونات، الخطوط التوضيحية، وشعارات المتجهات تتشكل على الشاشة بسلاسة وكأن فناناً يرسمها لحظياً.",
  },

  indicatorStretch: {
    id: "indicatorStretch",
    name: "Asymmetric Elastic Indicator",
    nameAr: "التمطيط المرن للأشرطة والتبويبات (Asymmetric Elasticity)",
    defectItSolves: ["RIGID_BARS", "أشرطة صلبة غير مرنة"],
    mathFormula: "lead = track(t, stops, 320, 30); trail = track(t, stops, 140, 22)",
    codeSnippet: `// تمطيط المؤشر أو الشريط أثناء الحركة وانكماشه عند الاستقرار:
if (typeof window.indicator === 'function') {
  const pos = window.indicator(localTime, [[0.3, 80], [1.8, 380], [3.2, 680]]);
  pillEl.style.left = pos.left + "px";
  pillEl.style.width = pos.width + "px";
}`,
    explanationAr: "تجعل الحافة الأمامية سريعة المشي بينما الحافة الخلفية متأخرة، فيتمطط العنصر فيزيايئاً مع السرعة وينكمش عند الوصول.",
  },

  cameraPushDepth: {
    id: "cameraPushDepth",
    name: "Cinematic Camera Push & Parallax",
    nameAr: "حركة الكاميرا والعمق الطبقي (بارالاكس سينمائي)",
    defectItSolves: ["FLAT_2D", "LACK_OF_DEPTH", "STATIC_CAMERA", "مشهد مسطح بدون عمق", "كاميرا ميتة ثابتة"],
    mathFormula: "cam = spring(t, 90, 22); layer[i].y = cam * depthFactor[i]",
    codeSnippet: `// تقريب الكاميرا البطيء المستمر مع تحريك الطبقات بسرعات مختلفة لعمق هائل:
const cam = typeof window.spring === 'function' ? window.spring(localTime, 80, 22) : (localTime / sceneDuration);
stage.style.transform = \`scale(\${1 + cam * 0.08}) translate(\${-cam * 25}px, \${-cam * 15}px)\`;

// خلفية بعيدة
if (bgFar) bgFar.style.transform = \`translateY(\${-cam * 20}px)\`;
// عناصر متوسطة
if (midGround) midGround.style.transform = \`translateY(\${-cam * 55}px) scale(1.03)\`;
// عناصر قريبة
if (foreGround) foreGround.style.transform = \`translateY(\${-cam * 110}px) scale(1.08)\`;`,
    explanationAr: "تعطي إحساساً سينمائياً ثلاثي الأبعاد بالعمق والمسافة عبر تحريك الطبقات بسرعات مختلفة مستوحاة من كاميرات السينما الحقيقية.",
  },

  dropImpactWave: {
    id: "dropImpactWave",
    name: "Liquid Drop Impact & Fluid Ripples",
    nameAr: "ارتطام القطرات والموجات السائلة",
    defectItSolves: ["LIQUID_RIGIDITY", "سوائل جامدة أو قطرات غير طبيعية"],
    mathFormula: "y = A * sin(w*t) * exp(-d*t); r = r0 + (1 - exp(-d*t)) * maxR",
    codeSnippet: `// محاكاة ارتطام قطرة بانتشار أمواج دائرية متلاشية:
const impactTime = Math.max(0, localTime - 0.6);
const ripple = typeof window.spring === 'function' ? window.spring(impactTime, 140, 18) : Math.min(1, impactTime / 1.2);
ringEl.setAttribute("r", String(15 + ripple * 110));
ringEl.style.opacity = String(Math.max(0, 1 - ripple));
ringEl.style.strokeWidth = String(Math.max(1, (1 - ripple) * 6));`,
    explanationAr: "محاكاة واقعية لارتطام السوائل والقطرات مع تشكل موجات سطحية متسعة ومتلاشية بدقة فيزيائية.",
  },
};

/**
 * Builds a curated prompt section containing all executable motion recipes
 * formatted specifically for the LLM to copy and use in scene rendering.
 */
export function buildExecutableMotionRecipesPrompt(): string {
  let text = `\n══════════════════════════════════════════════════════════════════\n`;
  text += `🎯 دليل دوال وحركات الحركة الفيزيائية المعتمدة (EXECUTABLE MOTION RECIPES)\n`;
  text += `══════════════════════════════════════════════════════════════════\n`;
  text += `لديك مكتبة دوال فيزيائية جاهزة ومحقونة مسبقاً في window. يجب عليك استخدامها لتحريك العناصر:\n\n`;

  for (const key of Object.keys(MOTION_RECIPES)) {
    const r = MOTION_RECIPES[key];
    text += `📌 ${r.nameAr} [${r.name}]:\n`;
    text += `   - متى تستخدمها: لعلاج ${r.defectItSolves.join(" أو ")}.\n`;
    text += `   - نموذج الكود الإلزامي القابل للنسخ والاستخدام المباشر:\n`;
    text += `${r.codeSnippet}\n\n`;
  }

  text += `قاعدة ذهبية: لا تستخدم حركات خطية جافة (مثل t/duration بدون معادلة). استخدم دائماً window.spring أو window.track مع تباين الأزمنة (Stagger delay) لتبدو الحركة فاخرة ونابضة بالحياة.\n`;

  return text;
}

/**
 * Retrieves a recipe by its key/ID
 */
export function getRecipeById(id: string): MotionRecipe | undefined {
  if (!id) return undefined;
  return MOTION_RECIPES[id];
}

/**
 * Finds the most suitable motion recipe to solve a detected motion defect
 */
export function findRecipeForDefect(defect: string): MotionRecipe {
  if (!defect) return MOTION_RECIPES.closedFormSpring;
  const norm = defect.toLowerCase();

  for (const key of Object.keys(MOTION_RECIPES)) {
    const r = MOTION_RECIPES[key];
    if (r.id.toLowerCase() === norm) return r;
    if (
      r.defectItSolves.some(
        (d) => d.toLowerCase().includes(norm) || norm.includes(d.toLowerCase())
      )
    ) {
      return r;
    }
  }

  return MOTION_RECIPES.closedFormSpring;
}

