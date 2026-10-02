import "server-only";
import { performVisualCritique, type CritiqueResult, type CritiqueIssue } from "./critique-engine";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";
import { extractScenesFromHtml, type ExtractedScene } from "./scene-extractor";

export interface SceneHealingReport {
  originalHtml: string;
  healedHtml: string;
  wasHealed: boolean;
  critique: CritiqueResult;
  sceneAudit: Array<{
    sceneIndex: number;
    title: string;
    startTime: number;
    endTime: number;
    status: "APPROVED_CLEAN" | "SURGICALLY_HEALED" | "HEAL_FAILED";
    issues: CritiqueIssue[];
    fixDetails?: string;
  }>;
  summaryMessage: string;
}

/**
 * Parses timestamp string (e.g. "02.4s", "2.4s", "2s", "0:02") into seconds.
 */
function parseTimestampToSeconds(ts: string): number {
  if (!ts) return 0;
  const cleaned = ts.trim().toLowerCase().replace("⏱️", "").replace("s", "").trim();
  if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  return parseFloat(cleaned) || 0;
}

/**
 * Autonomous Scene Healer
 * Performs visual review, isolates flawed scenes, asks the generator model
 * to rewrite ONLY the flawed scenes, and preserves all approved scenes with 100% integrity.
 */
export async function runAutoCritiqueAndHeal(
  html: string,
  durationSeconds: number,
  apiKey: string,
  model: string,
  onProgress?: (msg: string) => void
): Promise<SceneHealingReport> {
  const log = (msg: string) => {
    console.log(`[SceneHealer] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  log("🔍 بدء مرحلة التدقيق والتقييم البصري التلقائي للإطارات (AI Visual Critique)...");

  // Step 1: Run the visual critique to obtain Contact Sheet & scores
  const critique = await performVisualCritique(html, durationSeconds, apiKey, model);

  log(`📊 نتيجة الفحص البصري: ${critique.scores.overall}/10 (Hook: ${critique.scores.hook}, Readability: ${critique.scores.readability})`);

  // Step 2: Extract scenes from HTML
  const extractedScenes = extractScenesFromHtml(html, durationSeconds);
  const totalScenes = extractedScenes.length || Math.max(1, Math.round(durationSeconds / 8));

  // Determine timing boundaries for scenes
  const sceneIntervals: Array<{ index: number; start: number; end: number; title: string }> = [];
  if (extractedScenes.length > 0) {
    extractedScenes.forEach((s) => {
      sceneIntervals.push({
        index: s.sceneIndex,
        start: s.startTime,
        end: s.endTime,
        title: s.headline || s.kicker || `مشهد ${s.sceneIndex + 1}`,
      });
    });
  } else {
    // Fallback evenly distributed
    const segDur = durationSeconds / totalScenes;
    for (let i = 0; i < totalScenes; i++) {
      sceneIntervals.push({
        index: i,
        start: i * segDur,
        end: (i + 1) * segDur,
        title: `مشهد ${i + 1}`,
      });
    }
  }

  // Step 3: Map critique issues to individual scenes
  const sceneIssuesMap: Map<number, CritiqueIssue[]> = new Map();
  sceneIntervals.forEach((sc) => sceneIssuesMap.set(sc.index, []));

  if (Array.isArray(critique.topIssues)) {
    for (const issue of critique.topIssues) {
      const sec = parseTimestampToSeconds(issue.timestamp);
      // Find matching scene
      let matchedScene = sceneIntervals.find((sc) => sec >= sc.start && sec <= sc.end);
      if (!matchedScene && sceneIntervals.length > 0) {
        matchedScene = sceneIntervals[0];
      }
      if (matchedScene) {
        const list = sceneIssuesMap.get(matchedScene.index) || [];
        list.push(issue);
        sceneIssuesMap.set(matchedScene.index, list);
      }
    }
  }

  // Step 4: Check if any scenes require healing
  const flawedSceneIndices: number[] = [];
  sceneIntervals.forEach((sc) => {
    const issues = sceneIssuesMap.get(sc.index) || [];
    if (issues.length > 0) {
      flawedSceneIndices.push(sc.index);
    }
  });

  const sceneAudit: SceneHealingReport["sceneAudit"] = [];

  // If film scored exceptionally well and has no flawed scenes:
  if (critique.scores.overall >= 8.5 && flawedSceneIndices.length === 0) {
    log("🌟 جميع المشاهد معتمدة وسليمة بصرياً بنسبة 100%! لا حاجة لأي تعديل.");
    sceneIntervals.forEach((sc) => {
      sceneAudit.push({
        sceneIndex: sc.index,
        title: sc.title,
        startTime: sc.start,
        endTime: sc.end,
        status: "APPROVED_CLEAN",
        issues: [],
      });
    });

    return {
      originalHtml: html,
      healedHtml: html,
      wasHealed: false,
      critique,
      sceneAudit,
      summaryMessage: `تم اعتماد جميع المشاهد (${sceneIntervals.length} مشاهد) بنجاح فائق دون الحاجة لأي تعديل (التقييم: ${critique.scores.overall}/10).`,
    };
  }

  // If there are flawed scenes, heal ONLY those scenes
  log(`🎯 تم رصد ${flawedSceneIndices.length} مشهد بحاجة لتصحيح جراحي: [المشاهد: ${flawedSceneIndices.map((i) => i + 1).join(", ")}]. باقي المشاهد معتمدة وسليمة.`);

  let workingHtml = html;
  let healedCount = 0;

  for (const sc of sceneIntervals) {
    const issues = sceneIssuesMap.get(sc.index) || [];

    if (issues.length === 0) {
      // Scene is pristine - preserve 100%
      sceneAudit.push({
        sceneIndex: sc.index,
        title: sc.title,
        startTime: sc.start,
        endTime: sc.end,
        status: "APPROVED_CLEAN",
        issues: [],
      });
      log(`🛡️ المشهد ${sc.index + 1} (${sc.title}): معتمد وسليم 100% — تم تجميده دون أي مساس.`);
      continue;
    }

    // Flawed scene: surgically fix it
    log(`🛠️ جاري تصحيح المشهد ${sc.index + 1} (${sc.title}) حصراً لحل: ${issues.map((i) => i.issue).join(" | ")}...`);

    try {
      const fixedSceneResult = await healSingleScene({
        html: workingHtml,
        sceneIndex: sc.index,
        startTime: sc.start,
        endTime: sc.end,
        issues,
        apiKey,
        model,
      });

      if (fixedSceneResult.success && fixedSceneResult.healedHtml) {
        workingHtml = fixedSceneResult.healedHtml;
        healedCount++;

        sceneAudit.push({
          sceneIndex: sc.index,
          title: sc.title,
          startTime: sc.start,
          endTime: sc.end,
          status: "SURGICALLY_HEALED",
          issues,
          fixDetails: fixedSceneResult.fixSummary || "تم تصحيح المشهد بنجاح وتحديث الكود البصري الخاص به.",
        });
        log(`✅ تم تصحيح المشهد ${sc.index + 1} بنجاح ودمجه في الفيلم.`);
      } else {
        sceneAudit.push({
          sceneIndex: sc.index,
          title: sc.title,
          startTime: sc.start,
          endTime: sc.end,
          status: "HEAL_FAILED",
          issues,
          fixDetails: "تعذر تطبيق التصحيح الجراحي بدقة، تم الإبقاء على النسخة الأصلية للمشهد.",
        });
        log(`⚠️ تعذر تطبيق التصحيح الجراحي للمشهد ${sc.index + 1}. تم الإبقاء على الأصل.`);
      }
    } catch (healErr) {
      console.error(`[SceneHealer] Error healing scene ${sc.index}:`, healErr);
      sceneAudit.push({
        sceneIndex: sc.index,
        title: sc.title,
        startTime: sc.start,
        endTime: sc.end,
        status: "HEAL_FAILED",
        issues,
      });
    }
  }

  const summaryMessage =
    healedCount > 0
      ? `تم فحص الفيديو بصرياً وتصحيح ${healedCount} مشهد معيب حصراً بنجاح، مع تجميد واعتماد باقي المشاهد السليمة بدقة 100%.`
      : `تم الفحص البصري بنجاح (التقييم: ${critique.scores.overall}/10).`;

  return {
    originalHtml: html,
    healedHtml: workingHtml,
    wasHealed: healedCount > 0,
    critique,
    sceneAudit,
    summaryMessage,
  };
}

/**
 * Surgically heals a single flawed scene inside the master HTML
 */
async function healSingleScene(params: {
  html: string;
  sceneIndex: number;
  startTime: number;
  endTime: number;
  issues: CritiqueIssue[];
  apiKey: string;
  model: string;
}): Promise<{ success: boolean; healedHtml?: string; fixSummary?: string }> {
  const { html, sceneIndex, startTime, endTime, issues, apiKey, model } = params;

  // 1. Locate the scene DOM element in the HTML
  // Pattern A: id="scene-${sceneIndex}"
  // Pattern B: nth element with class="scene"
  const sceneIdRegex = new RegExp(
    `(<(?:div|section)[^>]*id=["']scene-${sceneIndex}["'][^>]*>)([\\s\\S]*?)(<\\/(?:div|section)>)`,
    "i"
  );
  let match = sceneIdRegex.exec(html);

  // Fallback to nth scene if id wasn't explicit
  if (!match) {
    const allScenesRegex =
      /<(?:div|section)[^>]*class=["'][^"']*\bscene\b[^"']*["'][^>]*>[\s\S]*?<\/(?:div|section)>/gi;
    let m: RegExpExecArray | null;
    let curIdx = 0;
    while ((m = allScenesRegex.exec(html)) !== null) {
      if (curIdx === sceneIndex) {
        match = [m[0], "", m[0], ""] as any;
        break;
      }
      curIdx++;
    }
  }

  // 2. Locate the scene's JS function or render logic
  const renderFnRegex = new RegExp(
    `(function\\s+renderScene_${sceneIndex}\\s*\\([^)]*\\)\\s*\\{)([\\s\\S]*?)(\\n\\s*\\})`,
    "i"
  );
  const fnMatch = renderFnRegex.exec(html);

  const sceneHtmlContent = match ? match[0] : "";
  const sceneJsContent = fnMatch ? fnMatch[0] : "";

  const issuesDescription = issues
    .map((iss, i) => `${i + 1}. [التوقيت ${iss.timestamp}]: ${iss.issue}\n   الحل الإخراجي المطلوب: ${iss.fix}`)
    .join("\n");

  const prompt = `أنت مخرج ومطور موشن جرافيك فائق الاحترافية.
لدينا فيلم موشن جرافيك كبير، تم فحصه بصرياً عبر Vision AI واجتازت جميع مشاهده الفحص بنجاح ما عدا المشهد رقم (${sceneIndex + 1}) [من ${startTime} ثانية إلى ${endTime} ثانية].
المطلوب منك حصراً: إعادة كتابة كود هذا المشهد فقط لإصلاح المشاكل البصرية بدقة متناهية دون لمس أو تغيير أي مشهد آخر.

المشاكل المرصودة في هذا المشهد:
${issuesDescription}

${sceneHtmlContent ? `كود HTML الحالي للمشهد:\n${sceneHtmlContent.slice(0, 2500)}` : ""}
${sceneJsContent ? `كود JS/التحريك الحالي للمشهد:\n${sceneJsContent.slice(0, 2500)}` : ""}

القواعد الصارمة:
1. الالتزام بالفترة الزمنية للمشهد [${startTime}s إلى ${endTime}s].
2. تحسين التباين، عدم تداخل النصوص، جعل الحركة فيزيائية وناعمة (Closed-form Springs عبر spring(t, k, d)).
3. أعد فقط كود المشهد المستبدل:
إذا كان المشهد يستخدم نظام renderScene_${sceneIndex}:
أخرج كود المشهد بصيغة JSON:
{
  "newSceneHtml": "<div id=\\"scene-${sceneIndex}\\" class=\\"scene visible\\">...محتوى المشهد المصحح...</div>",
  "newSceneJs": "function renderScene_${sceneIndex}(t, sceneEl) { ...كود التحريك المصحح... }",
  "fixSummary": "ملخص ما تم تصحيحه في هذا المشهد بالعربية"
}
إذا كان المشهد بدون renderScene منفصل، ضع كود التحديث المناسب.`;

  const response = await sendOpenRouterRequest(apiKey, {
    model: model && !model.includes("space-bunny") ? model : "google/gemini-2.5-flash",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices?.[0]?.message?.content || "{}";
  let parsed: any = {};
  try {
    const cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)```/i, "$1").trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.warn("[SceneHealer] Failed to parse JSON healing response:", raw);
    return { success: false };
  }

  let updatedHtml = html;
  let replaced = false;

  // Replace HTML part if present
  if (parsed.newSceneHtml && match) {
    updatedHtml = updatedHtml.replace(match[0], parsed.newSceneHtml);
    replaced = true;
  }

  // Replace JS function if present
  if (parsed.newSceneJs && fnMatch) {
    updatedHtml = updatedHtml.replace(fnMatch[0], parsed.newSceneJs);
    replaced = true;
  }

  if (!replaced) {
    return { success: false };
  }

  return {
    success: true,
    healedHtml: updatedHtml,
    fixSummary: parsed.fixSummary,
  };
}
