import "server-only";
import { NextResponse } from "next/server";
import { scanMotionStyles } from "@/lib/motion-engine/styles-scanner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await scanMotionStyles();
    return NextResponse.json({
      success: true,
      directory: data.directory,
      exists: data.exists,
      count: data.styles.length,
      styles: data.styles,
    });
  } catch (error: any) {
    console.error("[API /api/styles GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
