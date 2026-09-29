import "server-only";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {OpenRouterSettings} from "@/lib/openrouter/types";

export const runtime = "nodejs";

export async function GET() {
  const apiKeyConfigured = !!(cookies().get("OPENROUTER_SESSION_KEY")?.value || process.env.OPENROUTER_API_KEY);
  const model = cookies().get("OPENROUTER_MODEL")?.value || process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
  const visionEnabled = cookies().get("OPENROUTER_VISION")?.value === "true";

  return NextResponse.json({
    provider: "openrouter",
    apiKeyConfigured,
    model,
    visionEnabled,
    temperature: 0.4,
    maxTokens: 4000
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { apiKey, model, visionEnabled } = body;

  const cookieStore = cookies();
  
  if (apiKey) {
    // Session cookie
    cookieStore.set("OPENROUTER_SESSION_KEY", apiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 // 1 day session
    });
  }

  if (model) {
    cookieStore.set("OPENROUTER_MODEL", model, { maxAge: 60 * 60 * 24 * 30 }); // 30 days
  }
  
  if (typeof visionEnabled === "boolean") {
    cookieStore.set("OPENROUTER_VISION", String(visionEnabled), { maxAge: 60 * 60 * 24 * 30 });
  }

  return NextResponse.json({ ok: true, message: "تم حفظ الإعدادات" });
}
