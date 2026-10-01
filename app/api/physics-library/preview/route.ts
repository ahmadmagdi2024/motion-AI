import "server-only";
import { NextResponse } from "next/server";
import { getPhysicsMotionRaw } from "@/lib/motion-engine/physics-scanner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("file");

    if (!filename) {
      return new Response("اسم الملف مطلوب", { status: 400 });
    }

    const html = await getPhysicsMotionRaw(filename);
    if (!html) {
      return new Response("الملف غير موجود في مكتبة الحركات الفيزيائية", { status: 404 });
    }

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}
