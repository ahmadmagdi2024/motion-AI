/**
 * Motion Catalog — Compact reference of all available motion primitives.
 * Instead of injecting 36000+ chars of raw physics code into the prompt,
 * we provide a concise ~2000-char catalog the LLM can reference by name.
 */
import "server-only";
import { scanPhysicsLibrary } from "./physics-scanner";

export interface MotionPrimitive {
  name: string;
  nameAr: string;
  equation: string;
  useCase: string;
  codeSnippet?: string;
  isRestricted?: boolean;
}

/**
 * Hard-coded catalog of motion primitives extracted from the physics library.
 * These are the most important ones the LLM should know about.
 */
export const MOTION_PRIMITIVES: MotionPrimitive[] = [
  {
    name: "trimPathDrawOn",
    nameAr: "رسم تدريجي على مسار SVG (Stroke Dashoffset)",
    equation: "strokeDashoffset = totalLength * (1 - ease(clamp(t / dur, 0, 1)))",
    useCase: "رسم أيقونات، حدود، رسوم بيانية، مخططات، وأشكال هندسية تتشكل تدريجياً",
    codeSnippet: `// رسم مسار SVG تدريجياً:
const path = sceneEl.querySelector('.draw-path');
if (path && path.getTotalLength) {
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len * (1 - ease(clamp(t / 1.4, 0, 1)));
}`
  },
  {
    name: "elasticSpring",
    nameAr: "ارتداد مرن وفيزيائي (زنبرك / Pop-in Overshoot)",
    equation: "scale = 1 + Math.sin(p * Math.PI * 3.5) * Math.exp(-p * 6) * 0.4",
    useCase: "ظهور الأشكال، الكروت، الأزرار، الأيقونات بارتداد فيزيائي ممتع",
    codeSnippet: `// ظهور ارتدادي زنبركي:
const p = clamp(t / 1.0, 0, 1);
const springScale = p >= 1 ? 1 : 1 + Math.sin(p * Math.PI * 3.5) * Math.exp(-p * 6) * 0.4;
targetEl.style.transform = "scale(" + springScale + ")";
targetEl.style.opacity = clamp(t / 0.2, 0, 1);`
  },
  {
    name: "cameraPush",
    nameAr: "حركة كاميرا سينمائية (Push / Pan / Zoom)",
    equation: "scale = 1 + easeInOut(p) * 0.2; translate = easeInOut(p) * -40",
    useCase: "تكبير المشهد تدريجياً، تقريب الكاميرا من التفاصيل لزيادة التشويق السينمائي",
    codeSnippet: `// تقريب الكاميرا وتمريرها سينمائياً:
const cp = easeInOut(clamp(t / (sceneDuration || 4), 0, 1));
stageWrapper.style.transform = "scale(" + (1 + cp * 0.18) + ") translate(" + (cp * -30) + "px, " + (cp * -20) + "px)";`
  },
  {
    name: "parallaxDepth",
    nameAr: "عمق ثلاثي متعدد الطبقات (بارالاكس)",
    equation: "layer[i].y = scrollOffset * depthMultiplier[i]",
    useCase: "خلفيات ثلاثية الأبعاد، عناصر متحركة بسرعات مختلفة لإعطاء عمق بصري هائل",
    codeSnippet: `// طبقات بارالاكس بسرعات متفاوتة:
const pp = clamp(t / (sceneDuration || 4), 0, 1);
bgBack.style.transform = "translateY(" + (-pp * 25) + "px) scale(1.05)";
bgMid.style.transform = "translateY(" + (-pp * 65) + "px)";
fgFront.style.transform = "translateY(" + (-pp * 130) + "px) scale(1.08)";`
  },
  {
    name: "kineticTypography",
    nameAr: "طباعة حركية تفاعلية (كلمات وأحرف ترقص بتوقيت متزامن)",
    equation: "word[i].y = (1 - ease(p_i)) * 40; word[i].opacity = ease(p_i)",
    useCase: "عناوين ديناميكية مذهلة تظهر كلمة تلو الأخرى بتناغم بصري",
    codeSnippet: `// ظهور متتابع للكلمات:
const words = sceneEl.querySelectorAll('.kinetic-word');
words.forEach((w, i) => {
  const wp = ease(clamp((t - i * 0.14) / 0.5, 0, 1));
  w.style.opacity = wp;
  w.style.transform = "translateY(" + ((1 - wp) * 40) + "px) scale(" + mix(0.85, 1, wp) + ")";
});`
  },
  {
    name: "squashStretch",
    nameAr: "تمدد وانضغاط فيزيائي مع السرعة",
    equation: "scaleX = 1 + vel * 0.25; scaleY = 1 - vel * 0.25",
    useCase: "عناصر حيوية، كرات، رسوم متحركة مرنة، شخصيات كرتونية",
    codeSnippet: `// انضغاط وتمدد فيزيائي:
const vel = Math.abs(Math.sin(t * 3.5));
targetEl.style.transform = "scale(" + (1 + vel * 0.22) + ", " + (1 - vel * 0.22) + ")";`
  },
  {
    name: "paperFlutter",
    nameAr: "ورق وبطاقات متطايرة / استجابة هوائية",
    equation: "rot = Math.sin(t * 2.2) * 8; curl = Math.cos(t * 1.8) * 6",
    useCase: "أوراق، وثائق، فواتير، بطاقات، أي جسم خفيف يطفو في الهواء",
    codeSnippet: `// تطاير وانسياب ورقي في الهواء:
const rot = Math.sin(t * 2.2) * 9;
const curl = Math.cos(t * 1.7) * 6;
const floatY = Math.sin(t * 2.5) * 16;
cardEl.style.transform = "perspective(700px) rotateY(" + rot + "deg) rotateZ(" + curl + "deg) translateY(" + floatY + "px)";`
  },
  {
    name: "dropImpact",
    nameAr: "ارتطام قطرة بسطح سائل وموجات",
    equation: "y = A * Math.sin(freq * t) * Math.exp(-decay * t)",
    useCase: "قطرات العطور، السوائل، الأمطار، أمواج حلقية متسعة",
    codeSnippet: `// موجات قطرة متلاشية:
const decay = Math.exp(-clamp(t - 0.2, 0, 10) * 3.5);
ringEl.setAttribute('r', 30 + (1 - decay) * 80);
ringEl.style.opacity = decay;`
  },
  {
    name: "pendulumSwing",
    nameAr: "تأرجح البندول واللافتات المعلقة",
    equation: "angle = maxAngle * Math.cos(Math.sqrt(g/L) * t) * Math.exp(-friction * t)",
    useCase: "بندولات، ساعات، لافتات معلقة، ثريات، تمايل جاذبي",
    codeSnippet: `// تمايل متخامد للبندول:
const angle = 22 * Math.cos(3.2 * t) * Math.exp(-0.35 * t);
pendulumEl.style.transformOrigin = "50% 0%";
pendulumEl.style.transform = "rotate(" + angle + "deg)";`
  },
  {
    name: "isometricRotate",
    nameAr: "دوران ثلاثي الأبعاد أيزومتري",
    equation: "transform = perspective(800px) rotateY(ry) rotateX(rx)",
    useCase: "بطاقات ائتمان، هواتف، لوحات معلومات، منتجات تدور في الفراغ",
    codeSnippet: `// دوران ثلاثي الأبعاد سلس للبطاقة:
const ry = ease(clamp(t / 1.5, 0, 1)) * 360;
cardEl.style.transform = "perspective(900px) rotateY(" + ry + "deg) rotateX(12deg)";`
  },
  {
    name: "boatWaveFloat",
    nameAr: "طفو فوق أمواج",
    equation: "y = A * Math.sin(waveFreq * t); tilt = Math.sin(t * 0.8) * 4",
    useCase: "سفن، قوارب، أيقونات طافية على سطح مائي متماوج"
  },
  {
    name: "fadeScale",
    nameAr: "ظهور بتدرج وتكبير",
    equation: "opacity = easeOut(p); scale = 0.85 + 0.15 * easeOut(p)",
    useCase: "دخول متزن لأي عنصر: نصوص، بطاقات، أيقونات"
  },
  {
    name: "textRevealMask",
    nameAr: "كشف نص بقناع",
    equation: "clipPath = inset(0 (100 - p*100)% 0 0)",
    useCase: "عناوين، كيكرات، نصوص تظهر تدريجياً عبر قناع قص ناعم",
    codeSnippet: `// كشف بقناع clip-path:
const mp = ease(clamp(t / 1.0, 0, 1));
textEl.style.clipPath = "inset(0 " + ((1 - mp) * 100) + "% 0 0)";`
  },
  {
    name: "motionBlur",
    nameAr: "ضبابية الحركة الفيزيائية",
    equation: "filter = blur(Math.abs(velocity) * 0.3 px)",
    useCase: "أجسام سريعة: سيارات، كرات، خطوط ضوئية متسارعة"
  },
  {
    name: "stormWaves",
    nameAr: "أمواج عاصفة بحرية ديناميكية",
    equation: "y = A1*sin(f1*x+t) + A2*sin(f2*x+t*1.3) + A3*sin(f3*x+t*0.7)",
    useCase: "بحار، خلفيات مائية عميقة، خطوط تذبذب صوتية"
  },
  {
    name: "fabricCloth",
    nameAr: "محاكاة قماش ورايات مرنة",
    equation: "node[i].y += gravity; constraint(node[i], node[i+1], restLength)",
    useCase: "أعلام، أشرطة متحركة بالهواء، ستائر"
  },
  {
    name: "vehicleDrive",
    nameAr: "سيارة أو مركبة تتحرك على مسار",
    equation: "carX += speed * dt; wheelRot += speed * dt * 2; bodyBounce = sin(t*8)*2",
    useCase: "سيارات، شاحنات، طائرات، مركبات النقل واللوجستيات"
  },
  {
    name: "ball3DRotate",
    nameAr: "كرة أو كوكب يدور ثلاثياً",
    equation: "gradient.angle = t * 60; highlight.cx = 50 + sin(t)*20",
    useCase: "كرات رياضية، كواكب، أيقونات كروية لامعة"
  },
  {
    name: "morphTransform",
    nameAr: "تحول شكلي (Morphing)",
    equation: "pathD = interpolateSVGPath(pathA, pathB, easeInOut(p))",
    useCase: "تحول بين شكلين رمزيين (محظور من التكرار)",
    isRestricted: true
  }
];

/**
 * Builds a compact motion catalog string for injection into LLM prompts.
 */
export function buildMotionCatalog(): string {
  let catalog = `\n══════════════════════════════════════════════\n`;
  catalog += `كتالوج الحركات المرجعية المتاحة (${MOTION_PRIMITIVES.length} حركة احترافية)\n`;
  catalog += `══════════════════════════════════════════════\n\n`;

  catalog += `⚠️ قانون إلزامي صارم: حظر احتكار المورفينج (ANTI-MORPHING MONOPOLY LAW):\n`;
  catalog += `- ممنوع منعاً باتاً جعل "المورفينج" (Morphing / تحول أشكال SVG) هو الأسلوب المكرر أو الأساسي في المشاهد!\n`;
  catalog += `- حركة morphTransform مقيدة بحد أقصى مرة واحدة في كامل الفيديو (أو صفر إن لم تكن هناك ضرورة رمزية).\n`;
  catalog += `- استبدل المورفينج بالحركات الفيزيائية الغنية: رسم المسارات (trimPathDrawOn)، الارتداد المرن (elasticSpring)، الكاميرا والبارالاكس (cameraPush & parallaxDepth)، الطباعة الحركية (kineticTypography)، التمدد والانضغاط (squashStretch)، إلخ.\n\n`;

  catalog += `── قائمة الحركات المعتمدة والمعادلات: ──\n`;
  for (const m of MOTION_PRIMITIVES) {
    const badge = m.isRestricted ? " [⚠️ مقيد: مرة واحدة كحد أقصى في الفيديو]" : "";
    catalog += `▸ ${m.name} — ${m.nameAr}${badge}\n`;
    catalog += `  المعادلة: ${m.equation}\n`;
    catalog += `  الاستخدام: ${m.useCase}\n\n`;
  }

  catalog += `── نماذج برمجية جاهزة لتطبيق الحركات الفيزيائية في renderAtTime(t): ──\n`;
  for (const m of MOTION_PRIMITIVES) {
    if (m.codeSnippet && !m.isRestricted) {
      catalog += `// ${m.name} (${m.nameAr}):\n${m.codeSnippet}\n\n`;
    }
  }

  catalog += `تعليمات: التزم بتنفيذ الحركات الفيزيائية المخصصة لكل مشهد. نوّع الحركات عبر المشاهد ليظهر الفيديو بمستوى استوديوهات الموشن جرافيك العالمية.\n`;

  return catalog;
}

/**
 * Builds a dynamic catalog by also scanning the physics library directory
 * and appending any additional items not in the hardcoded list.
 */
export async function buildDynamicMotionCatalog(): Promise<string> {
  let catalog = buildMotionCatalog();

  try {
    const { items, exists } = await scanPhysicsLibrary();
    if (exists && items.length > 0) {
      const hardcodedNames = MOTION_PRIMITIVES.map(m => m.name.toLowerCase());
      const additional = items.filter(item => {
        const lower = item.title.toLowerCase();
        return !hardcodedNames.some(n => lower.includes(n));
      });

      if (additional.length > 0) {
        catalog += `\n── حركات إضافية من المكتبة المحلية (${additional.length}) ──\n`;
        for (const item of additional.slice(0, 8)) {
          catalog += `▸ ${item.title}`;
          if (item.mathFunctions.length > 0) {
            catalog += ` — دوال: ${item.mathFunctions.slice(0, 4).join(", ")}`;
          }
          catalog += `\n`;
        }
      }
    }
  } catch (e) {
    // Silently continue with hardcoded catalog
  }

  return catalog;
}
