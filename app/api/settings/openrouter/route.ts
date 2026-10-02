import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { RECOMMENDED_MODELS, OpenRouterSettings } from "@/lib/openrouter/types";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = cookies();
  const apiKeyConfigured = !!(
    cookieStore.get("OPENROUTER_SESSION_KEY")?.value ||
    process.env.OPENROUTER_API_KEY
  );

  const model =
    cookieStore.get("OPENROUTER_MODEL")?.value ||
    process.env.OPENROUTER_MODEL ||
    "google/gemini-3.8-flash";

  const settings: OpenRouterSettings = {
    apiKeyConfigured,
    model,
    availableModels: RECOMMENDED_MODELS,
  };

  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, model } = body;
    const cookieStore = cookies();

    if (typeof apiKey === "string") {
      const trimmed = apiKey.trim();
      if (trimmed) {
        cookieStore.set("OPENROUTER_SESSION_KEY", trimmed, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      } else {
        cookieStore.delete("OPENROUTER_SESSION_KEY");
      }
    }

    if (typeof model === "string" && model.trim()) {
      cookieStore.set("OPENROUTER_MODEL", model.trim(), {
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }

    return NextResponse.json({ ok: true, message: "تم حفظ الإعدادات بنجاح" });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "فشل حفظ الإعدادات" },
      { status: 500 }
    );
  }
}
