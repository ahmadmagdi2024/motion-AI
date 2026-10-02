import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { extractScenesFromHtml, ExtractedScene } from "@/lib/motion-engine/scene-extractor";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";

export const runtime = "nodejs";

export interface SceneNarrationItem {
  sceneIndex: number;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  headline: string;
  narration: string;
  wordCount: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { htmlCode, totalDuration = 30, filmTitle, customPrompt } = body;

    let scenes: ExtractedScene[] = body.scenes;
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      if (!htmlCode) {
        return NextResponse.json(
          { error: "يرجى توفير كود HTML أو مصفوفة المشاهد لاستخراج السيناريو." },
          { status: 400 }
        );
      }
      scenes = extractScenesFromHtml(htmlCode, totalDuration);
    }

    if (scenes.length === 0) {
      return NextResponse.json(
        { error: "لم يتم العثور على أي مشاهد في الكود المقدم." },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const apiKey =
      cookieStore.get("OPENROUTER_SESSION_KEY")?.value ||
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح OpenRouter API غير متوفر. يرجى ضبطه من الإعدادات." },
        { status: 401 }
      );
    }

    const scriptModel =
      cookieStore.get("OPENROUTER_MODEL")?.value ||
      process.env.OPENROUTER_MODEL ||
      "google/gemini-3.8-flash";

    const systemPrompt = `أنت كاتب سيناريو إعلاني ومعلق صوتي محترف (Professional Voiceover Copywriter).
مهمتك: كتابة نص تعليق صوتي (Narration) سينمائي وجذاب لكل مشهد من مشاهد فيديو الموشن جرافيك المقدم إليك.

قواعد صارمة جداً:
1. لكل مشهد، اكتب جملة تعليق صوتي فصيحة، رنانة، ومعبرة بدقة عن الفكرة المكتوبة في عنوان المشهد.
2. التزام صارم بحد الكلمات: يجب ألا يتجاوز عدد الكلمات (suggestedMaxWords) للمشهد إطلاقاً، لكي يكتمل نطق الجملة قبل انتهاء زمن المشهد، ولا يتداخل مع المشهد التالي.
3. الأسلوب: لغة عربية فصحى معاصرة وسينمائية تناسب إعلانات موشن جرافيك عالية المستوى.
4. أجب حصراً بصيغة JSON على شكل مصفوفة كائنات، بدون أي ماركداون وبدون أي نص ترحيبي أو ختامي:
[
  {
    "sceneIndex": 0,
    "narration": "نص التعليق الصوتي للمشهد الأول"
  }
]`;

    const userContent = JSON.stringify(
      {
        filmTitle: filmTitle || "فيلم موشن جرافيك",
        totalDurationSeconds: totalDuration,
        scenesSummary: scenes.map((s) => ({
          sceneIndex: s.sceneIndex,
          headline: s.headline,
          kicker: s.kicker,
          sub: s.sub,
          startTime: s.startTime,
          durationSeconds: s.durationSeconds,
          suggestedMaxWords: s.suggestedMaxWords,
        })),
        customToneInstruction: customPrompt || "أسلوب سينمائي حماسي وواثق",
      },
      null,
      2
    );

    const openRouterResponse = await sendOpenRouterRequest(apiKey, {
      model: scriptModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const choice = openRouterResponse.choices?.[0];
    const rawContent = choice?.message?.content || "";

    // Parse JSON output
    let parsedScript: Array<{ sceneIndex: number; narration: string }> = [];
    try {
      const cleaned = rawContent
        .replace(/```(?:json)?/gi, "")
        .replace(/```/g, "")
        .trim();
      parsedScript = JSON.parse(cleaned);
    } catch (_) {
      // Extract array between [ and ]
      const start = rawContent.indexOf("[");
      const end = rawContent.lastIndexOf("]");
      if (start !== -1 && end > start) {
        parsedScript = JSON.parse(rawContent.slice(start, end + 1));
      }
    }

    const narrationItems: SceneNarrationItem[] = scenes.map((s) => {
      const match = parsedScript.find((p) => p.sceneIndex === s.sceneIndex);
      const text = match?.narration?.trim() || `${s.headline}.`;
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      return {
        sceneIndex: s.sceneIndex,
        startTime: s.startTime,
        endTime: s.endTime,
        durationSeconds: s.durationSeconds,
        headline: s.headline,
        narration: text,
        wordCount,
      };
    });

    return NextResponse.json({
      success: true,
      narrations: narrationItems,
      totalScenes: narrationItems.length,
      totalDuration,
    });
  } catch (error: any) {
    console.error("[api/audio/script] Error:", error);
    return NextResponse.json(
      { error: error?.message || "فشل توليد نصوص التعليق الصوتي للمشاهد." },
      { status: 500 }
    );
  }
}
