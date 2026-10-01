import 'server-only';
import { NextResponse } from 'next/server';
import { getAllProjects, saveProject } from '@/lib/db/projects';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error('[API /api/projects GET]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, title, durationSeconds, modelUsed, prompt, htmlCode, renderedVideoUrl } = body;

    if (!htmlCode) {
      return NextResponse.json({ success: false, error: 'كود HTML مطلوب للحفظ' }, { status: 400 });
    }

    const saved = await saveProject({
      id,
      title: title || 'مشروع موشن جرافيك',
      durationSeconds: Number(durationSeconds) || 60,
      modelUsed,
      prompt,
      htmlCode,
      renderedVideoUrl,
    });

    return NextResponse.json({ success: true, project: saved });
  } catch (error: any) {
    console.error('[API /api/projects POST]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
