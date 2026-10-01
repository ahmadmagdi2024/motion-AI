import 'server-only';
import { NextResponse } from 'next/server';
import {
  getProjectById,
  deleteProject,
  updateProjectRenderUrl,
  updateProjectUnified,
} from '@/lib/db/projects';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const project = await getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'المشروع غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updated = await updateProjectUnified(params.id, body);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'تعذر العثور على المشروع لتحديثه' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error('[API /api/projects/[id] PATCH]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const deleted = await deleteProject(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'تعذر حذف المشروع' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
