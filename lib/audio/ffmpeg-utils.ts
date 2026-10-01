import path from "node:path";
import fsSync from "node:fs";
import { spawn } from "node:child_process";

export function getFfmpegBinary(): string {
  const directPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg");
  if (fsSync.existsSync(directPath)) return directPath;
  try {
    const p = require("ffmpeg-static");
    if (p && fsSync.existsSync(p)) return p;
  } catch (_) {}
  return "ffmpeg";
}

export function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      const ffmpeg = getFfmpegBinary();
      const proc = spawn(ffmpeg, ["-i", filePath], { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      proc.stderr.on("data", (d) => (stderr += d.toString()));
      proc.on("error", (e) => {
        console.warn("[getAudioDuration] spawn warning:", e.message);
        resolve(0);
      });
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
    } catch (err) {
      console.warn("[getAudioDuration] Exception:", err);
      resolve(0);
    }
  });
}

export function stitchSceneAudios(
  sceneAudios: Array<{ path: string; startTime: number }>,
  totalDuration: number,
  outputFilePath: string
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const ffmpeg = getFfmpegBinary();
      if (sceneAudios.length === 0) return resolve(false);

      const args: string[] = ["-y"];
      sceneAudios.forEach((item) => {
        args.push("-i", item.path);
      });

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

      console.log("[stitchSceneAudios] Running FFmpeg stitch for", sceneAudios.length, "tracks using:", ffmpeg);
      const proc = spawn(ffmpeg, args, { stdio: ["ignore", "pipe", "pipe"] });

      let stderr = "";
      proc.stderr.on("data", (d) => (stderr += d.toString()));
      proc.on("error", (e) => {
        console.error("[stitchSceneAudios] spawn error:", e.message);
        resolve(false);
      });

      proc.on("close", (code) => {
        if (code === 0 && fsSync.existsSync(outputFilePath)) {
          resolve(true);
        } else {
          console.error("[stitchSceneAudios] FFmpeg error code:", code, stderr.slice(-300));
          resolve(false);
        }
      });
    } catch (err) {
      console.error("[stitchSceneAudios] Exception:", err);
      resolve(false);
    }
  });
}
