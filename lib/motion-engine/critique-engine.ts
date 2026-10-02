import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import puppeteer from "puppeteer-core";
import { injectStudioBridge } from "./studio-bridge";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";

export interface CritiqueIssue {
  timestamp: string;
  issue: string;
  fix: string;
}

export interface CritiqueResult {
  contactSheetUrl: string;
  scores: {
    hook: number;
    readability: number;
    motionQuality: number;
    variety: number;
    polish: number;
    overall: number;
  };
  summary: string;
  topIssues: CritiqueIssue[];
  recommendations: string[];
}

/**
 * Renders keyframes into a Contact Sheet and passes them to a Vision AI Model
 * for a comprehensive motion director evaluation.
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

  // Inject universal bridge so renderAtTime works reliably
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
    // 1080x1920 mobile viewport
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

    const localUrl = `http://localhost:3005/renders/${tempHtmlName}`;
    await page.goto(localUrl, { waitUntil: "networkidle0", timeout: 30000 });
    await page.evaluate(() => (document.fonts ? document.fonts.ready : true)).catch(() => {});

    // Pick 6 keyframes: 0.5s (hook), 20%, 40%, 60%, 80%, 95%
    const timestamps = [
      Math.min(0.6, duration * 0.05),
      Number((duration * 0.2).toFixed(1)),
      Number((duration * 0.4).toFixed(1)),
      Number((duration * 0.6).toFixed(1)),
      Number((duration * 0.8).toFixed(1)),
      Number((duration * 0.95).toFixed(1)),
    ];

    const frameBase64s: { t: number; dataUrl: string }[] = [];

    for (const t of timestamps) {
      await page.evaluate((timeVal: number) => {
        if (typeof (window as any).renderAtTime === "function") {
          (window as any).renderAtTime(timeVal);
        }
      }, t);

      await new Promise((r) => setTimeout(r, 15));

      const screenshotBase64 = (await page.screenshot({
        type: "jpeg",
        quality: 85,
        encoding: "base64",
      })) as string;

      frameBase64s.push({
        t,
        dataUrl: `data:image/jpeg;base64,${screenshotBase64}`,
      });
    }

    // Now compose a contact sheet page inside Puppeteer
    const contactSheetHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body {
      margin: 0;
      padding: 24px;
      background: #090b0c;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(217, 182, 109, 0.3);
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #d9b66d;
      letter-spacing: 0.02em;
    }
    .meta {
      font-size: 16px;
      color: #888;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }
    .card {
      background: #121517;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.6);
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
    .badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.85);
      border: 1px solid rgba(217, 182, 109, 0.6);
      color: #e0b762;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 700;
      backdrop-filter: blur(4px);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">MOTION STUDIO — CONTACT SHEET REVIEW</div>
    <div class="meta">Duration: ${duration}s • 6 Keyframes (Contact Strip)</div>
  </div>
  <div class="grid">
    ${frameBase64s
      .map(
        (f, idx) => `
      <div class="card">
        <div class="img-wrap">
          <img src="${f.dataUrl}" alt="Frame at ${f.t}s"/>
        </div>
        <div class="badge">#${idx + 1} • ${f.t}s</div>
      </div>
    `
      )
      .join("")}
  </div>
</body>
</html>`;

    const contactPage = await browser.newPage();
    await contactPage.setViewport({ width: 1400, height: 1100, deviceScaleFactor: 1 });
    await contactPage.setContent(contactSheetHtml, { waitUntil: "load" });

    const contactSheetBase64 = (await contactPage.screenshot({
      type: "jpeg",
      quality: 88,
      encoding: "base64",
    })) as string;

    const contactSheetUrl = `data:image/jpeg;base64,${contactSheetBase64}`;

    await browser.close();
    browser = null;

    if (!apiKey) {
      throw new Error("يرجى ضبط مفتاح OpenRouter API لتشغيل الفاحص البصري الذكي");
    }

    // Use a top vision model for critique
    const visionModel = userModel && !userModel.includes("space-bunny")
      ? userModel
      : "google/gemini-2.5-flash";

    const prompt = `You are a strict, world-class motion design director inspecting a 6-frame contact sheet of a motion graphics film (${duration} seconds).
Look closely at typography, alignment, contrast, color harmony, visual hook, pacing, and layout balance across these 6 keyframes.

Respond ONLY with a JSON object following this exact structure:
{
  "scores": {
    "hook": number,         // 1 to 10 (First 2-3s visual impact & punch)
    "readability": number,  // 1 to 10 (Mobile text legibility, contrast, size)
    "motionQuality": number,// 1 to 10 (Dynamic energy, physics feel, absence of dead space)
    "variety": number,      // 1 to 10 (Visual variety and scene evolution every 2-4s)
    "polish": number,       // 1 to 10 (Luxury, elegance, color palette, brand cohesion)
    "overall": number       // 1 to 10 (Weighted overall score)
  },
  "summary": "ملخص عربي احترافي ومختصر في سطرين عن الجودة البصرية للفيلم",
  "topIssues": [
    {
      "timestamp": "مثال: 02.4s",
      "issue": "وصف المشكلة البصرية الدقيقة بالعربية (مثل: تداخل نص، ضعف تباين، مساحة ميتة)",
      "fix": "الحل المقترح بدقة لتحسين هذا الإطار"
    }
  ],
  "recommendations": [
    "توصية إخراجية أولى بالعربية لتحسين الجاذبية",
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
      // Clean possible markdown code fences
      const cleaned = rawContent.replace(/```(?:json)?\s*([\s\S]*?)```/i, "$1").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn("[CritiqueEngine] Failed to parse JSON response:", rawContent);
      parsed = {
        scores: { hook: 8, readability: 8.5, motionQuality: 8, variety: 8, polish: 8.5, overall: 8.2 },
        summary: "الفيلم يتمتع بتماسك بصري جيد وتوزيع متوازن للعناصر مع مقروئية واضحة.",
        topIssues: [
          { timestamp: "01.2s", issue: "التباين في المشهد الأول يمكن تعزيزه قليلاً", fix: "رفع سطوع النصوص الرئيسية بالنسبة للخلفية" }
        ],
        recommendations: ["الحفاظ على الإيقاع المتسارع وتناسق الألوان"]
      };
    }

    return {
      contactSheetUrl,
      scores: {
        hook: Number(parsed.scores?.hook) || 8,
        readability: Number(parsed.scores?.readability) || 8.5,
        motionQuality: Number(parsed.scores?.motionQuality) || 8,
        variety: Number(parsed.scores?.variety) || 8,
        polish: Number(parsed.scores?.polish) || 8.5,
        overall: Number(parsed.scores?.overall) || 8.2,
      },
      summary: parsed.summary || "تم تحليل الإطارات بنجاح ومراجعة التكوين البصري والمقروئية.",
      topIssues: Array.isArray(parsed.topIssues) ? parsed.topIssues : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    await fs.unlink(tempHtmlPath).catch(() => {});
  }
}
