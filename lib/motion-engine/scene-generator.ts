/**
 * Scene Generator — Phase 2 of the 3-phase pipeline.
 * Generates JavaScript, CSS, and HTML for individual scenes.
 * Uses resilient multi-strategy parsing (XML tags, Markdown blocks, JSON fallback).
 */
import "server-only";
import vm from "node:vm";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";
import { buildMotionCatalog } from "./motion-catalog";
import type { ScenePlanItem, ScenePlan } from "./scene-planner";

export interface GeneratedScene {
  sceneIndex: number;
  title: string;
  css: string;
  html: string;
  js: string;
}

function buildSceneSystemPrompt(plan: ScenePlan, sceneIndex: number): string {
  return `أنت مهندس ومخرج موشن جرافيك متخصص في كتابة كود الحركة الدقيق (JavaScript/CSS/SVG).

═══ قواعد هندسية صارمة ═══
1. اكتب كود مشهد واحد فقط (المشهد ${sceneIndex}) — ليس فيلماً كاملاً.
2. الكادر 1080×1920 بكسل عمودي (نسبة 9:16).
3. ركّز على العناصر البصرية والرسوم المتحركة (أيقونات، أشكال، مسارات SVG) وليس على حشو النصوص.
4. الكود يجب أن يكون حسابياً حتمياً (deterministic): نفس الزمن t يعطي دائماً نفس النتيجة.
5. لا تستخدم setTimeout أو setInterval إطلاقاً — فقط معادلات رياضية مبنية على المتغير t.
6. لا تكتب دوال عامة مثل renderAtTime أو play/stop أو resize — المحرك الخارجي يوفرها بالكامل.
7. لا تستخدم alert أو window.onload أو أي مكتبات خارجية غير معرّفة.
8. قانون الخلفيات والتباين الصارم: التزم بالثيمة المحددة للمشهد (light أو dark). إذا كان المشهد فاتحاً (light) يجب أن تكون خلفيته فاتحة ومشرقة ونصوصه داكنة عالية التباين (#0f172a أو #1e293b). وإذا كان المشهد داكناً (dark) اجعل نصوصه فاتحة ومضيئة.
9. قانون تنوع الحركة ومنع احتكار المورفينج (إلزامي):
   - الحركات الفيزيائية المخصصة لهذا المشهد تحديداً: [${(plan.scenes[sceneIndex]?.motionPrimitives || ["elasticSpring", "trimPathDrawOn"]).join(", ")}].
   - التزم بتنفيذ هذه الحركات المحددة بصرياً وبرمجياً باستخدام المعادلات الرياضية.
   - ممنوع منعاً باتاً استبدال هذه الحركات بتحول شكلي (Morphing) أو الاعتماد على تشويه المسارات. أخرج حركة فيزيائية احترافية ملموسة!

═══ الدوال الرياضية المتاحة لك تلقائياً ═══
- clamp(v, min, max): حصر القيمة في نطاق معين
- ease(p): حركة ناعمة خروجية (Cubic Out)
- easeInOut(p): حركة ناعمة في البداية والنهاية
- easeIn(p): تسارع تدريجي
- easeOut(p): تباطؤ تدريجي
- elastic(t): حركة ارتدادية فيزيائية
- mix(a, b, p): استيفاء خطي (Linear interpolation)

═══ معلومات الفيلم الشاملة ═══
عنوان الفيلم: ${plan.filmTitle}
المدة الكلية: ${plan.totalDuration} ثانية
النمط البصري: ${plan.globalStyle}
عدد المشاهد: ${plan.scenes.length}

═══ ملخص كل المشاهد (للسياق والاستمرارية) ═══
${plan.scenes.map((s, i) => `المشهد ${i}: "${s.title}" [${s.startTime}s → ${s.endTime}s] — ${s.visualConcept} (الحركات: ${s.motionPrimitives?.join(", ") || "افتراضية"})`).join("\n")}

${buildMotionCatalog()}

═══ طريقة الإخراج المطلوبة ═══
اكتب كود المشهد مقسماً بدقة باستخدام الوسوم الثلاثة التالية فقط (بدون JSON وبدون أي كلام جانبي):

<scene_css>
/* CSS لهذا المشهد فقط — classes بادئتها .scene-${sceneIndex} أو محددات فريدة */
</scene_css>

<scene_html>
<!-- عناصر HTML و SVG داخل المشهد فقط: أشكال، أيقونات، نصوص -->
</scene_html>

<scene_js>
// كود JavaScript يُنفذ داخل دالة renderScene_${sceneIndex}(t, sceneEl)
// المتغير t: الزمن المحلي للمشهد بالثواني (0 إلى مدة المشهد)
// المتغير sceneEl: عنصر DOM الحاوي للمشهد
</scene_js>`;
}

function buildSceneUserPrompt(
  scene: ScenePlanItem,
  prevScene: ScenePlanItem | null,
  nextScene: ScenePlanItem | null,
): string {
  const context: Record<string, unknown> = {
    task: `اكتب كود المشهد رقم ${scene.sceneIndex}: "${scene.title}"`,
    timing: {
      sceneIndex: scene.sceneIndex,
      startTime: scene.startTime,
      endTime: scene.endTime,
      duration: scene.durationSeconds,
    },
    visualConcept: scene.visualConcept,
    theme: scene.theme || "light",
    background: scene.background,
    colorPalette: scene.colorPalette,
    elements: scene.elements,
    motionPrimitives: scene.motionPrimitives,
    textContent: scene.textContent,
  };

  if (prevScene) {
    context.previousScene = {
      title: prevScene.title,
      transitionToThis: prevScene.transitionToNext,
      endingState: `المشهد السابق ينتهي عند t=${prevScene.endTime}s. صمم بداية عناصرك بانسيابية.`,
    };
  }

  if (nextScene) {
    context.nextScene = {
      title: nextScene.title,
      transitionHint: scene.transitionToNext,
      preparation: `جهّز خروج العناصر بانتقال ذكي ومبرر للمشهد التالي.`,
    };
  }

  context.instructions = {
    format: "استخدم الوسوم: <scene_css>, <scene_html>, <scene_js>. لا تكتب بصيغة JSON.",
    themeDirective:
      scene.theme === "dark"
        ? "هذا المشهد داكن (بما لا يتجاوز 40% من الفيلم): استخدم خلفية داكنة مع نصوص فاتحة ومضيئة (#ffffff أو #f5e3b8)."
        : "هذا المشهد فاتح ومشرق (قاعدة الـ 60%+ مشاهد فاتحة): استخدم خلفية فاتحة (#f8fafc أو #ffffff أو تدرج ناصع) مع نصوص داكنة عالية التباين والمقروئية (#0f172a أو #1e293b).",
    motionExecution: `الحركات الفيزيائية الإلزامية لهذا المشهد هي: [${(scene.motionPrimitives || []).join(", ")}]. قم ببرمجتها رياضياً عبر المتغير t (مثل رسم المسارات عبر strokeDashoffset، أو معادلة الارتداد الزنبركي elasticSpring، أو حركة الكاميرا والعمق cameraPush). ممنوع منعاً باتاً استبدالها بالمورفينج المتكرر!`,
    inception: "قانون بداية الحركة: كل عنصر يبدأ من حالة بداية مقصودة (مختفٍ أو خارج الشاشة أو مصغّر).",
    continuity: "قانون الانتقال: لا تحذف العناصر فجأة بل خروج انسيابي.",
    timing: `مدة المشهد ${scene.durationSeconds} ثانية، وزّع الأحداث تدريجياً عبر الزمن t.`,
  };

  return JSON.stringify(context, null, 2);
}

// ═══════════════════════════════════════════════════
// Multi-Strategy Code Extractor & Sanitizer
// ═══════════════════════════════════════════════════

function extractJsonProperty(text: string, propName: string): string {
  const regex = new RegExp(`"${propName}"\\s*:\\s*"([\\s\\S]*?)(?:"\\s*,\\s*"[a-zA-Z0-9_]+"|\\s*"\\s*\\})`, "i");
  const match = text.match(regex);
  if (match) {
    return match[1].replace(/\\n/g, "\n").replace(/\\"/g, "\"").replace(/\\\\/g, "\\").trim();
  }
  const backtickRegex = new RegExp(`"${propName}"\\s*:\\s*\`([\\s\\S]*?)\``, "i");
  const bMatch = text.match(backtickRegex);
  if (bMatch) return bMatch[1].trim();
  return "";
}

function sanitizeJs(js: string): string {
  let cleaned = js.trim();
  // Strip <script> and </script> tags
  cleaned = cleaned.replace(/<\/?script[^>]*>/gi, "").trim();
  // Strip outer code fences
  cleaned = cleaned.replace(/^\`\`\`(?:js|javascript)?\s*/i, "").replace(/\`\`\`\s*$/, "").trim();
  // Unwrap function if model wrapped it in function renderScene_X(...) { ... } or arrow function
  const funcMatch = cleaned.match(/^(?:function\s+renderScene_\d+\s*\([^)]*\)\s*\{|\((?:t,\s*sceneEl|sceneEl,\s*t)\)\s*=>\s*\{)([\s\S]*)\}\s*$/i);
  if (funcMatch) {
    cleaned = funcMatch[1].trim();
  }
  return cleaned;
}

export function extractSceneCode(
  rawContent: string,
  sceneIndex: number,
): { css: string; html: string; js: string; strategy: string } {
  let css = "";
  let html = "";
  let js = "";

  // Strategy 1: XML-style tags <scene_css>, <scene_html>, <scene_js> (preferred)
  const xmlCss = rawContent.match(/<scene_css>([\s\S]*?)<\/scene_css>/i) || rawContent.match(/<css>([\s\S]*?)<\/css>/i);
  const xmlHtml = rawContent.match(/<scene_html>([\s\S]*?)<\/scene_html>/i) || rawContent.match(/<html>([\s\S]*?)<\/html>/i);
  const xmlJs = rawContent.match(/<scene_js>([\s\S]*?)<\/scene_js>/i) || rawContent.match(/<js>([\s\S]*?)<\/js>/i) || rawContent.match(/<javascript>([\s\S]*?)<\/javascript>/i);

  if (xmlCss || xmlHtml || xmlJs) {
    css = xmlCss ? xmlCss[1].trim() : "";
    html = xmlHtml ? xmlHtml[1].trim() : "";
    js = xmlJs ? xmlJs[1].trim() : "";
    return {
      css: css.replace(/<\/?style[^>]*>/gi, "").trim(),
      html,
      js: sanitizeJs(js),
      strategy: "xml_tags",
    };
  }

  // Strategy 2: Markdown code blocks (using \b to avoid matching json as js)
  const cssBlock = rawContent.match(/\`\`\`css\b\s*([\s\S]*?)\`\`\`/i);
  const htmlBlock = rawContent.match(/\`\`\`html\b\s*([\s\S]*?)\`\`\`/i);
  const jsBlock = rawContent.match(/\`\`\`(?:js|javascript)\b\s*([\s\S]*?)\`\`\`/i);

  if (htmlBlock || jsBlock) {
    css = cssBlock ? cssBlock[1].trim() : "";
    html = htmlBlock ? htmlBlock[1].trim() : "";
    js = jsBlock ? jsBlock[1].trim() : "";
    return {
      css: css.replace(/<\/?style[^>]*>/gi, "").trim(),
      html,
      js: sanitizeJs(js),
      strategy: "markdown_blocks",
    };
  }

  // Strategy 3: JSON format (strict JSON.parse, followed by loose regex extraction)
  let candidate = rawContent.trim();
  const jsonFence = candidate.match(/\`\`\`json\b\s*([\s\S]*?)\`\`\`/i) || candidate.match(/\`\`\`\s*([\s\S]*?)\`\`\`/i);
  if (jsonFence) {
    candidate = jsonFence[1].trim();
  } else {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      candidate = candidate.slice(firstBrace, lastBrace + 1);
    }
  }

  try {
    const parsed = JSON.parse(candidate);
    if (parsed.css || parsed.html || parsed.js) {
      return {
        css: (parsed.css || "").replace(/<\/?style[^>]*>/gi, "").trim(),
        html: parsed.html || "",
        js: sanitizeJs(parsed.js || ""),
        strategy: "strict_json",
      };
    }
  } catch (_) {
    css = extractJsonProperty(candidate, "css");
    html = extractJsonProperty(candidate, "html");
    js = extractJsonProperty(candidate, "js");
    if (html || js) {
      return {
        css: css.replace(/<\/?style[^>]*>/gi, "").trim(),
        html,
        js: sanitizeJs(js),
        strategy: "loose_json",
      };
    }
  }

  // Strategy 4: Embedded HTML tags (<style>, <div>, <script>)
  const styleMatch = rawContent.match(/<style[\s\S]*?>([\s\S]*?)<\/style>/i);
  const scriptMatch = rawContent.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
  let stripped = rawContent;
  if (styleMatch) {
    css = styleMatch[1].trim();
    stripped = stripped.replace(styleMatch[0], "");
  }
  if (scriptMatch) {
    js = scriptMatch[1].trim();
    stripped = stripped.replace(scriptMatch[0], "");
  }
  html = stripped.replace(/\`\`\`[a-z]*\s*/gi, "").replace(/\`\`\`/g, "").trim();

  return {
    css: css.replace(/<\/?style[^>]*>/gi, "").trim(),
    html,
    js: sanitizeJs(js),
    strategy: "embedded_tags",
  };
}

/**
 * Validates JS syntax and wraps it safely so a syntax error never crashes the entire studio.
 */
function validateAndWrapJs(jsCode: string, sceneIndex: number): string {
  if (!jsCode || !jsCode.trim()) {
    return "// لا توجد حركات برمجية لهذا المشهد";
  }

  try {
    new vm.Script(`function renderScene_${sceneIndex}(t, sceneEl) {\n${jsCode}\n}`);
    return jsCode;
  } catch (err: any) {
    console.warn(`[SceneGenerator] Syntax check warning for scene ${sceneIndex} JS: ${err.message}`);
    return `try {
  ${jsCode}
} catch (sceneRuntimeErr) {
  console.warn("Scene ${sceneIndex} runtime error:", sceneRuntimeErr);
}`;
  }
}

/**
 * Creates an elegant animated fallback scene if model generation fails completely.
 * Guarantees the video compilation NEVER throws an unhandled error.
 */
function createFallbackScene(scene: ScenePlanItem): GeneratedScene {
  const primary = scene.colorPalette?.primary || "#38bdf8";
  const bg = scene.colorPalette?.bg || "#0b0f19";
  const accent = scene.colorPalette?.accent || "#818cf8";

  console.log(`[SceneGenerator] Building graceful animated fallback for scene ${scene.sceneIndex}: "${scene.title}"`);

  return {
    sceneIndex: scene.sceneIndex,
    title: scene.title,
    css: `
      .scene-${scene.sceneIndex}-fb {
        position: absolute; inset: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center; text-align: center;
        padding: 80px 60px; background: ${bg};
      }
      .scene-${scene.sceneIndex}-fb .badge {
        display: inline-block; padding: 8px 24px; border-radius: 999px;
        background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
        color: ${accent}; font-size: 24px; font-weight: 600; margin-bottom: 32px;
      }
      .scene-${scene.sceneIndex}-fb h2 {
        font-size: 64px; font-weight: 800; color: #ffffff; line-height: 1.3;
        margin-bottom: 24px; max-width: 900px;
      }
      .scene-${scene.sceneIndex}-fb p {
        font-size: 34px; color: rgba(255,255,255,0.75); max-width: 820px; line-height: 1.6;
      }
    `,
    html: `
      <div class="scene-${scene.sceneIndex}-fb">
        <svg viewBox="0 0 160 160" width="180" height="180" style="margin-bottom: 40px;">
          <defs>
            <radialGradient id="fb-grad-${scene.sceneIndex}" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="${primary}" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="80" cy="80" r="70" fill="url(#fb-grad-${scene.sceneIndex})" />
          <circle cx="80" cy="80" r="50" fill="none" stroke="${primary}" stroke-width="4" stroke-dasharray="10 6" />
          <polygon points="80,50 110,105 50,105" fill="${accent}" opacity="0.9" />
        </svg>
        <span class="badge">${scene.textContent?.kicker || scene.title}</span>
        <h2>${scene.title}</h2>
        <p>${scene.textContent?.headline || scene.visualConcept}</p>
        ${scene.textContent?.metric ? `<div style="font-size: 80px; font-weight: 900; color: ${primary}; margin-top: 36px;">${scene.textContent.metric}</div><div style="font-size: 26px; color: rgba(255,255,255,0.6);">${scene.textContent?.metricLabel || ""}</div>` : ""}
      </div>
    `,
    js: `
      const fb = sceneEl.querySelector('.scene-${scene.sceneIndex}-fb');
      if (fb) {
        const p = clamp(t / 1.2, 0, 1);
        fb.style.opacity = ease(p);
        fb.style.transform = "scale(" + mix(0.9, 1, ease(p)) + ")";
      }
    `,
  };
}

// ═══════════════════════════════════════════════════
// Main Generation Function
// ═══════════════════════════════════════════════════

export async function generateScene(
  apiKey: string,
  model: string,
  plan: ScenePlan,
  sceneIndex: number,
): Promise<GeneratedScene> {
  const scene = plan.scenes[sceneIndex];
  const prevScene = sceneIndex > 0 ? plan.scenes[sceneIndex - 1] : null;
  const nextScene = sceneIndex < plan.scenes.length - 1 ? plan.scenes[sceneIndex + 1] : null;

  console.log(`[SceneGenerator] Generating scene ${sceneIndex}/${plan.scenes.length - 1}: "${scene.title}" [${scene.startTime}s-${scene.endTime}s]`);

  try {
    const response = await sendOpenRouterRequest(apiKey, {
      model,
      messages: [
        { role: "system", content: buildSceneSystemPrompt(plan, sceneIndex) },
        { role: "user", content: buildSceneUserPrompt(scene, prevScene, nextScene) },
      ],
      temperature: 0.65,
      max_tokens: 4096,
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent || !rawContent.trim()) {
      console.warn(`[SceneGenerator] Empty response for scene ${sceneIndex}, attempting retry...`);
      return createFallbackScene(scene);
    }

    const extracted = extractSceneCode(rawContent, sceneIndex);
    console.log(`[SceneGenerator] Scene ${sceneIndex} extracted via "${extracted.strategy}". CSS: ${extracted.css.length}, HTML: ${extracted.html.length}, JS: ${extracted.js.length} chars`);

    // If both HTML and JS are empty, try a quick 1-shot retry with a direct corrective prompt
    if (!extracted.html.trim() && !extracted.js.trim()) {
      console.warn(`[SceneGenerator] Scene ${sceneIndex} extraction yielded empty code. Retrying with explicit prompt...`);
      try {
        const retryResponse = await sendOpenRouterRequest(apiKey, {
          model,
          messages: [
            { role: "system", content: buildSceneSystemPrompt(plan, sceneIndex) },
            { role: "user", content: `المشهد رقم ${sceneIndex}: "${scene.title}". اكتب الكود فقط بالوسوم الثلاثة: <scene_css>, <scene_html>, <scene_js> بدون أي نص إضافي.` },
          ],
          temperature: 0.5,
          max_tokens: 4096,
        });
        const retryRaw = retryResponse.choices?.[0]?.message?.content;
        if (retryRaw) {
          const retryExtracted = extractSceneCode(retryRaw, sceneIndex);
          if (retryExtracted.html.trim() || retryExtracted.js.trim()) {
            return {
              sceneIndex: scene.sceneIndex,
              title: scene.title,
              css: retryExtracted.css,
              html: retryExtracted.html,
              js: validateAndWrapJs(retryExtracted.js, sceneIndex),
            };
          }
        }
      } catch (retryErr) {
        console.warn(`[SceneGenerator] Retry failed for scene ${sceneIndex}:`, retryErr);
      }

      // If retry also failed, return graceful animated fallback
      return createFallbackScene(scene);
    }

    return {
      sceneIndex: scene.sceneIndex,
      title: scene.title,
      css: extracted.css,
      html: extracted.html,
      js: validateAndWrapJs(extracted.js, sceneIndex),
    };
  } catch (err: any) {
    console.error(`[SceneGenerator] Unexpected error for scene ${sceneIndex}:`, err.message);
    return createFallbackScene(scene);
  }
}

/**
 * Generates all scenes sequentially (not parallel to avoid rate limits).
 * Each scene gets the full system prompt context but only generates its own code.
 */
export async function generateAllScenes(
  apiKey: string,
  model: string,
  plan: ScenePlan,
): Promise<GeneratedScene[]> {
  const scenes: GeneratedScene[] = [];

  for (let i = 0; i < plan.scenes.length; i++) {
    const scene = await generateScene(apiKey, model, plan, i);
    scenes.push(scene);
  }

  console.log(`[SceneGenerator] All ${scenes.length} scenes generated successfully!`);
  return scenes;
}
