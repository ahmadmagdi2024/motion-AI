import "server-only";
import {OpenRouterRequest} from "./types";

export async function sendOpenRouterRequest(
  apiKey: string,
  payload: OpenRouterRequest
) {
  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const siteUrl = process.env.OPENROUTER_SITE_URL || "http://localhost:3000";
  const appName = process.env.OPENROUTER_APP_NAME || "AI Video Studio";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60 seconds

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Referer: siteUrl,
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

      let errorMessage = "عطل مؤقت عند المزود أو النموذج";
      if (response.status === 401) errorMessage = "مفتاح OpenRouter غير صالح";
      else if (response.status === 402) errorMessage = "لا يوجد رصيد كافٍ";
      else if (response.status === 404) errorMessage = "النموذج المحدد غير موجود أو غير متاح";
      else if (response.status === 429) errorMessage = "تم تجاوز حد الطلبات";
      
      console.error("[OpenRouter] Request failed:", {
        status: response.status,
        model: payload.model,
        body: errorBody,
      });
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      throw new Error("انتهى وقت الطلب (Timeout)");
    }
    throw error;
  }
}

export function extractJsonFromResponse(content: string) {
  if (!content) return {};
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error("لم يقم النموذج بإرجاع JSON صالح.");
  }
}
