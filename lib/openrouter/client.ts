import "server-only";
import { OpenRouterRequest } from "./types";

export async function sendOpenRouterRequest(
  apiKey: string,
  payload: OpenRouterRequest
) {
  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const siteUrl = process.env.OPENROUTER_SITE_URL || "http://localhost:3005";
  const appName = process.env.OPENROUTER_APP_NAME || "MotionAI Studio v3";

  const controller = new AbortController();
  // 270 seconds (4.5 minutes) timeout for creative code generation & multi-turn agents
  const timeout = setTimeout(() => controller.abort(), 270000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": appName,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch (e) {}

      let errorMessage = "عطل مؤقت عند مزود الخدمة أو النموذج المختار";
      if (response.status === 401) {
        errorMessage = "مفتاح OpenRouter API غير صالح أو غير مصرح به";
      } else if (response.status === 402) {
        errorMessage = "رصيدك في OpenRouter غير كافٍ لتشغيل هذا النموذج";
      } else if (response.status === 404) {
        errorMessage = "النموذج المحدد غير موجود أو غير متاح حالياً على OpenRouter";
      } else if (response.status === 429) {
        if (payload.model.includes(":free")) {
          errorMessage = "النموذج المجاني (:free) يواجه ضغطاً كبيراً ومؤقتاً من مزود OpenRouter. يرجى الانتظار دقيقة أو اختيار نموذج رسمي مثل Gemini 2.5 Flash أو DeepSeek V3 (تكلفته سنتات معدومة وبدون أي قيود).";
        } else {
          errorMessage = "تم تجاوز حد الطلبات المسموح به مؤقتاً (Rate Limit). يرجى الانتظار دقيقة وإعادة المحاولة.";
        }
      }

      console.error("[OpenRouter v3] Request failed:", {
        status: response.status,
        model: payload.model,
        body: errorBody,
      });

      throw new Error(`${errorMessage} (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      throw new Error("استغرق توليد الكود وقتاً أطول من المتوقع (تجاوز 4.5 دقائق). جرب اختيار نموذج أسرع مثل Gemini 3.8 Flash أو Claude Sonnet 5.5.");
    }
    throw error;
  }
}
