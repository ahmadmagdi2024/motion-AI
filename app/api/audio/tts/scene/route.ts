import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

export const runtime = "nodejs";
export const maxDuration = 180; // 3 minutes timeout

interface SceneAudioRequestItem {
  sceneIndex: number;
  narration: string;
  startTime: number;
  durationSeconds?: number;
}

// Helper to get audio duration via FFmpeg
function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    if (!ffmpegPath) return resolve(0);
    const proc = spawn(ffmpegPath, ["-i", filePath], { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", () => {
      const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (match) {
        const hours = parseFloat(match[1]);
        const mins = parseFloat(match[2]);
        const secs = parseFloat(match[3]);
        resolve(hours * 3600 + mins * 60 + secs);
      } else {
        resolve(0);
      }
    });
  });
}

// Helper to stitch multiple scene audios at their start times
function stitchSceneAudios(
  sceneAudios: Array<{ path: string; startTime: number }>,
  totalDuration: number,
  outputFilePath: string
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!ffmpegPath || sceneAudios.length === 0) return resolve(false);

    // Build FFmpeg command
    const args: string[] = ["-y"];
    sceneAudios.forEach((item) => {
      args.push("-i", item.path);
    });

    // Build filter_complex: [0:a]adelay=0|0[a0];[1:a]adelay=6000|6000[a1]...;[a0][a1]amix=inputs=N:dropout_transition=0:normalize=0[out]
    let filter = "";
    const padLabels: string[] = [];

    sceneAudios.forEach((item, idx) => {
      const delayMs = Math.max(0, Math.round(item.startTime * 1000));
      filter += `[${idx}:a]adelay=${delayMs}|${delayMs}[a${idx}];`;
      padLabels.push(`[a${idx}]`);
    });

    filter += `${padLabels.join("")}amix=inputs=${sceneAudios.length}:dropout_transition=0:normalize=0[out]`;

    args.push(
      "-filter_complex",
      filter,
      "-map",
      "[out]",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "192k",
      "-t",
      totalDuration.toString(),
      outputFilePath
    );

    console.log("[stitchSceneAudios] Running FFmpeg stitch for", sceneAudios.length, "tracks");
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("close", (code) => {
      if (code === 0 && fsSync.existsSync(outputFilePath)) {
        resolve(true);
      } else {
        console.error("[stitchSceneAudios] FFmpeg error code:", code, stderr.slice(-300));
        resolve(false);
      }
    });
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      scenes,
      totalDuration = 30,
      model = "fish-audio/s2.1-pro-free:free",
      stitchMasterTrack = true,
      filmTitle = "مشروع موشن جرافيك",
    } = body;

    const items: SceneAudioRequestItem[] = Array.isArray(scenes) ? scenes : [body];

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "لم يتم تقديم أي نصوص مشاهد لتحويلها إلى صوت." },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const apiKey =
      cookieStore.get("OPENROUTER_SESSION_KEY")?.value ||
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح OpenRouter API غير متوفر. يرجى إدخال المفتاح من الإعدادات." },
        { status: 401 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "audio");
    await fs.mkdir(uploadDir, { recursive: true });

    const batchId = crypto.randomUUID().slice(0, 8);
    const results: Array<{
      sceneIndex: number;
      startTime: number;
      audioUrl: string;
      durationSeconds: number;
      narration: string;
    }> = [];

    const stitchCandidates: Array<{ path: string; startTime: number }> = [];

    // Process each scene narration through OpenRouter Fish Audio
    for (const item of items) {
      const textToSpeak = (item.narration || "").trim();
      if (!textToSpeak) continue;

      console.log(
        `[TTS/FishAudio] Generating audio for scene ${item.sceneIndex} (start: ${item.startTime}s): "${textToSpeak.slice(0, 40)}..."`
      );

      const ttsResponse = await fetch("https://openrouter.ai/api/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3005",
          "X-Title": "Motion AI Studio",
        },
        body: JSON.stringify({
          model,
          input: textToSpeak,
          response_format: "mp3",
        }),
      });

      if (!ttsResponse.ok) {
        let errText = "";
        try {
          errText = await ttsResponse.text();
        } catch (_) {}

        console.error(`[TTS/FishAudio] Error for scene ${item.sceneIndex}:`, ttsResponse.status, errText);

        let userMsg = `فشل توليد صوت المشهد ${item.sceneIndex + 1}`;
        if (ttsResponse.status === 401) {
          userMsg = "مفتاح OpenRouter API غير مصرح به أو انتهت صلاحيته.";
        } else if (ttsResponse.status === 429) {
          userMsg = "تم تجاوز الحد المجاني المؤقت لنموذج fish-audio على OpenRouter. يرجى الانتظار دقيقة.";
        } else if (ttsResponse.status === 404) {
          userMsg = `نموذج الصوت (${model}) غير متاح حالياً على OpenRouter.`;
        }

        return NextResponse.json(
          {
            error: `${userMsg} (${ttsResponse.status})`,
            details: errText,
            sceneIndex: item.sceneIndex,
          },
          { status: ttsResponse.status || 500 }
        );
      }

      const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
      const fileName = `scene_${batchId}_${item.sceneIndex}.mp3`;
      const fullPath = path.join(uploadDir, fileName);

      await fs.writeFile(fullPath, audioBuffer);

      // Measure actual audio duration
      const actualDuration = await getAudioDuration(fullPath);

      results.push({
        sceneIndex: item.sceneIndex,
        startTime: item.startTime,
        audioUrl: `/uploads/audio/${fileName}`,
        durationSeconds: actualDuration || item.durationSeconds || 5,
        narration: textToSpeak,
      });

      stitchCandidates.push({
        path: fullPath,
        startTime: item.startTime,
      });
    }

    // Stitch master track if multiple scenes
    let masterTrackUrl: string | undefined;
    let masterTrackDuration: number = totalDuration;

    if (stitchMasterTrack && stitchCandidates.length > 0) {
      const masterFileName = `voiceover_${batchId}_full.mp3`;
      const masterFullPath = path.join(uploadDir, masterFileName);

      const stitched = await stitchSceneAudios(
        stitchCandidates,
        totalDuration,
        masterFullPath
      );

      if (stitched) {
        masterTrackUrl = `/uploads/audio/${masterFileName}`;
        masterTrackDuration = await getAudioDuration(masterFullPath);
        console.log(`[TTS] Master track stitched successfully: ${masterTrackUrl} (${masterTrackDuration}s)`);
      }
    }

    return NextResponse.json({
      success: true,
      batchId,
      modelUsed: model,
      scenes: results,
      masterTrack: masterTrackUrl
        ? {
            url: masterTrackUrl,
            duration: masterTrackDuration || totalDuration,
            title: `تعليق صوتي ذكي (${filmTitle})`,
            type: "ai_voiceover",
          }
        : undefined,
    });
  } catch (error: any) {
    console.error("[api/audio/tts/scene] Exception:", error);
    return NextResponse.json(
      { error: error?.message || "حدث خطأ غير متوقع أثناء توليد الصوت." },
      { status: 500 }
    );
  }
}
