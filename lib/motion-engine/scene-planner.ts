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
2. كل مشهد يجب أن يركز على فكرة بصرية واحدة واضحة (وليس نصوص طويلة).
3. وزّع الزمن بشكل متساوٍ تقريباً مع مراعاة أن المشهد الأول والأخير أقصر قليلاً.
4. حدد العناصر البصرية بدقة (أيقونات، أشكال هندسية، رسوم SVG).
5. اختر حركات من الكتالوج المتاح (انظر أسفل الرسالة).
6. صمم انتقالاً سلساً بين كل مشهد والذي يليه عبر عنصر رابط.

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
      "startTime": 0,
      "endTime": 5,
      "durationSeconds": 5,
      "visualConcept": "وصف الفكرة البصرية المركزية للمشهد",
      "background": "وصف الخلفية: لون/تدرج/نمط",
      "colorPalette": { "primary": "#hex", "accent": "#hex", "bg": "#hex" },
      "elements": ["وصف كل عنصر بصري وموقعه ودوره"],
      "motionPrimitives": ["fadeScale", "elasticSpring"],
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
    instruction: "أنشئ خطة مشاهد مفصلة لهذا الفيديو. أجب بـ JSON فقط."
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

    console.log(`[ScenePlanner] Plan created: ${plan.scenes.length} scenes, title: "${plan.filmTitle}"`);
    return plan;
  } catch (parseErr: any) {
    console.error("[ScenePlanner] Failed to parse JSON plan:", parseErr.message, "\nRaw snippet:", rawContent.slice(0, 300));
    throw new Error("فشل تحليل خطة المشاهد من الذكاء الاصطناعي. يرجى إعادة المحاولة.");
  }
}
