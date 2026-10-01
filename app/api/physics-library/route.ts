import "server-only";
import { NextResponse } from "next/server";
import { scanPhysicsLibrary } from "@/lib/motion-engine/physics-scanner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await scanPhysicsLibrary();
    return NextResponse.json({
      success: true,
      directory: data.directory,
      exists: data.exists,
      count: data.items.length,
      items: data.items,
    });
  } catch (error: any) {
    console.error("[API /api/physics-library GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
