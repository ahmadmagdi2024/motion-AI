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
}

/**
 * Hard-coded catalog of motion primitives extracted from the physics library.
 * These are the most important ones the LLM should know about.
 */
export const MOTION_PRIMITIVES: MotionPrimitive[] = [
  {
    name: "dropImpact",
    nameAr: "ارتطام قطرة بسطح سائل",
    equation: "y = A * Math.sin(freq * t) * Math.exp(-decay * t)",
    useCase: "قطرات العطور، السوائل، الأمطار، موجات سطحية"
  },
  {
    name: "elasticSpring",
    nameAr: "ارتداد مرن (زنبرك)",
    equation: "y = A * Math.cos(omega * t) * Math.exp(-damping * t)",
    useCase: "ارتداد الكرات، الأزرار، العناصر المرنة، Pop-in"
  },
  {
    name: "pendulumSwing",
    nameAr: "تأرجح البندول",
    equation: "angle = maxAngle * Math.cos(Math.sqrt(g/L) * t) * Math.exp(-friction * t)",
    useCase: "بندولات، ساعات، لافتات معلقة، تمايل"
  },
  {
    name: "paperFlutter",
    nameAr: "ورق متطاير / استجابة هوائية",
    equation: "rot = Math.sin(t * 2.2) * 7; curl = Math.cos(t * 1.8) * 5",
    useCase: "أوراق، مستندات، بطاقات، أي جسم خفيف يطير"
  },
  {
    name: "squashStretch",
    nameAr: "تمدد وانضغاط بالسرعة",
    equation: "scaleX = 1 + vel * 0.12; scaleY = 1 - vel * 0.12",
    useCase: "كرات مرتدة، شخصيات كرتونية، عناصر مطاطية"
  },
  {
    name: "boatWaveFloat",
    nameAr: "طفو فوق أمواج",
    equation: "y = A * Math.sin(waveFreq * t); tilt = Math.sin(t * 0.8) * 4",
    useCase: "سفن، قوارب، أجسام طافية على سطح الماء"
  },
  {
    name: "parallaxDepth",
    nameAr: "عمق متوازي (بارالاكس)",
    equation: "layer[i].x = offset * depthFactor[i]",
    useCase: "مشاهد غابات، مدن، طبقات خلفية متعددة"
  },
  {
    name: "cameraPush",
    nameAr: "حركة كاميرا Push/Pan/Zoom",
    equation: "scale = 1 + easeInOut(p) * 0.3; translateX = easeInOut(p) * -200",
    useCase: "تكبير سينمائي، تحريك أفقي، اقتراب من العنصر"
  },
  {
    name: "morphTransform",
    nameAr: "تحول شكلي (Morph)",
    equation: "pathD = interpolateSVGPath(pathA, pathB, easeInOut(p))",
    useCase: "تحول بين شكلين، انتقال سلس بين أيقونات"
  },
  {
    name: "trimPathDrawOn",
    nameAr: "رسم تدريجي على المسار",
    equation: "strokeDashoffset = totalLength * (1 - easeOut(p))",
    useCase: "رسم أيقونات، خطوط، رسوم توضيحية تظهر تدريجياً"
  },
  {
    name: "fadeScale",
    nameAr: "ظهور بتدرج وتكبير",
    equation: "opacity = easeOut(p); scale = 0.85 + 0.15 * easeOut(p)",
    useCase: "دخول أي عنصر: نصوص، بطاقات، أيقونات"
  },
  {
    name: "textRevealMask",
    nameAr: "كشف نص بقناع",
    equation: "clipPath = inset(0 (100 - p*100)% 0 0)",
    useCase: "عناوين، كيكرات، نصوص تظهر حرفاً بحرف أو كلمة بكلمة"
  },
  {
    name: "kineticTypography",
    nameAr: "طباعة حركية",
    equation: "word[i].y = startY + easeElastic((t - delay[i]) / dur) * dist",
    useCase: "عناوين ديناميكية، كلمات تتحرك وتتراقص"
  },
  {
    name: "motionBlur",
    nameAr: "ضبابية الحركة",
    equation: "filter = blur(Math.abs(velocity) * 0.3 px)",
    useCase: "أجسام سريعة: سيارات، كرات، عناصر تنزلق بسرعة"
  },
  {
    name: "stormWaves",
    nameAr: "أمواج عاصفة بحرية",
    equation: "y = A1*sin(f1*x+t) + A2*sin(f2*x+t*1.3) + A3*sin(f3*x+t*0.7)",
    useCase: "بحار، عواصف، خلفيات مائية متحركة"
  },
  {
    name: "fabricCloth",
    nameAr: "محاكاة قماش / شراع",
    equation: "node[i].y += gravity; constraint(node[i], node[i+1], restLength)",
    useCase: "أعلام، شراع سفينة، قماش يتحرك بالرياح"
  },
  {
    name: "vehicleDrive",
    nameAr: "سيارة تتحرك على طريق",
    equation: "carX += speed * dt; wheelRot += speed * dt * 2; bodyBounce = sin(t*8)*2",
    useCase: "سيارات، شاحنات، مركبات على الطريق"
  },
  {
    name: "isometricRotate",
    nameAr: "دوران ثلاثي الأبعاد أيزومتري",
    equation: "transform = rotateX(rx) rotateY(ry) rotateZ(rz)",
    useCase: "بطاقات ثلاثية الأبعاد، منتجات، لوحات"
  },
  {
    name: "ball3DRotate",
    nameAr: "كرة تدور ثلاثياً",
    equation: "gradient.angle = t * 60; highlight.cx = 50 + sin(t)*20",
    useCase: "كرات رياضية، كواكب، أجسام كروية"
  }
];

/**
 * Builds a compact motion catalog string for injection into LLM prompts.
 * ~2000 chars instead of ~36000 chars from raw physics code.
 */
export function buildMotionCatalog(): string {
  let catalog = `\n══════════════════════════════════════════════\n`;
  catalog += `كتالوج الحركات المرجعية المتاحة (${MOTION_PRIMITIVES.length} حركة احترافية)\n`;
  catalog += `══════════════════════════════════════════════\n`;
  catalog += `استخدم هذه الحركات بالاسم في كود renderAtTime(t). كل حركة مختبرة وجاهزة للاستخدام:\n\n`;

  for (const m of MOTION_PRIMITIVES) {
    catalog += `▸ ${m.name} — ${m.nameAr}\n`;
    catalog += `  المعادلة: ${m.equation}\n`;
    catalog += `  الاستخدام: ${m.useCase}\n\n`;
  }

  catalog += `تعليمات: اختر الحركات المناسبة لسياق كل مشهد. يمكنك دمج أكثر من حركة معاً.\n`;
  catalog += `لا تبتكر معادلات عشوائية — استخدم المعادلات أعلاه وعدّل المعاملات (A, freq, decay, damping) حسب الحاجة.\n`;

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
