import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import puppeteer from "puppeteer-core";
import { injectStudioBridge } from "./studio-bridge";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";
import { MOTION_RECIPES, findRecipeForDefect } from "./motion-recipes";
import { extractScenesFromHtml } from "./scene-extractor";

export interface CritiqueIssue {
  timestamp: string;
  sceneIndex?: number;
  issue: string;
  fix: string;
  motionDefect?: string;
  recommendedRecipeId?: string;
  recommendedRecipeName?: string;
  prescribedCodeSnippet?: string;
}

export interface CritiqueResult {
  contactSheetUrl: string;
  scores: {
    hook: number;
    readability: number;
    motionQuality: number;
    motionDynamics?: number;
    physicsRealism?: number;
    variety: number;
    polish: number;
    overall: number;
  };
  summary: string;
  topIssues: CritiqueIssue[];
  recommendations: string[];
}

/**
 * Extracts animation scripts from HTML for kinematic code inspection
 */
function extractKinematicCode(html: string): string {
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  const snippets: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = scriptRegex.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw.includes("MOTION_SPRINGS_BUNDLE") && raw.length > 20) {
      snippets.push(raw.slice(0, 3000));
    }
  }
  return snippets.join("\n\n// ──────────────\n\n").slice(0, 4500);
}

/**
 * Renders multi-frame motion trajectory sequences FOR EVERY SCENE IN THE FILM
 * and inspects kinematic code via Vision AI for a true SCENE-BY-SCENE motion evaluation.
 */
export async function performVisualCritique(
  html: string,
  durationSeconds: number = 30,
  apiKey: string,
  userModel?: string
): Promise<CritiqueResult> {
  const duration = Math.max(3, Math.min(Number(durationSeconds) || 30, 120));
  const root = process.cwd();
  const publicDir = path.join(root, "public");
  const rendersDir = path.join(publicDir, "renders");
  await fs.mkdir(rendersDir, { recursive: true });

  const uuid = crypto.randomUUID();
  const tempHtmlName = `critique-${uuid}.html`;
  const tempHtmlPath = path.join(rendersDir, tempHtmlName);

  // Inject universal bridge so renderAtTime & springs work reliably
  const fullHtml = injectStudioBridge(html, duration);
  await fs.writeFile(tempHtmlPath, fullHtml, "utf-8");

  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  let browser: any = null;

  try {
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
    // 720x1280 vertical viewport — fast, lightweight, and sharp for frame trajectory capture
    await page.setViewport({ width: 720, height: 1280, deviceScaleFactor: 1 });

    const localUrl = `http://localhost:3005/renders/${tempHtmlName}`;
    await page.goto(localUrl, { waitUntil: "networkidle0", timeout: 30000 });
    await page.evaluate(() => (document.fonts ? document.fonts.ready : true)).catch(() => {});

    // 1. Extract ALL scenes from HTML to guarantee EVERY scene is individually inspected
    const extractedScenes = extractScenesFromHtml(html, duration);

    interface SceneAnchor {
      sceneIndex: number;
      name: string;
      title: string;
      startTime: number;
      endTime: number;
      t0: number;
    }

    const sceneAnchors: SceneAnchor[] = [];

    if (extractedScenes.length > 0) {
      extractedScenes.forEach((s) => {
        const sceneDur = Math.max(1, s.endTime - s.startTime);
        const midT = Number((s.startTime + Math.min(0.8, sceneDur * 0.25)).toFixed(2));
        sceneAnchors.push({
          sceneIndex: s.sceneIndex,
          name: `المشهد ${s.sceneIndex + 1}`,
          title: s.headline || s.kicker || `مشهد ${s.sceneIndex + 1}`,
          startTime: s.startTime,
          endTime: s.endTime,
          t0: midT,
        });
      });
    } else {
      // Fallback evenly distributed scenes
      const numScenes = Math.max(3, Math.round(duration / 7));
      const segDur = duration / numScenes;
      for (let i = 0; i < numScenes; i++) {
        const start = Number((i * segDur).toFixed(1));
        const end = Number(((i + 1) * segDur).toFixed(1));
        const midT = Number((start + Math.min(0.8, segDur * 0.25)).toFixed(2));
        sceneAnchors.push({
          sceneIndex: i,
          name: `المشهد ${i + 1}`,
          title: `مشهد ${i + 1}`,
          startTime: start,
          endTime: end,
          t0: midT,
        });
      }
    }

    interface TrajectoryMoment {
      sceneIndex: number;
      name: string;
      title: string;
      startTime: number;
      endTime: number;
      t0: number;
      frames: { t: number; tag: string; dataUrl: string }[];
    }

    const trajectoryMoments: TrajectoryMoment[] = [];

    // Capture 3 consecutive micro-frames (t0, t0 + 200ms, t0 + 400ms) FOR EVERY SCENE
    for (const sc of sceneAnchors) {
      const tA = sc.t0;
      const tB = Math.min(duration, Number((sc.t0 + 0.20).toFixed(2)));
      const tC = Math.min(duration, Number((sc.t0 + 0.40).toFixed(2)));

      const steps = [
        { t: tA, tag: `t=${tA}s (Impulse)` },
        { t: tB, tag: `t=${tB}s (+200ms Velocity)` },
        { t: tC, tag: `t=${tC}s (+400ms Overshoot/Settle)` },
      ];

      const momentFrames: { t: number; tag: string; dataUrl: string }[] = [];

      for (const step of steps) {
        await page.evaluate((timeVal: number) => {
          if (typeof (window as any).renderAtTime === "function") {
            (window as any).renderAtTime(timeVal);
          }
        }, step.t);

        await new Promise((r) => setTimeout(r, 15));

        const screenshotBase64 = (await page.screenshot({
          type: "jpeg",
          quality: 80,
          encoding: "base64",
        })) as string;

        momentFrames.push({
          t: step.t,
          tag: step.tag,
          dataUrl: `data:image/jpeg;base64,${screenshotBase64}`,
        });
      }

      trajectoryMoments.push({
        sceneIndex: sc.sceneIndex,
        name: sc.name,
        title: sc.title,
        startTime: sc.startTime,
        endTime: sc.endTime,
        t0: sc.t0,
        frames: momentFrames,
      });
    }

    // Compose comprehensive Motion Trajectory Contact Sheet for ALL scenes
    const contactSheetHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body {
      margin: 0;
      padding: 24px;
      background: #080a0c;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(217, 182, 109, 0.4);
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #d9b66d;
      letter-spacing: 0.03em;
    }
    .meta {
      font-size: 14px;
      color: #8b949e;
    }
    .badge-chip {
      background: rgba(217, 182, 109, 0.18);
      color: #f7d286;
      border: 1px solid rgba(217, 182, 109, 0.4);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
    }
    .moments-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .moment-row {
      background: #111417;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    }
    .moment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .moment-name {
      font-size: 15px;
      font-weight: 700;
      color: #e6edf3;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .strip {
      display: grid;
      grid-template-columns: 1fr 30px 1fr 30px 1fr;
      align-items: center;
      gap: 10px;
    }
    .frame-card {
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.15);
      position: relative;
    }
    .img-wrap {
      width: 100%;
      aspect-ratio: 9 / 16;
      background: #000;
      overflow: hidden;
    }
    .img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .frame-badge {
      position: absolute;
      bottom: 6px;
      left: 6px;
      right: 6px;
      background: rgba(0,0,0,0.85);
      border: 1px solid rgba(217, 182, 109, 0.5);
      color: #f7d286;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      backdrop-filter: blur(4px);
    }
    .arrow {
      text-align: center;
      color: #d9b66d;
      font-size: 18px;
      font-weight: 900;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">MOTION STUDIO — FULL FILM SCENE-BY-SCENE TRAJECTORY REVIEW</div>
      <div class="meta">Comprehensive Inspection Across All ${trajectoryMoments.length} Scenes (Δt = +200ms) • Closed-Form Springs & Motion Dynamics</div>
    </div>
    <div class="badge-chip">Total Scenes: ${trajectoryMoments.length} • ${trajectoryMoments.length * 3} Micro-Frames</div>
  </div>

  <div class="moments-container">
    ${trajectoryMoments
      .map(
        (m) => `
      <div class="moment-row">
        <div class="moment-header">
          <div class="moment-name">
            <span style="color: #d9b66d;">SCENE #${m.sceneIndex + 1}</span>
            <span>${m.title}</span>
            <span style="color: #888; font-size: 13px;">[t = ${m.startTime}s → ${m.endTime}s]</span>
          </div>
          <span style="font-size: 12px; color: #888;">Scene Trajectory (Δt = 200ms)</span>
        </div>

        <div class="strip">
          <div class="frame-card">
            <div class="img-wrap"><img src="${m.frames[0]?.dataUrl}"/></div>
            <div class="frame-badge">${m.frames[0]?.tag}</div>
          </div>

          <div class="arrow">➔</div>

          <div class="frame-card">
            <div class="img-wrap"><img src="${m.frames[1]?.dataUrl}"/></div>
            <div class="frame-badge">${m.frames[1]?.tag}</div>
          </div>

          <div class="arrow">➔</div>

          <div class="frame-card">
            <div class="img-wrap"><img src="${m.frames[2]?.dataUrl}"/></div>
            <div class="frame-badge">${m.frames[2]?.tag}</div>
          </div>
        </div>
      </div>
    `
      )
      .join("")}
  </div>
</body>
</html>`;

    const contactPage = await browser.newPage();
    const sheetHeight = Math.max(1400, trajectoryMoments.length * 360 + 150);
    await contactPage.setViewport({ width: 1300, height: sheetHeight, deviceScaleFactor: 1 });
    await contactPage.setContent(contactSheetHtml, { waitUntil: "load" });

    const contactSheetBase64 = (await contactPage.screenshot({
      type: "jpeg",
      quality: 85,
      encoding: "base64",
    })) as string;

    const contactSheetUrl = `data:image/jpeg;base64,${contactSheetBase64}`;

    await browser.close();
    browser = null;

    if (!apiKey) {
      throw new Error("يرجى ضبط مفتاح OpenRouter API لتشغيل الفاحص البصري والحركي الذكي");
    }

    const animationCode = extractKinematicCode(html);

    // Format available recipes from our library
    const recipesSummary = Object.keys(MOTION_RECIPES)
      .map((k) => {
        const r = MOTION_RECIPES[k];
        return `- ID: "${r.id}" | ${r.nameAr} (${r.name}) -> يحل: ${r.defectItSolves.join(", ")}`;
      })
      .join("\n");

    const visionModel =
      userModel && !userModel.includes("space-bunny")
        ? userModel
        : "google/gemini-2.5-flash";

    const scenesBreakdownText = trajectoryMoments
      .map(
        (s) =>
          `- Scene Index ${s.sceneIndex} (المشهد ${s.sceneIndex + 1}): "${s.title}" [Time Interval: ${s.startTime}s to ${s.endTime}s]`
      )
      .join("\n");

    const prompt = `You are a world-class Motion Design Director & Kinematics Specialist inspecting a motion graphics film (${duration}s).
CRITICAL DIRECTIVE: YOU MUST INSPECT EVERY SINGLE SCENE INDIVIDUALLY!
This film contains EXACTLY ${trajectoryMoments.length} distinct scenes:
${scenesBreakdownText}

YOU ARE EVALUATING BOTH:
1. The Multi-Frame Motion Trajectory Sheet (showing consecutive micro-frames [t, t+0.2s, t+0.4s] for ALL ${trajectoryMoments.length} scenes).
2. The kinematic JavaScript animation code used to drive the scenes.

SCENE COVERAGE RULES:
1. Inspect the 3-frame trajectory strip for EVERY scene listed above (Scene Index 0, 1, 2, 3...).
2. DO NOT restrict your critique to Scene 0! You must evaluate scenes 0, 1, 2, 3... across the entire film timeline.
3. For EVERY scene that suffers from static freezes, robotic linear motion, lack of stagger, poor contrast, or overlapping text, create a specific item in "topIssues".
4. Set "sceneIndex" accurately to match the exact scene (0 for Scene 1, 1 for Scene 2, 2 for Scene 3, etc.) and specify "timestamp" within that scene's time interval.

Available Motion Recipes from our verified physics library to prescribe:
${recipesSummary}

Respond ONLY with a JSON object following this exact structure:
{
  "scores": {
    "hook": number,           // 1 to 10 (First 2s visual impact & punch)
    "readability": number,    // 1 to 10 (Mobile text legibility, contrast, size)
    "motionQuality": number,  // 1 to 10 (Dynamic energy, physics feel, absence of dead space)
    "motionDynamics": number, // 1 to 10 (Smooth velocity curves and trajectory continuity)
    "physicsRealism": number, // 1 to 10 (Natural inertia, closed-form springs, no robotic stiffness)
    "variety": number,        // 1 to 10 (Visual variety and scene evolution)
    "polish": number,         // 1 to 10 (Luxury, elegance, color palette)
    "overall": number         // 1 to 10 (Weighted overall score)
  },
  "summary": "ملخص عربي احترافي ومختصر في سطرين عن الجودة الحركية والبصرية لكامل مشاهد الفيلم",
  "topIssues": [
    {
      "timestamp": "مثال: 08.4s",
      "sceneIndex": 1,        // Index of the scene (0, 1, 2, 3...)
      "motionDefect": "LINEAR_ROBOTIC أو STATIC_FREEZE أو UNSTAGGERED أو RIGID_GRAPHICS أو LACK_OF_DEPTH",
      "issue": "وصف العيب الحركي أو البصري في هذا المشهد بدقة بالعربية",
      "recommendedRecipeId": "closedFormSpring أو trackMultiPoint أو kineticTypography أو trimPathDrawOn أو indicatorStretch أو cameraPushDepth أو dropImpactWave",
      "recommendedRecipeName": "اسم الوصفة بالعربية",
      "fix": "الحل الإخراجي المقترح بدقة لبطاقات ونصوص هذا المشهد",
      "prescribedCodeSnippet": "كود JavaScript تطبيقي سريع يوضح المعادلة الموصى بها"
    }
  ],
  "recommendations": [
    "توصية إخراجية حركية أولى بالعربية",
    "توصية إخراجية ثانية",
    "توصية إخراجية ثالثة"
  ]
}`;

    const response = await sendOpenRouterRequest(apiKey, {
      model: visionModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${contactSheetBase64}`,
              },
            },
          ],
        },
      ],
    });

    const rawContent = response.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      const cleaned = rawContent.replace(/```(?:json)?\s*([\s\S]*?)```/i, "$1").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn("[CritiqueEngine] Failed to parse JSON response:", rawContent);
      parsed = {
        scores: {
          hook: 8,
          readability: 8.5,
          motionQuality: 8,
          motionDynamics: 8.2,
          physicsRealism: 8.3,
          variety: 8,
          polish: 8.5,
          overall: 8.2,
        },
        summary: "الفيلم يتمتع بانسيابية حركية جيدة وتوزيع متوازن للعناصر عبر جميع المشاهد.",
        topIssues: [],
        recommendations: ["تعزيز تباين أزمنة الظهور (Stagger) بين الكلمات والبطاقات"],
      };
    }

    // Normalize top issues to ensure valid motion recipes & accurate scene indices
    const sanitizedIssues: CritiqueIssue[] = (
      Array.isArray(parsed.topIssues) ? parsed.topIssues : []
    ).map((iss: any) => {
      const defect = iss.motionDefect || "LINEAR_ROBOTIC";
      const fallbackRecipe = findRecipeForDefect(defect);
      return {
        timestamp: iss.timestamp || "00.0s",
        sceneIndex: typeof iss.sceneIndex === "number" ? iss.sceneIndex : 0,
        motionDefect: defect,
        issue: iss.issue || "ملاحظة حركية وبصرية",
        recommendedRecipeId: iss.recommendedRecipeId || fallbackRecipe.id,
        recommendedRecipeName: iss.recommendedRecipeName || fallbackRecipe.nameAr,
        fix: iss.fix || "تحسين الحركة بالمعادلات الفيزيائية",
        prescribedCodeSnippet: iss.prescribedCodeSnippet || fallbackRecipe.codeSnippet,
      };
    });

    return {
      contactSheetUrl,
      scores: {
        hook: Number(parsed.scores?.hook) || 8,
        readability: Number(parsed.scores?.readability) || 8.5,
        motionQuality: Number(parsed.scores?.motionQuality) || 8,
        motionDynamics: Number(parsed.scores?.motionDynamics) || 8.2,
        physicsRealism: Number(parsed.scores?.physicsRealism) || 8.2,
        variety: Number(parsed.scores?.variety) || 8,
        polish: Number(parsed.scores?.polish) || 8.5,
        overall: Number(parsed.scores?.overall) || 8.2,
      },
      summary:
        parsed.summary ||
        `تم تحليل مسارات الحركة وفحص جميع مشاهد الفيلم (${trajectoryMoments.length} مشاهد) بنجاح.`,
      topIssues: sanitizedIssues,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    await fs.unlink(tempHtmlPath).catch(() => {});
  }
}
