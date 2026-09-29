import "server-only";
import {NextResponse} from "next/server";
import {sendOpenRouterRequest} from "@/lib/openrouter/client";
import {cookies} from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const model = body.model || "google/gemini-2.5-flash";
    const apiKey = body.apiKey || cookies().get("OPENROUTER_SESSION_KEY")?.value || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        error: "OPENROUTER_AUTH_FAILED",
        message: "مفتاح OpenRouter غير صالح أو غير موجود",
      }, {status: 401});
    }

    const payload = {
      model,
      messages: [{role: "user" as const, content: "Reply with a JSON object { \"status\": \"ok\" } only. No markdown."}],
      max_tokens: 10,
      temperature: 0,
    };

    const data = await sendOpenRouterRequest(apiKey, payload);
    
    // Check if we got something back
    if (data && data.choices && data.choices.length > 0) {
      return NextResponse.json({
        ok: true,
        provider: "openrouter",
        model,
        message: "تم الاتصال بنجاح",
      });
    } else {
      throw new Error("استجابة غير متوقعة من OpenRouter");
    }

  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: "OPENROUTER_AUTH_FAILED",
      message: error.message || "حدث خطأ غير معروف",
    }, {status: 500});
  }
}
