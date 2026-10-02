/**
 * Scene Planner — Phase 1 of the 3-phase pipeline.
 * Takes the user prompt and returns a structured JSON scene plan.
 * This is a lightweight LLM call that outputs ~1500 tokens of JSON.
 */
import "server-only";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";
import { buildMotionCatalog } from "./motion-catalog";

export interface ScenePlanItem {
  sceneIndex: number;
  title: string;
  theme?: "light" | "dark";
  startTime: number;
  endTime: number;
  durationSeconds: number;
  visualConcept: string;
  background: string;
  colorPalette: { primary: string; accent: string; bg: string };
  elements: string[];
  motionPrimitives: string[];
  textContent: {
    kicker: string;
    headline: string;
    metric?: string;
    metricLabel?: string;
  };
  transitionToNext: string;
}

export interface ScenePlan {
  filmTitle: string;
  totalDuration: number;
  globalStyle: string;
  scenes: ScenePlanItem[];
}

const PLAN_SYSTEM_PROMPT = `أنت مخرج موشن جرافيك محترف. مهمتك هي تقسيم فكرة الفيديو إلى خطة مشاهد مفصلة بصيغة JSON.

القواعد الصارمة:
1. قسّم الفيديو إلى 3-5 مشاهد بحسب المدة (مشهد كل 3-5 ثوانٍ تقريباً).
2. قانون سقف المساحة النصية والهيمنة البصرية الصارم (إلزامي):
   - ألا تزيد المساحة الكلية التي تشغلها النصوص والكلمات عن 20% من مساحة الكادر إطلاقاً (Max 20% Text Area Ceiling).
   - 80% إلى 90% من مساحة المشهد يجب أن تكون عبارة عن أشكال هندسية، أيقونات متجهة (SVG)، بطاقات تفاعلية، ومجسمات وقصص تعبيرية حركية تشرح الفكرة دون حشو نصي.
3. وزّع الزمن بشكل متساوٍ تقريباً مع مراعاة أن المشهد الأول والأخير أقصر قليلاً.
4. حدد العناصر البصرية بدقة (أيقونات، أشكال هندسية، رسوم SVG).
5. اختر حركات من الكتالوج المتاح (انظر أسفل الرسالة).
6. صمم انتقالاً سلساً بين كل مشهد والذي يليه عبر عنصر رابط.
7. قانون إلزامي صارم لتنوع الخلفيات (قاعدة الـ 40% كحد أقصى للمشاهد الداكنة):
   - نسبة المشاهد ذات الثيمات والخلفيات الداكنة (Dark / Black) يجب ألا تتجاوز 40% من إجمالي مشاهد الفيديو نهائياً!
   - 60% على الأقل من مشاهد الفيديو يجب أن تكون بخلفيات فاتحة ونقية ومشرقة (مثل الأبيض النقي #ffffff، الرمادي الفاتح الحديث #f8fafc، درجات الكريمي الفاتح، أو ألوان الهوية الفاتحة).
   - لكل مشهد حدد الحقل "theme": "light" أو "theme": "dark". وتأكد أن عدد المشاهد ذات "dark" لا يتجاوز 40% بأي حال.
   - في المشاهد الفاتحة: لون النصوص الأساسية (headline, kicker, metrics) يجب أن يكون داكناً متبايناً جداً (#0f172a أو #1e293b).
8. قانون تنوع أساليب الحركة الصارم وحظر احتكار المورفينج (ANTI-MORPHING MOTION DIVERSITY):
   - ممنوع منعاً باتاً تكرار "المورفينج" (morphTransform) أو الاعتماد عليه كحركة رئيسية عبر المشاهد!
   - حركة "morphTransform" مقيدة بحد أقصى مشهد واحد فقط في الفيديو كاملاً (أو صفر إن لم تكن هناك ضرورة رمزية).
   - لكل مشهد، يجب تحديد 1 إلى 2 حركة فيزيائية مختلفة في حقل "motionPrimitives" من الكتالوج المتاح:
     * مشهد لرسم الخطوط والمسارات الحية (SVG Trim Path / Draw-On: "trimPathDrawOn")
     * مشهد للارتداد الفيزيائي المرن والانبثاق (Elastic Spring Overshoot: "elasticSpring")
     * مشهد لحركة الكاميرا والعمق البصري (Camera Push & Parallax: "cameraPush", "parallaxDepth")
     * مشهد للطباعة الحركية الديناميكية (Kinetic Typography: "kineticTypography", "textRevealMask")
     * مشهد للتمدد والانضغاط والانسياب (Squash & Stretch: "squashStretch", "paperFlutter")
     * مشهد للدوران ثلاثي الأبعاد أو التموجات (Isometric Rotate: "isometricRotate", "stormWaves")
   - يجب أن يختلف الأسلوب الحركي لكل مشهد كلياً عن المشهد الذي يسبقه ويليه لإضفاء تنوع بصري ديناميكي.

${buildMotionCatalog()}

أجب بـ JSON فقط بدون أي نص إضافي. الهيكل المطلوب:
{
  "filmTitle": "عنوان الفيلم",
  "totalDuration": المدة_الكلية_بالثواني,
  "globalStyle": "وصف النمط البصري العام",
  "scenes": [
    {
      "sceneIndex": 0,
      "title": "عنوان المشهد",
      "theme": "light",
      "startTime": 0,
      "endTime": 5,
      "durationSeconds": 5,
      "visualConcept": "وصف الفكرة البصرية المركزية للمشهد",
      "background": "وصف الخلفية: لون فاتح/تدرج ناصع/نمط عصري",
      "colorPalette": { "primary": "#0f172a", "accent": "#d97706", "bg": "#f8fafc" },
      "elements": ["وصف كل عنصر بصري وموقعه ودوره"],
      "motionPrimitives": ["trimPathDrawOn", "elasticSpring"],
      "textContent": {
        "kicker": "نص الكيكر القصير",
        "headline": "العنوان الرئيسي",
        "metric": "رقم إحصائي اختياري",
        "metricLabel": "تسمية الرقم"
      },
      "transitionToNext": "وصف كيفية الانتقال للمشهد التالي"
    }
  ]
}`;

function extractJsonPlan(rawContent: string): ScenePlan {
  let cleaned = rawContent.trim();

  // 1. Direct JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // 2. Extract from markdown code fence
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (_) {
      cleaned = fenceMatch[1].trim();
    }
  }

  // 3. Find outermost { ... }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {}

    // 4. Strip trailing commas before closing braces/brackets
    const fixedCommas = candidate.replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(fixedCommas);
    } catch (_) {}
  }

  throw new Error("لم يتم العثور على كائن JSON صالح في استجابة النموذج لتخطيط المشاهد");
}

function isDarkColor(hex: string): boolean {
  if (!hex || typeof hex !== "string") return false;
  let c = hex.replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16) || 0;
  const g = parseInt(c.slice(2, 4), 16) || 0;
  const b = parseInt(c.slice(4, 6), 16) || 0;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.45;
}

function enforceDarkSceneCeiling(scenes: ScenePlanItem[]): void {
  const maxDarkAllowed = Math.floor(scenes.length * 0.4); // max 40% dark
  let darkCount = 0;

  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const isDark =
      s.theme === "dark" ||
      isDarkColor(s.colorPalette?.bg) ||
      (s.background &&
        (s.background.includes("داكن") ||
          s.background.includes("أسود") ||
          s.background.includes("black") ||
          s.background.includes("dark")));

    if (isDark) {
      if (darkCount < maxDarkAllowed) {
        darkCount++;
        s.theme = "dark";
      } else {
        // Exceeds 40% ceiling! Programmatically normalize to light theme
        s.theme = "light";
        s.background = "خلفية ناصعة فاتحة عصرية (#f8fafc) مع عناصر ملونة عالية التباين";
        if (!s.colorPalette) {
          s.colorPalette = { primary: "#0f172a", accent: "#d97706", bg: "#f8fafc" };
        } else {
          s.colorPalette.bg = "#f8fafc";
          if (!isDarkColor(s.colorPalette.primary)) {
            s.colorPalette.primary = "#0f172a";
          }
        }
      }
    } else {
      s.theme = "light";
      if (!s.colorPalette?.bg || isDarkColor(s.colorPalette.bg)) {
        if (s.colorPalette) s.colorPalette.bg = "#f8fafc";
      }
    }
  }
}

const DIVERSE_MOTION_SETS: string[][] = [
  ["trimPathDrawOn", "elasticSpring"],
  ["cameraPush", "parallaxDepth"],
  ["kineticTypography", "squashStretch"],
  ["paperFlutter", "isometricRotate"],
  ["dropImpact", "fadeScale"],
  ["boatWaveFloat", "textRevealMask"],
];

function enforceMotionDiversity(scenes: ScenePlanItem[]): void {
  let morphCount = 0;

  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    if (!s.motionPrimitives || !Array.isArray(s.motionPrimitives) || s.motionPrimitives.length === 0) {
      s.motionPrimitives = [...DIVERSE_MOTION_SETS[i % DIVERSE_MOTION_SETS.length]];
      continue;
    }

    const sanitized: string[] = [];
    for (const primitive of s.motionPrimitives) {
      const lower = primitive.toLowerCase();
      if (lower.includes("morph")) {
        if (morphCount === 0) {
          morphCount++;
          sanitized.push("morphTransform");
        } else {
          // Morph exceeded limit of 1 per video! Replace with distinct primitive from pool
          const replacement = DIVERSE_MOTION_SETS[i % DIVERSE_MOTION_SETS.length][0];
          if (!sanitized.includes(replacement)) {
            sanitized.push(replacement);
          }
        }
      } else {
        sanitized.push(primitive);
      }
    }

    // Ensure at least 2 distinct primitives per scene
    if (sanitized.length < 2) {
      const fallbackSet = DIVERSE_MOTION_SETS[i % DIVERSE_MOTION_SETS.length];
      for (const f of fallbackSet) {
        if (!sanitized.includes(f) && sanitized.length < 2) {
          sanitized.push(f);
        }
      }
    }

    s.motionPrimitives = sanitized;
  }
}

export async function planScenes(
  apiKey: string,
  model: string,
  userPrompt: string,
  durationSeconds: number,
  brandStyle?: string
): Promise<ScenePlan> {
  const userMessage = JSON.stringify({
    prompt: userPrompt,
    durationSeconds,
    aspectRatio: "1080x1920 portrait (9:16)",
    brandStyle: brandStyle || "Modern cinematic motion graphics",
    instruction: "أنشئ خطة مشاهد مفصلة لهذا الفيديو مع تطبيق قانون الـ 40% كحد أقصى للمشاهد الداكنة (60%+ مشاهد فاتحة)، وقانون تنوع أساليب الحركة (منع احتكار المورفينج وتوزيع الحركات الفيزيائية المتنوعة على المشاهد). أجب بـ JSON فقط."
  });

  console.log(`[ScenePlanner] Planning scenes for ${durationSeconds}s video with model: ${model}`);

  const response = await sendOpenRouterRequest(apiKey, {
    model,
    messages: [
      { role: "system", content: PLAN_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.6,
    max_tokens: 4096,
  });

  const rawContent = response.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("لم يُرجع النموذج خطة مشاهد صالحة.");
  }

  try {
    const plan = extractJsonPlan(rawContent);

    // Validate and fix scene timings
    if (!plan.scenes || plan.scenes.length === 0) {
      throw new Error("خطة المشاهد فارغة");
    }

    // Ensure scenes cover the full duration
    const lastScene = plan.scenes[plan.scenes.length - 1];
    if (lastScene.endTime < durationSeconds * 0.8) {
      lastScene.endTime = durationSeconds;
      lastScene.durationSeconds = lastScene.endTime - lastScene.startTime;
    }

    plan.totalDuration = durationSeconds;

    // Enforce 40% max dark scene ceiling
    enforceDarkSceneCeiling(plan.scenes);

    // Enforce motion diversity & prevent morphing monopoly
    enforceMotionDiversity(plan.scenes);

    console.log(
      `[ScenePlanner] Plan created: ${plan.scenes.length} scenes (Dark scenes: ${
        plan.scenes.filter((s) => s.theme === "dark").length
      }/${plan.scenes.length}, Primitives: ${plan.scenes.map((s, idx) => `S${idx}:[${s.motionPrimitives.join(",")}]`).join(" ")}), title: "${plan.filmTitle}"`
    );
    return plan;
  } catch (parseErr: any) {
    console.error("[ScenePlanner] Failed to parse JSON plan:", parseErr.message, "\nRaw snippet:", rawContent.slice(0, 300));
    throw new Error("فشل تحليل خطة المشاهد من الذكاء الاصطناعي. يرجى إعادة المحاولة.");
  }
}
