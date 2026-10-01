import 'server-only';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import crypto from 'node:crypto';
import { DEFAULT_MOTION_FILM } from '@/lib/motion-engine/master-template';

export interface ProjectTranslation {
  language: string; // e.g. "en", "fr", "es", "de", "tr", "ru", "zh", "ja"
  languageName: string; // e.g. "English", "Français", "Español"
  title: string;
  htmlCode: string;
  voiceoverScript?: Array<{
    sceneIndex: number;
    startTime: number;
    endTime: number;
    durationSeconds: number;
    headline?: string;
    narration: string;
    audioUrl?: string;
  }>;
  audioTrack?: any;
  renderedVideoUrl?: string;
  translatedAt: string;
}

export interface MotionProject {
  id: string;
  title: string;
  durationSeconds: number;
  modelUsed?: string;
  prompt?: string;
  htmlCode: string;
  renderedVideoUrl?: string; // e.g. /renders/uuid.mp4
  audioTrack?: any;
  voiceoverScript?: any[];
  currentLanguage?: string;
  translations?: Record<string, ProjectTranslation>;
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
          currentLanguage: 'ar',
          translations: {},
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
  audioTrack?: any;
  voiceoverScript?: any[];
  currentLanguage?: string;
  translations?: Record<string, ProjectTranslation>;
}): Promise<MotionProject> {
  const projects = await ensureDb();
  const now = new Date().toISOString();

  let project: MotionProject;

  if (data.id) {
    const existingIndex = projects.findIndex((p) => p.id === data.id);
    if (existingIndex >= 0) {
      const existing = projects[existingIndex];
      const cleanData: any = {};
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) cleanData[k] = v;
      }

      // Merge translations preserving existing audioTrack
      const mergedTranslations: Record<string, ProjectTranslation> = {
        ...(existing.translations || {}),
      };
      if (data.translations) {
        for (const [lang, tr] of Object.entries(data.translations)) {
          const exTr = mergedTranslations[lang];
          mergedTranslations[lang] = {
            ...(exTr || {}),
            ...tr,
            audioTrack:
              tr.audioTrack !== undefined && tr.audioTrack !== null
                ? tr.audioTrack
                : exTr?.audioTrack || null,
          };
        }
      }

      project = {
        ...existing,
        ...cleanData,
        translations: mergedTranslations,
        audioTrack:
          cleanData.audioTrack !== undefined && cleanData.audioTrack !== null
            ? cleanData.audioTrack
            : existing.audioTrack || null,
        currentLanguage: cleanData.currentLanguage || existing.currentLanguage || 'ar',
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
        audioTrack: data.audioTrack || null,
        voiceoverScript: data.voiceoverScript,
        currentLanguage: data.currentLanguage || 'ar',
        translations: data.translations || {},
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
      audioTrack: data.audioTrack || null,
      voiceoverScript: data.voiceoverScript,
      currentLanguage: data.currentLanguage || 'ar',
      translations: data.translations || {},
      createdAt: now,
      updatedAt: now,
    };
    projects.unshift(project);
  }

  await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2), 'utf-8');
  return project;
}

export async function saveProjectTranslation(
  projectId: string,
  translation: ProjectTranslation
): Promise<MotionProject | null> {
  const projects = await ensureDb();
  const p = projects.find((item) => item.id === projectId);
  if (!p) return null;

  if (!p.translations) {
    p.translations = {};
  }
  const existingTr = p.translations[translation.language];
  p.translations[translation.language] = {
    ...(existingTr || {}),
    ...translation,
    audioTrack:
      translation.audioTrack !== undefined && translation.audioTrack !== null
        ? translation.audioTrack
        : existingTr?.audioTrack || null,
  };
  p.currentLanguage = translation.language;
  p.updatedAt = new Date().toISOString();

  await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2), 'utf-8');
  return p;
}

export async function updateProjectAudio(
  projectId: string,
  audioTrack: any,
  language?: string
): Promise<MotionProject | null> {
  const projects = await ensureDb();
  const p = projects.find((item) => item.id === projectId);
  if (!p) return null;

  const targetLang = language || p.currentLanguage || 'ar';
  if (targetLang !== 'ar') {
    if (!p.translations) p.translations = {};
    if (!p.translations[targetLang]) {
      p.translations[targetLang] = {
        language: targetLang,
        languageName: targetLang,
        title: p.title,
        htmlCode: p.htmlCode,
        audioTrack,
        translatedAt: new Date().toISOString(),
      };
    } else {
      p.translations[targetLang].audioTrack = audioTrack;
    }
    p.currentLanguage = targetLang;
  } else {
    p.audioTrack = audioTrack;
  }

  p.updatedAt = new Date().toISOString();
  await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2), 'utf-8');
  return p;
}

export async function updateProjectFields(
  projectId: string,
  fields: Partial<MotionProject>
): Promise<MotionProject | null> {
  const projects = await ensureDb();
  const p = projects.find((item) => item.id === projectId);
  if (!p) return null;

  const { translations, ...otherFields } = fields;

  for (const [k, v] of Object.entries(otherFields)) {
    if (v !== undefined) {
      (p as any)[k] = v;
    }
  }

  if (translations) {
    if (!p.translations) p.translations = {};
    for (const [lang, tr] of Object.entries(translations)) {
      const existingTr = p.translations[lang];
      p.translations[lang] = {
        ...(existingTr || {}),
        ...tr,
        audioTrack:
          tr.audioTrack !== undefined && tr.audioTrack !== null
            ? tr.audioTrack
            : existingTr?.audioTrack || null,
      };
    }
  }

  p.updatedAt = new Date().toISOString();
  await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2), 'utf-8');
  return p;
}

export async function updateProjectUnified(
  projectId: string,
  payload: {
    audioTrack?: any;
    currentLanguage?: string;
    translations?: Record<string, ProjectTranslation>;
    [key: string]: any;
  }
): Promise<MotionProject | null> {
  const projects = await ensureDb();
  const p = projects.find((item) => item.id === projectId);
  if (!p) return null;

  const { audioTrack, currentLanguage, translations, ...otherFields } = payload;

  if (currentLanguage !== undefined) {
    p.currentLanguage = currentLanguage;
  }

  if (translations !== undefined) {
    if (!p.translations) p.translations = {};
    for (const [lang, tr] of Object.entries(translations)) {
      const existingTr = p.translations[lang];
      p.translations[lang] = {
        ...(existingTr || {}),
        ...tr,
        audioTrack:
          tr.audioTrack !== undefined && tr.audioTrack !== null
            ? tr.audioTrack
            : existingTr?.audioTrack || null,
      };
    }
  }

  if (audioTrack !== undefined) {
    const targetLang = currentLanguage || p.currentLanguage || 'ar';
    if (targetLang !== 'ar') {
      if (!p.translations) p.translations = {};
      if (!p.translations[targetLang]) {
        p.translations[targetLang] = {
          language: targetLang,
          languageName: targetLang,
          title: p.title,
          htmlCode: p.htmlCode,
          audioTrack,
          translatedAt: new Date().toISOString(),
        };
      } else {
        p.translations[targetLang].audioTrack = audioTrack;
      }
    } else {
      p.audioTrack = audioTrack;
    }
  }

  for (const [k, v] of Object.entries(otherFields)) {
    if (v !== undefined) {
      (p as any)[k] = v;
    }
  }

  p.updatedAt = new Date().toISOString();
  await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2), 'utf-8');
  return p;
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
