import { updateProjectRenderUrl } from "@/lib/db/projects";
import { injectStudioBridge } from "@/lib/motion-engine/studio-bridge";
import "server-only";
import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  let browser: any = null;
  let tempHtmlPath = "";

  try {
    const body = await request.json();
    const { html, duration = 30, title = "motion-film", fps = 30, projectId, audioUrl, motionBlur = false } = body;

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "لم يتم تزويد كود HTML صالح للريندر" },
        { status: 400 }
      );
    }

    const durationSec = Math.max(2, Math.min(Number(duration) || 30, 120));
    const renderFps = Math.max(15, Math.min(Number(fps) || 30, 60));
    const sub = motionBlur ? 4 : 1;
    const captureFps = renderFps * sub;
    const totalFrames = Math.round(durationSec * captureFps);

    const root = process.cwd();
    const publicDir = path.join(root, "public");
    const rendersDir = path.join(publicDir, "renders");
    await fs.mkdir(rendersDir, { recursive: true });

    const uuid = crypto.randomUUID();
    const tempHtmlName = `temp-${uuid}.html`;
    tempHtmlPath = path.join(rendersDir, tempHtmlName);
    const outputMp4Name = `${uuid}.mp4`;
    const outputMp4Path = path.join(rendersDir, outputMp4Name);

    // Save temporary HTML with universal studio bridge & motion springs for Chrome to render
    const fullHtml = injectStudioBridge(html, durationSec);
    await fs.writeFile(tempHtmlPath, fullHtml, "utf-8");

    // Launch Google Chrome headless
    const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-gpu-sandbox",
        "--hide-scrollbars",
      ],
    });

    const page = await browser.newPage();
    // Native 1080x1920 vertical canvas
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

    const localUrl = `http://localhost:3005/renders/${tempHtmlName}`;
    await page.goto(localUrl, { waitUntil: "networkidle0", timeout: 30000 });
    await page.evaluate(() => (document.fonts ? document.fonts.ready : true)).catch(() => {});

    // Locate FFmpeg binary
    let ffmpegPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg");
    if (!fsSync.existsSync(ffmpegPath)) {
      try {
        ffmpegPath = require("ffmpeg-static");
      } catch (e) {}
    }
    if (!ffmpegPath) {
      throw new Error("تعذر العثور على محرك FFmpeg في النظام");
    }

    // Check if audio track is provided
    let audioFilePath: string | null = null;
    if (audioUrl && typeof audioUrl === "string") {
      let cleanUrl = audioUrl.trim();
      if (cleanUrl.startsWith("/")) cleanUrl = cleanUrl.substring(1);
      const candidatePath = path.join(publicDir, cleanUrl);
      if (fsSync.existsSync(candidatePath)) {
        audioFilePath = candidatePath;
        console.log(`[v3/render] Audio track attached: ${audioFilePath}`);
      } else {
        console.warn(`[v3/render] Audio file not found at: ${candidatePath}`);
      }
    }

    // Build FFmpeg pipeline with optional subframe motion blur filter
    const vf = sub > 1
      ? `tmix=frames=${sub},select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/${renderFps}/TB`
      : "";

    const ffmpegArgs = [
      "-y",
      "-f", "image2pipe",
      "-vcodec", "mjpeg",
      "-r", String(captureFps),
      "-i", "-",
    ];

    if (audioFilePath) {
      ffmpegArgs.push("-i", audioFilePath);
    }

    if (vf) {
      ffmpegArgs.push("-vf", vf);
    }

    if (audioFilePath) {
      ffmpegArgs.push(
        "-c:v", "libx264",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-preset", "faster",
        "-crf", "18",
        "-r", String(renderFps),
        "-t", String(durationSec),
        outputMp4Path
      );
    } else {
      ffmpegArgs.push(
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "faster",
        "-crf", "18",
        "-r", String(renderFps),
        "-t", String(durationSec),
        outputMp4Path
      );
    }

    // Spawn FFmpeg to encode image pipe (and optional audio) into pristine H.264 MP4
    const ffmpeg = spawn(ffmpegPath, ffmpegArgs);

    let ffmpegError = "";
    ffmpeg.stderr.on("data", (data) => {
      ffmpegError += data.toString();
    });

    console.log(
      `[v3/render] Starting real headless render: ${totalFrames} frames (${renderFps} FPS, subframes: ${sub}, blur: ${motionBlur})...`
    );

    // Deterministic Frame-by-Frame Rendering
    for (let f = 0; f < totalFrames; f++) {
      const time = f / captureFps;

      await page.evaluate((t: number) => {
        if (typeof (window as any).renderAtTime === "function") {
          (window as any).renderAtTime(t);
        }
      }, time);

      // Short wait for repaint
      await new Promise((r) => setTimeout(r, 4));

      const screenshotBuf = await page.screenshot({
        type: "jpeg",
        quality: 92,
      });

      const writeSuccess = ffmpeg.stdin.write(screenshotBuf);
      if (!writeSuccess) {
        await new Promise((resolve) => ffmpeg.stdin.once("drain", resolve));
      }
    }

    ffmpeg.stdin.end();

    await new Promise((resolve, reject) => {
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve(code);
        else {
          console.error("[v3/render] FFmpeg error output:", ffmpegError);
          reject(new Error(`فشل تشفير الفيديو عبر FFmpeg (كود: ${code})`));
        }
      });
      ffmpeg.on("error", reject);
    });

    await browser.close();
    browser = null;

    // Clean up temporary HTML
    await fs.unlink(tempHtmlPath).catch(() => {});

    console.log(`[v3/render] Video rendered successfully: ${outputMp4Path}`);

    const safeTitle = (title || "motion-film").replace(/[\/\\?%*:|"<>]/g, "-");

    if (projectId) {
      try {
        await updateProjectRenderUrl(projectId, "/renders/" + outputMp4Name);
      } catch (err) {
        console.error("[v3/render] Failed to update project render URL:", err);
      }
    }

    return NextResponse.json({
      success: true,
      downloadUrl: `/renders/${outputMp4Name}`,
      filename: `${safeTitle}.mp4`,
      durationSeconds: durationSec,
      fps: renderFps,
      hasAudio: !!audioFilePath,
    });
  } catch (error: any) {
    console.error("[v3/render] Fatal error during video rendering:", error);

    if (browser) {
      await browser.close().catch(() => {});
    }
    if (tempHtmlPath) {
      await fs.unlink(tempHtmlPath).catch(() => {});
    }

    return NextResponse.json(
      {
        error: error?.message || "حدث خطأ غير متوقع أثناء معالجة وريندر الفيديو",
      },
      { status: 500 }
    );
  }
}
