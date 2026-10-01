import 'server-only';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import crypto from 'node:crypto';
import { DEFAULT_MOTION_FILM } from '@/lib/motion-engine/master-template';

export interface MotionProject {
  id: string;
  title: string;
  durationSeconds: number;
  modelUsed?: string;
  prompt?: string;
  htmlCode: string;
  renderedVideoUrl?: string; // e.g. /renders/uuid.mp4
  createdAt: string;
  updatedAt: string;
}

const DB_PATH = path.join(process.cwd(), 'data', 'projects.json');

async function ensureDb(): Promise<MotionProject[]> {
  try {
    if (!fsSync.existsSync(DB_PATH)) {
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      const initialProjects: MotionProject[] = [
        {
          id: 'artek-perfumes-default',
          title: 'فيلم مصنع أرتيك للعطور (النموذج الأصلي)',
          durationSeconds: 60,
          modelUsed: 'Motion AI Studio Engine',
          prompt: 'فيلم سينمائي احترافي لمصنع عطور أرتيك - 6 مشاهد، 60 ثانية، هوية بصرية فاخرة',
          htmlCode: DEFAULT_MOTION_FILM,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      await fs.writeFile(DB_PATH, JSON.stringify(initialProjects, null, 2), 'utf-8');
      return initialProjects;
    }

    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[DB] Error loading projects database:', err);
    return [];
  }
}

export async function getAllProjects(): Promise<MotionProject[]> {
  const projects = await ensureDb();
  // Sort by updatedAt descending (newest first)
  return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getProjectById(id: string): Promise<MotionProject | null> {
  const projects = await ensureDb();
  return projects.find((p) => p.id === id) || null;
}

export async function saveProject(data: {
  id?: string;
  title: string;
  durationSeconds: number;
  modelUsed?: string;
  prompt?: string;
  htmlCode: string;
  renderedVideoUrl?: string;
}): Promise<MotionProject> {
  const projects = await ensureDb();
  const now = new Date().toISOString();

  let project: MotionProject;

  if (data.id) {
    const existingIndex = projects.findIndex((p) => p.id === data.id);
    if (existingIndex >= 0) {
      project = {
        ...projects[existingIndex],
        ...data,
        updatedAt: now,
      };
      projects[existingIndex] = project;
    } else {
      project = {
        id: data.id,
        title: data.title || 'مشروع موشن جرافيك',
        durationSeconds: data.durationSeconds || 60,
        modelUsed: data.modelUsed,
        prompt: data.prompt,
        htmlCode: data.htmlCode,
        renderedVideoUrl: data.renderedVideoUrl,
        createdAt: now,
        updatedAt: now,
      };
      projects.unshift(project);
    }
  } else {
    project = {
      id: 'proj_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
      title: data.title || 'مشروع موشن جرافيك',
      durationSeconds: data.durationSeconds || 60,
      modelUsed: data.modelUsed,
      prompt: data.prompt,
      htmlCode: data.htmlCode,
      renderedVideoUrl: data.renderedVideoUrl,
      createdAt: now,
      updatedAt: now,
    };
    projects.unshift(project);
  }

  await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2), 'utf-8');
  return project;
}

export async function updateProjectRenderUrl(id: string, renderedVideoUrl: string): Promise<boolean> {
  const projects = await ensureDb();
  const p = projects.find((item) => item.id === id);
  if (!p) return false;
  p.renderedVideoUrl = renderedVideoUrl;
  p.updatedAt = new Date().toISOString();
  await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2), 'utf-8');
  return true;
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await ensureDb();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  await fs.writeFile(DB_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}
