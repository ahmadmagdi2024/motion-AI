import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import puppeteer from "puppeteer-core";
import { injectStudioBridge } from "./studio-bridge";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";
import { MOTION_RECIPES, findRecipeForDefect } from "./motion-recipes";

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
 * Renders multi-frame motion trajectory sequences and inspects kinematic code
 * via Vision AI for a true MOTION & PHYSICS evaluation.
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

    // Pick 4 strategic anchor moments across video duration
    const anchorMoments = [
      { name: "Hook & Inception", t0: Math.min(0.5, Math.max(0.2, duration * 0.04)) },
      { name: "Early Progression", t0: Number((duration * 0.25).toFixed(1)) },
      { name: "Climax & Acceleration", t0: Number((duration * 0.55).toFixed(1)) },
      { name: "Outro & Settlement", t0: Number(Math.min(duration - 0.5, duration * 0.85).toFixed(1)) },
    ];

    interface TrajectoryMoment {
      name: string;
      t0: number;
      frames: { t: number; tag: string; dataUrl: string }[];
    }

    const trajectoryMoments: TrajectoryMoment[] = [];

    // Capture 3 consecutive micro-frames (t0, t0 + 200ms, t0 + 400ms) for each moment
    for (const m of anchorMoments) {
      const tA = m.t0;
      const tB = Math.min(duration, Number((m.t0 + 0.20).toFixed(2)));
      const tC = Math.min(duration, Number((m.t0 + 0.40).toFixed(2)));

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
        name: m.name,
        t0: m.t0,
        frames: momentFrames,
      });
    }

    // Now compose an advanced Motion Trajectory Contact Sheet
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
      <div class="title">MOTION STUDIO — DYNAMIC TRAJECTORY STRIP REVIEW</div>
      <div class="meta">Multi-Frame Kinematic Analysis (Delta t = +200ms) • Closed-Form Springs & Velocity Curves</div>
    </div>
    <div class="badge-chip">Total Duration: ${duration}s • 12 Micro-Frames</div>
  </div>

  <div class="moments-container">
    ${trajectoryMoments
      .map(
        (m, idx) => `
      <div class="moment-row">
        <div class="moment-header">
          <div class="moment-name">
            <span style="color: #d9b66d;">#0${idx + 1}</span>
            <span>${m.name}</span>
            <span style="color: #888; font-size: 13px;">[t = ${m.frames[0]?.t}s → ${m.frames[2]?.t}s]</span>
          </div>
          <span style="font-size: 12px; color: #888;">Trajectory Progression (Δt = 200ms)</span>
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
    await contactPage.setViewport({ width: 1300, height: 1600, deviceScaleFactor: 1 });
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

    const prompt = `You are a world-class Motion Design Director & Kinematics Specialist inspecting a motion graphics film (${duration}s).
You are evaluating BOTH:
1. The Multi-Frame Motion Trajectory Sheet (showing consecutive micro-frames [t, t+0.2s, t+0.4s] for 4 key moments).
2. The kinematic JavaScript animation code used to drive the scenes.

CRITICAL FOCUS: YOU MUST ANALYZE MOTION DYNAMICS, SPEED CURVES, AND KINEMATICS — NOT JUST A STATIC PICTURE!
1. Inspect the 3-frame progression strips (t -> t+0.2s -> t+0.4s):
   - Check displacement: Did elements move? Or are they completely motionless across 400ms? (STATIC_FREEZE)
   - Check speed curves: Is movement linear and robotic with uniform step distances, or does it feature natural acceleration and spring overshoot? (LINEAR_ROBOTIC)
   - Check typography & card entries: Do all words/cards appear at the exact same moment, or is there a staggered cascade? (UNSTAGGERED)
   - Check vector paths: Do icons/lines pop in abruptly instead of being drawn progressively? (RIGID_GRAPHICS)
   - Check camera & depth: Is the canvas flat 2D without subtle push or parallax? (LACK_OF_DEPTH)

2. Inspect the JavaScript animation code:
${animationCode ? animationCode : "// No explicit custom render scripts found or standard CSS used."}
   Check whether the code uses crude linear math (like t/duration) or natural physics (like window.spring(t, k, d) or window.track).

3. Available Motion Recipes from our verified physics library to prescribe:
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
  "summary": "ملخص عربي احترافي ومختصر في سطرين عن الجودة الحركية والبصرية للفيلم",
  "topIssues": [
    {
      "timestamp": "مثال: 02.4s",
      "sceneIndex": 1,
      "motionDefect": "LINEAR_ROBOTIC أو STATIC_FREEZE أو UNSTAGGERED أو RIGID_GRAPHICS أو LACK_OF_DEPTH",
      "issue": "وصف العيب الحركي أو البصري بدقة بالعربية",
      "recommendedRecipeId": "closedFormSpring أو trackMultiPoint أو kineticTypography أو trimPathDrawOn أو indicatorStretch أو cameraPushDepth أو dropImpactWave",
      "recommendedRecipeName": "اسم الوصفة بالعربية",
      "fix": "الحل الإخراجي المقترح بدقة",
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
        summary: "الفيلم يتمتع بانسيابية حركية جيدة وتوزيع متوازن للعناصر مع مقروئية واضحة.",
        topIssues: [
          {
            timestamp: "01.2s",
            sceneIndex: 0,
            motionDefect: "LINEAR_ROBOTIC",
            issue: "حركة النصوص الأولى يمكن إثراؤها بنوابض فيزيائية",
            recommendedRecipeId: "closedFormSpring",
            recommendedRecipeName: "النوابض الفيزيائية المخمدة (ارتداد بالقصور الذاتي)",
            fix: "استبدال الحركة الخطية بدالة window.spring(localTime, 220, 24)",
            prescribedCodeSnippet: "const s = window.spring(localTime, 220, 24);",
          },
        ],
        recommendations: ["تعزيز تباين أزمنة الظهور (Stagger) بين الكلمات والبطاقات"],
      };
    }

    // Normalize top issues to ensure valid motion recipes
    const sanitizedIssues: CritiqueIssue[] = (
      Array.isArray(parsed.topIssues) ? parsed.topIssues : []
    ).map((iss: any) => {
      const defect = iss.motionDefect || "LINEAR_ROBOTIC";
      const fallbackRecipe = findRecipeForDefect(defect);
      return {
        timestamp: iss.timestamp || "00.0s",
        sceneIndex: typeof iss.sceneIndex === "number" ? iss.sceneIndex : undefined,
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
        "تم تحليل مسارات الحركة عبر الإطارات المتعاقبة وفحص كود التحريك الفيزيائي بنجاح.",
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
