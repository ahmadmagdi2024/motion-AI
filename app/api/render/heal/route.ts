import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runAutoCritiqueAndHeal } from "@/lib/motion-engine/scene-healer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 240; // 4 minutes

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { html, duration = 30, model } = body;

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "لم يتم تزويد كود HTML صالح للإصلاح البصري" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const apiKey =
      cookieStore.get("OPENROUTER_SESSION_KEY")?.value ||
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "يرجى إدخال مفتاح OpenRouter API من نافذة الإعدادات أولاً لإجراء الفحص والإصلاح البصري." },
        { status: 401 }
      );
    }

    const durationSec = Math.max(3, Math.min(Number(duration) || 30, 120));
    const activeModel =
      model ||
      cookieStore.get("OPENROUTER_MODEL")?.value ||
      process.env.OPENROUTER_MODEL ||
      "google/gemini-3.8-flash";

    const report = await runAutoCritiqueAndHeal(html, durationSec, apiKey, activeModel);

    return NextResponse.json({
      success: true,
      ...report,
    });
  } catch (error: any) {
    console.error("[Heal API] Error during autonomous critique and heal:", error);
    return NextResponse.json(
      { error: error?.message || "حدث خطأ أثناء إجراء الفحص والتصحيح البصري التلقائي" },
      { status: 500 }
    );
  }
}
