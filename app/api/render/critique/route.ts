import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { performVisualCritique } from "@/lib/motion-engine/critique-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180; // 3 minutes max

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { html, duration = 30, model } = body;

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "لم يتم تزويد كود HTML صالح للتدقيق البصري" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const apiKey =
      cookieStore.get("OPENROUTER_SESSION_KEY")?.value ||
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "يرجى إدخال مفتاح OpenRouter API من نافذة الإعدادات أولاً لإجراء الفحص البصري الذكي." },
        { status: 401 }
      );
    }

    const durationSec = Math.max(3, Math.min(Number(duration) || 30, 120));
    const result = await performVisualCritique(html, durationSec, apiKey, model);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[Critique API] Error performing visual critique:", error);
    return NextResponse.json(
      { error: error?.message || "حدث خطأ أثناء إجراء الفحص البصري التلقائي" },
      { status: 500 }
    );
  }
}
