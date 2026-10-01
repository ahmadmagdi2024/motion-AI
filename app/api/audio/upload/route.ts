import "server-only";
import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAudioDuration(filePath: string): number | null {
  try {
    let ffmpegPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg");
    if (!fsSync.existsSync(ffmpegPath)) {
      try {
        ffmpegPath = require("ffmpeg-static");
      } catch (e) {}
    }
    if (!ffmpegPath || !fsSync.existsSync(ffmpegPath)) return null;

    const out = execSync(`"${ffmpegPath}" -i "${filePath}" 2>&1`).toString();
    const match = out.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
      const hours = parseFloat(match[1]);
      const minutes = parseFloat(match[2]);
      const seconds = parseFloat(match[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
  } catch (e: any) {
    const out = e.stdout ? e.stdout.toString() : e.toString();
    const match = out.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
      const hours = parseFloat(match[1]);
      const minutes = parseFloat(match[2]);
      const seconds = parseFloat(match[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال أي ملف صوتي" }, { status: 400 });
    }

    const originalName = file.name || "audio.mp3";
    const ext = path.extname(originalName).toLowerCase() || ".mp3";
    const allowedExts = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".weba", ".flac"];

    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        { error: "نوع الملف الصوتي غير مدعوم. يرجى استخدام MP3 أو WAV أو M4A أو AAC." },
        { status: 400 }
      );
    }

    // 50MB max limit
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "حجم الملف الصوتي يتجاوز الحد الأقصى (50 ميجابايت)" }, { status: 400 });
    }

    const root = process.cwd();
    const uploadDir = path.join(root, "public", "uploads", "audio");
    await fs.mkdir(uploadDir, { recursive: true });

    const uuid = crypto.randomUUID();
    const savedFilename = `${uuid}${ext}`;
    const destinationPath = path.join(uploadDir, savedFilename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(destinationPath, buffer);

    const duration = getAudioDuration(destinationPath) || 0;

    return NextResponse.json({
      success: true,
      url: `/uploads/audio/${savedFilename}`,
      name: originalName,
      size: file.size,
      duration: Math.round(duration * 10) / 10,
    });
  } catch (error: any) {
    console.error("[/api/audio/upload]", error);
    return NextResponse.json({ error: error.message || "فشل رفع الملف الصوتي" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const root = process.cwd();
    const uploadDir = path.join(root, "public", "uploads", "audio");

    if (!fsSync.existsSync(uploadDir)) {
      return NextResponse.json({ success: true, audioFiles: [] });
    }

    const files = await fs.readdir(uploadDir);
    const audioFiles = [];

    for (const f of files) {
      if (f.startsWith(".")) continue;
      const fullPath = path.join(uploadDir, f);
      try {
        const stats = await fs.stat(fullPath);
        if (stats.isFile()) {
          const dur = getAudioDuration(fullPath);
          const isLatest = f === "latest-voiceover.wav";
          audioFiles.push({
            url: `/uploads/audio/${f}`,
            name: isLatest ? "التعليق الصوتي المولد الأخير (4:15 PM)" : f,
            size: stats.size,
            duration: dur ? Math.round(dur * 10) / 10 : 0,
            mtime: stats.mtimeMs,
          });
        }
      } catch (e) {}
    }

    // Sort newest first
    audioFiles.sort((a, b) => b.mtime - a.mtime);

    return NextResponse.json({ success: true, audioFiles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
