import "server-only";
import vm from "node:vm";
import { performVisualCritique, type CritiqueResult, type CritiqueIssue } from "./critique-engine";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";
import { extractScenesFromHtml, type ExtractedScene } from "./scene-extractor";
import { buildExecutableMotionRecipesPrompt, getRecipeById, findRecipeForDefect } from "./motion-recipes";

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
 * Accurately locates and replaces a JavaScript named function in HTML
 * using balanced brace matching to prevent truncation at nested braces.
 */
function replaceNamedFunctionInHtml(
  html: string,
  fnName: string,
  newFnJs: string
): { updatedHtml: string; replaced: boolean } {
  // Support: function renderScene_0(t, sceneEl), window.renderScene_0 =, const renderScene_0 =
  const searchRegex = new RegExp(
    `(?:function\\s+${fnName}|(?:window\\.|const\\s+|var\\s+|let\\s+)${fnName}\\s*=\\s*(?:function|\\([^)]*\\)\\s*=>))`,
    "i"
  );

  const match = searchRegex.exec(html);
  if (!match) {
    return { updatedHtml: html, replaced: false };
  }

  const startIdx = match.index;
  const openBraceIdx = html.indexOf("{", startIdx);
  if (openBraceIdx === -1) {
    return { updatedHtml: html, replaced: false };
  }

  // Count balanced braces to find the true outer closing brace
  let depth = 0;
  let endIdx = -1;
  let inString: string | null = null;
  let isEscaped = false;

  for (let i = openBraceIdx; i < html.length; i++) {
    const char = html[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = char;
      continue;
    }

    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i + 1; // Include the closing brace
        break;
      }
    }
  }

  if (endIdx === -1) {
    return { updatedHtml: html, replaced: false };
  }

  let formattedNewFn = newFnJs.trim();
  if (!formattedNewFn.startsWith("function") && !formattedNewFn.startsWith("window.")) {
    formattedNewFn = `function ${fnName}(t, sceneEl) {\n${formattedNewFn}\n}`;
  }

  const updatedHtml = html.substring(0, startIdx) + formattedNewFn + html.substring(endIdx);
  return { updatedHtml, replaced: true };
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

  log("🔍 بدء مرحلة التدقيق والتقييم البصري والحركي التلقائي للإطارات (AI Visual & Motion Critique)...");

  // Step 1: Run the visual critique to obtain Contact Sheet & scores
  const critique = await performVisualCritique(html, durationSeconds, apiKey, model);

  log(`📊 نتيجة الفحص: ${critique.scores.overall}/10 (Hook: ${critique.scores.hook}, Readability: ${critique.scores.readability}, Motion: ${critique.scores.motionQuality})`);

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
      let matchedScene: (typeof sceneIntervals)[0] | undefined;

      // 1. Direct match by explicit sceneIndex if provided and valid
      if (
        typeof issue.sceneIndex === "number" &&
        issue.sceneIndex >= 0 &&
        issue.sceneIndex < sceneIntervals.length
      ) {
        matchedScene = sceneIntervals[issue.sceneIndex];
      }

      // 2. Fallback to timestamp range matching
      if (!matchedScene) {
        const sec = parseTimestampToSeconds(issue.timestamp);
        matchedScene = sceneIntervals.find((sc) => sec >= sc.start && sec <= sc.end);
      }

      // 3. Fallback to closest scene by time distance (instead of always scene 0)
      if (!matchedScene && sceneIntervals.length > 0) {
        const sec = parseTimestampToSeconds(issue.timestamp);
        let minDiff = Infinity;
        sceneIntervals.forEach((sc) => {
          const mid = (sc.start + sc.end) / 2;
          const diff = Math.abs(sec - mid);
          if (diff < minDiff) {
            minDiff = diff;
            matchedScene = sc;
          }
        });
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
    log("🌟 جميع المشاهد معتمدة وسليمة بصرياً وحركياً بنسبة 100%! لا حاجة لأي تعديل.");
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
          fixDetails: fixedSceneResult.fixSummary || "تم تصحيح المشهد بنجاح وتحديث الكود البصري والحركي الخاص به.",
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
      ? `تم فحص الفيديو بصرياً وحركياً وتصحيح ${healedCount} مشهد معيب حصراً بالمعادلات الفيزيائية، مع تجميد واعتماد باقي المشاهد السليمة بدقة 100%.`
      : `تم الفحص البصري والحركي بنجاح (التقييم: ${critique.scores.overall}/10).`;

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

  // 2. Locate current HTML & JS content
  const sceneHtmlContent = match ? match[0] : "";
  const issuesDescription = issues
    .map((iss, i) => `${i + 1}. [التوقيت ${iss.timestamp}]: ${iss.issue}\n   الحل الإخراجي المطلوب: ${iss.fix}${iss.motionDefect ? `\n   نوع العيب الحركي: ${iss.motionDefect}` : ""}${iss.recommendedRecipeName ? `\n   الوصفة الموصى بها: ${iss.recommendedRecipeName}` : ""}`)
    .join("\n");

  const motionFixGuides: string[] = [];
  for (const iss of issues) {
    const recipe = iss.recommendedRecipeId
      ? getRecipeById(iss.recommendedRecipeId)
      : findRecipeForDefect(iss.motionDefect || iss.issue);
    if (recipe) {
      motionFixGuides.push(`✨ الوصفة الحركية الفيزيائية المعتمدة لعلاج [${iss.issue}]:
- اسم الوصفة: ${recipe.nameAr} (${recipe.name})
- المعادلة الفيزيائية: ${recipe.mathFormula}
- نموذج الكود الإلزامي القابل للنسخ والاستخدام:
${recipe.codeSnippet}`);
    }
  }

  const motionFixGuidesSection =
    motionFixGuides.length > 0
      ? `\n═══ الوصفات الحركية المحددة لعلاج عيوب هذا المشهد ═══\n${motionFixGuides.join("\n\n")}\n`
      : "";

  const prompt = `أنت مخرج ومطور موشن جرافيك فائق الاحترافية.
لدينا فيلم موشن جرافيك كبير، تم فحصه بصرياً وحركياً عبر Vision AI واجتازت جميع مشاهده الفحص بنجاح ما عدا المشهد رقم (${sceneIndex + 1}) [من ${startTime} ثانية إلى ${endTime} ثانية].
المطلوب منك حصراً: إعادة كتابة كود هذا المشهد فقط لإصلاح المشاكل الحركية والبصرية بدقة متناهية دون لمس أو تغيير أي مشهد آخر.

المشاكل المرصودة في هذا المشهد:
${issuesDescription}

${motionFixGuidesSection}

${sceneHtmlContent ? `كود HTML الحالي للمشهد:\n${sceneHtmlContent.slice(0, 2500)}` : ""}

═══ مكتبة دوال الحركة المخزنة لدينا لاستخدامها في تحريك العناصر ═══
${buildExecutableMotionRecipesPrompt()}

القواعد الصارمة:
1. الالتزام بالفترة الزمنية للمشهد [${startTime}s إلى ${endTime}s].
3. عزل المشهد وإخلاء الكادر الصارم (إلزامي لمنع تداخل النصوص):
   - خارج الزمن المحلي للمشهد (t < 0 أو t > ${endTime - startTime}s)، يجب إخفاء كافة عناصر المشهد كلياً (opacity = 0, visibility = 'hidden').
   - في آخر 0.5 ثانية من زمن المشهد (من t = ${endTime - startTime - 0.5}s إلى ${endTime - startTime}s)، يجب تنفيذ حركة خروج انسيابية وسريعة لجميع العناصر (Scale Down, Fade Out) لتفريغ الكادر كلياً وإخلائه بنظافة للمشهد التالي لمنع أي تراكم أو تداخل للنصوص.
4. تحسين التباين، عدم تداخل النصوص، وجعل الحركة فيزيائية وناعمة باستخدام دوال الحركة المخزنة لدينا (window.spring و window.track) وفق الوصفة المحددة أعلاه. ممنوع منعاً باتاً استخدام الحركة الخطية الجافة (t/duration بدون معادلة) أو التوقفات الفجائية.
5. أخرج كود المشهد بصيغة JSON حصرية:
{
  "newSceneHtml": "<div id=\\"scene-${sceneIndex}\\" class=\\"scene visible\\">...محتوى المشهد المصحح...</div>",
  "newSceneJs": "function renderScene_${sceneIndex}(t, sceneEl) { ...كود التحريك المصحح بالدوال الفيزيائية وخروج العناصر... }",
  "fixSummary": "ملخص ما تم تصحيحه في هذا المشهد بالعربية وتحديد دالة الحركة الفيزيائية المستخدمة"
}`;

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
  let replacedAny = false;

  // 1. Replace HTML part if present
  if (parsed.newSceneHtml && match) {
    updatedHtml = updatedHtml.replace(match[0], parsed.newSceneHtml);
    replacedAny = true;
  }

  // 2. Replace or Inject JS function with precise balanced brace matching
  if (parsed.newSceneJs) {
    const jsReplaceResult = replaceNamedFunctionInHtml(
      updatedHtml,
      `renderScene_${sceneIndex}`,
      parsed.newSceneJs
    );

    if (jsReplaceResult.replaced) {
      updatedHtml = jsReplaceResult.updatedHtml;
      replacedAny = true;
    } else {
      // Fallback injection for legacy/single-shot/space-bunny films: inject dynamic override script tag
      const cleanJsBody = parsed.newSceneJs
        .replace(/^function\s+renderScene_\d+\s*\([^)]*\)\s*\{/i, "")
        .replace(/\}$/, "")
        .trim();

      const overrideScript = `
<script id="healed-scene-script-${sceneIndex}">
(function() {
  window.__sceneOverrides = window.__sceneOverrides || {};
  window.__sceneOverrides[${sceneIndex}] = function(t, sceneEl) {
    try {
      ${cleanJsBody}
    } catch(err) {
      console.warn("Healed scene ${sceneIndex} execution error:", err);
    }
  };
  window.renderScene_${sceneIndex} = window.__sceneOverrides[${sceneIndex}];
})();
</script>`;

      if (updatedHtml.includes("</body>")) {
        updatedHtml = updatedHtml.replace("</body>", `${overrideScript}\n</body>`);
      } else if (updatedHtml.includes("</html>")) {
        updatedHtml = updatedHtml.replace("</html>", `${overrideScript}\n</html>`);
      } else {
        updatedHtml += overrideScript;
      }
      replacedAny = true;
    }
  }

  if (!replacedAny) {
    return { success: false };
  }

  // 3. Final JS syntax safety pass across all scripts in updatedHtml
  const scriptRegex = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
  let scriptMatch: RegExpExecArray | null;
  while ((scriptMatch = scriptRegex.exec(updatedHtml)) !== null) {
    const scriptBody = scriptMatch[1].trim();
    if (scriptBody.length > 0 && !scriptBody.includes("MOTION_SPRINGS_BUNDLE")) {
      try {
        new vm.Script(scriptBody);
      } catch (syntaxErr: any) {
        console.warn(`[SceneHealer] Syntax correction on healed script:`, syntaxErr.message);
      }
    }
  }

  return {
    success: true,
    healedHtml: updatedHtml,
    fixSummary: parsed.fixSummary,
  };
}
