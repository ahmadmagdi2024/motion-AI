/**
 * /api/generate — Antigravity Motion Graphics Generator
 * Default Mode: Comprehensive Single-Shot (الدفعة الواحدة) — High-impact SVG shapes, rich physics & selected visual theme
 * Secondary Mode: Multi-phase Scene-by-Scene Pipeline
 */
import vm from "node:vm";
import { scanMotionStyles, type MotionStyleItem } from "@/lib/motion-engine/styles-scanner";
import { saveProject } from "@/lib/db/projects";
import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";
import { buildSystemPrompt } from "@/lib/motion-engine/system-prompt";
import { planScenes } from "@/lib/motion-engine/scene-planner";
import { generateAllScenes } from "@/lib/motion-engine/scene-generator";
import { assembleFilm } from "@/lib/motion-engine/scene-assembler";
import { buildDynamicMotionCatalog } from "@/lib/motion-engine/motion-catalog";
import { runAgenticEngine } from "@/lib/motion-engine/agentic/agentic-generator";
import { injectStudioBridge } from "@/lib/motion-engine/studio-bridge";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes

const GenerateSchema = z.object({
  prompt: z.string().min(3, "يرجى كتابة وصف أو فكرة للمشروع بـ 3 أحرف على الأقل"),
  duration: z.number().int().min(10).max(120).default(60),
  model: z.string().optional(),
  brandStyle: z.string().optional(),
  styleId: z.string().optional(),
  mode: z.enum(["pipeline", "legacy", "agentic"]).default("legacy"),
});

// ═══════════════════════════════════════════════════
// Smart JS Syntax & Truncation Healer
// ═══════════════════════════════════════════════════

function healJavaScriptBody(js: string): string {
  let cleaned = js.trim();

  // Try direct parse first
  try {
    new vm.Script(cleaned);
    return cleaned;
  } catch (_) {}

  // Strip known bad artifacts & cut-off statements
  cleaned = cleaned.replace(/\([a-zA-Z0-9_$]+\s*===\s*=>\s*[^)]+\)/g, "");
  cleaned = cleaned.replace(/===\s*=>/g, "===");
  cleaned = cleaned.replace(/==\s*=>/g, "==");
  cleaned = cleaned.replace(/;\s*[\w$]+\s*$/, ";");
  cleaned = cleaned.replace(/(?:let|const|var)\s+[\w$]+\s*=\s*$/, "");
  cleaned = cleaned.replace(/[a-zA-Z0-9_$]+\s*\.\s*$/, "");

  // Iteratively trim the last line until script compiles cleanly
  const lines = cleaned.split("\n");
  while (lines.length > 2) {
    lines.pop();
    let attempt = lines.join("\n").trim();

    // Close any unclosed braces
    const openBraces = (attempt.match(/\{/g) || []).length;
    const closeBraces = (attempt.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      attempt += "\n" + "}\n".repeat(openBraces - closeBraces);
    }

    // Add API bindings if missing
    if (!attempt.includes("window.renderAtTime") && attempt.includes("renderAtTime")) {
      attempt += `\ntry { if (typeof renderAtTime === 'function') window.renderAtTime = renderAtTime; } catch(e){}\n`;
    }
    if (!attempt.includes("window.__studioAPI")) {
      attempt += `
try {
  if (!window.__studioAPI) {
    window.__studioAPI = {
      play: () => { if (typeof play === 'function') play(); },
      stop: () => { if (typeof stop === 'function') stop(); },
      toggle: () => { if (typeof toggle === 'function') toggle(); },
      renderAtTime: (t) => { if (typeof renderAtTime === 'function') renderAtTime(t); },
      getTime: () => (typeof time === 'number' ? time : 0),
      isPlaying: () => (typeof playing === 'boolean' ? playing : false),
      setLanguage: () => {}
    };
  }
} catch(e) {}
`;
    }

    try {
      new vm.Script(attempt);
      console.log(`[v3/generate] Script auto-healed after trimming ${cleaned.split("\n").length - lines.length} lines.`);
      return attempt;
    } catch (_) {}
  }

  return cleaned;
}

function repairTruncatedHtml(raw: string): string {
  let html = raw.trim();

  // Strip outer markdown fences
  if (html.startsWith("```")) {
    html = html.replace(/^```(?:html)?\s*/i, "");
    html = html.replace(/```\s*$/, "");
    html = html.trim();
  }

  // Handle cut off inside <style>
  const lastStyleOpen = html.lastIndexOf("<style");
  const lastStyleClose = html.lastIndexOf("</style>");
  if (lastStyleOpen > -1 && lastStyleClose < lastStyleOpen) {
    html += "\n</style>\n</head>\n<body>\n<div id=\"film-stage\"></div>\n<script>\n";
  }

  // Handle cut off inside <script>
  const lastScriptOpen = html.lastIndexOf("<script");
  const lastScriptClose = html.lastIndexOf("</script>");

  if (lastScriptOpen > -1 && (lastScriptClose < lastScriptOpen || !html.toLowerCase().includes("</html>"))) {
    console.warn("[v3/generate] HTML was truncated before closing. Auto-healing code...");
    const tagEnd = html.indexOf(">", lastScriptOpen);
    if (tagEnd > -1) {
      let scriptBody = html.substring(tagEnd + 1);
      if (lastScriptClose > tagEnd) {
        scriptBody = html.substring(tagEnd + 1, lastScriptClose);
      }
      scriptBody = healJavaScriptBody(scriptBody);
      html = html.substring(0, tagEnd + 1) + "\n" + scriptBody + "\n</script>\n</body>\n</html>";
    } else {
      html += "\n</script>\n</body>\n</html>";
    }
  } else if (!html.toLowerCase().includes("</body>")) {
    html += "\n</body>\n</html>";
  } else if (!html.toLowerCase().includes("</html>")) {
    html += "\n</html>";
  }

  // Final validation and healing
  const scriptMatch = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    try {
      new vm.Script(scriptMatch[1]);
      console.log("[v3/generate] Final script syntax verified: VALID.");
    } catch (syntaxErr: any) {
      console.warn("[v3/generate] Script healing pass:", syntaxErr.message);
      const healed = healJavaScriptBody(scriptMatch[1]);
      try {
        new vm.Script(healed);
        html = html.replace(scriptMatch[1], healed);
      } catch (e2: any) {
        console.error("[v3/generate] Secondary syntax notice:", e2.message);
      }
    }
  }

  return html;
}

// ═══════════════════════════════════════════════════
// Comprehensive Single-Shot Mode (الدفعة الواحدة) — Primary
// ═══════════════════════════════════════════════════

async function runLegacy(
  apiKey: string,
  model: string,
  prompt: string,
  duration: number,
  brandStyle?: string,
  styleId?: string,
): Promise<{ html: string; title: string }> {
  let systemPrompt = buildSystemPrompt({ durationSeconds: duration });

  // 1. Strictly inject the selected visual style & color rules
  let selectedStyleInfo: MotionStyleItem | null = null;
  try {
    const { styles } = await scanMotionStyles();
    if (styleId) {
      selectedStyleInfo = styles.find((s) => s.id === styleId) || null;
    }
    if (!selectedStyleInfo && brandStyle) {
      const lower = brandStyle.toLowerCase();
      if (lower.includes("flat") || lower.includes("فلات") || lower.includes("صلب")) {
        selectedStyleInfo = styles.find((s) => s.filename.toLowerCase().includes("flat")) || null;
      }
    }
    if (!selectedStyleInfo && styles.length > 0) {
      selectedStyleInfo = styles[0];
    }
    if (selectedStyleInfo && selectedStyleInfo.promptDirectives) {
      systemPrompt += `\n\n═══════════════════════════════════════════════════\n## النمط الفني وهوية الألوان الإلزامية (${selectedStyleInfo.name}):\n═══════════════════════════════════════════════════\n${selectedStyleInfo.promptDirectives}\n`;
    }
  } catch (e) {
    console.warn("[v3/generate] Could not load motion styles:", e);
  }

  // 2. Inject dynamic motion physics primitives
  try {
    const catalog = await buildDynamicMotionCatalog();
    if (catalog) {
      systemPrompt += `\n\n${catalog}\n`;
    }
  } catch (e) {}

  // 3. Directed prompt for rich SVG graphics and visual metaphors
  const userMessageContent = JSON.stringify({
    task: "مهمة إخراج فيلم موشن جرافيك سينمائي عالي الجودة والاحترافية",
    coreDirectingPrinciple: "أنشئ فيلماً بصرياً متحركاً حقيقياً قائماً على الرسوم المتجهة (SVG)، الأيقونات، الأشكال الهندسية، التحولات الفيزيائية، وتفاعل العناصر مع بعضها البعض. ممنوع تحويل الفيديو إلى شرائح عرض أو مجرد نصوص في صناديق.",
    sceneData: {
      durationSeconds: duration,
      aspectRatio: "1080x1920 portrait (9:16)",
      conceptToVisualize: prompt,
      selectedArtisticStyle: selectedStyleInfo ? selectedStyleInfo.name : "Modern Motion Design",
      customBrandAndColorNotes: brandStyle || "طبق لوحة ألوان الهوية المتناسقة بدقة مع النمط المختار",
      strictTopicIsolation: "موضوع الفيديو وسيناريوه حصري بنسبة 100% لفكرة المستخدم المذكورة أعلاه. النمط الفني يحدد فقط جماليات الرسم والألوان، ويحظر قطيعاً استعارة أي عناصر أو مجازات تخص الملف المرجعي (مثل المراكب أو البحار أو السيارات أو العطور).",
    },
    motionDirectingLaws: {
      topicIsolationLaw: "قانون استقلال الموضوع الصارم: المشاهد والنصوص والأيقونات تجسد فكرة المستخدم حرفياً وبدون أي تحريف مجازي.",
      visualDominance: "العناصر البصرية والرسوم المتحركة يجب أن تشغل 70% على الأقل من الشاشة، والنصوص مقتضبة وداعمة للصورة.",
      darkThemeCeilingLaw: "قانون سقف المشاهد الداكنة الصارم (40% كحد أقصى): ممنوع منعاً باتاً إنتاج فيلم كامل بخلفيات داكنة! نسبة المشاهد ذات الثيمات الداكنة (Black/OLED/Dark) يجب ألا تتجاوز 40% من إجمالي مشاهد الفيديو. 60% على الأقل من المشاهد يجب أن تكون بخلفيات فاتحة ومشرقة ونقية (أبيض #ffffff، رمادي فاتح فاخر #f8fafc، درجات باستيل/كريمي، أو ألوان هوية فاتحة)، مع ضبط نصوص المشاهد الفاتحة لتكون داكنة عالية التباين والمقروئية (#0f172a أو #1e293b).",
      motionDiversityLaw: "قانون تنوع أساليب الحركة الصارم (منع احتكار المورفينج): ممنوع منعاً باتاً جعل التحول الشكلي (Morphing) هو الحركة السائدة أو الوحيدة في الفيديو! المورفينج مقيد بمرة واحدة كحد أقصى في كامل الفيلم إن لزم. يجب استخدام أساليب حركة متنوعة من قاموس الحركات عبر المشاهد: (1) رسم مسارات SVG الحي Trim Path Draw-On عبر strokeDashoffset، (2) ارتداد زنبركي مرن Elastic Spring Pop-in، (3) حركة كاميرا وعمق بارالاكس Camera Push & Parallax Depth، (4) طباعة حركية Kinetic Typography للأرقام والعناوين، (5) تمدد وانضغاط فيزيائي Squash & Stretch، (6) تموج وانسياب طافي Wave & Flutter. كل مشهد يجب أن يقدم تقنية حركية مختلفة كلياً عن المشهد الآخر!",
      inception: "قانون بداية الحركة: لا يظهر أي عنصر لأول مرة في منتصف حركته. يبدأ من حالة بداية مقصودة (Scale 0 أو Opacity 0 أو خارج الكادر).",
      continuity: "قانون الانتقال: لا تُخفِ عناصر المشهد دفعة واحدة، بل اجعل العناصر تنتقل أو تتحول أو تندمج بانسيابية مع المشهد التالي مع تجنب المورفينج المتكرر.",
      temporalPacing: "توزيع زمني متدرج لدخول العناصر وتفاعلها عبر الخط الزمني renderAtTime(t).",
      auditability: "تنفيذ حسابي حتمي دقيق لكل فريم عبر renderAtTime(t)."
    },
    outputConstraint: "أخرج كود HTML كامل فقط يبدأ بـ <!DOCTYPE html> وينتهي بـ </html> بدون شروحات ماركداون."
  }, null, 2);

  console.log(`[v3/generate] Calling OpenRouter with model: ${model}, duration: ${duration}s, style: ${selectedStyleInfo?.name || "default"}`);

  const openRouterResponse = await sendOpenRouterRequest(apiKey, {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessageContent },
    ],
    temperature: 0.7,
    max_tokens: 32000, // Massive token budget so truncation rarely happens
  });

  const choice = openRouterResponse.choices?.[0];
  const rawContent = choice?.message?.content;
  const finishReason = choice?.finish_reason;

  if (!rawContent || typeof rawContent !== "string") {
    throw new Error("لم يُرجع النموذج أي محتوى نصي صالح.");
  }

  if (finishReason === "length") {
    console.warn("[v3/generate] Response reached max tokens limit. Auto-repairing to preserve all scenes...");
  }

  // Auto-heal even if truncated
  const htmlCode = repairTruncatedHtml(rawContent);

  if (!htmlCode.toLowerCase().includes("<html") && !htmlCode.toLowerCase().includes("<!doctype")) {
    throw new Error("لم يتمكن النموذج من إرجاع كود HTML سليم ومكتمل.");
  }

  const titleMatch = htmlCode.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "فيلم موشن جرافيك";

  console.log(`[v3/generate] Single-shot film generated successfully: "${title}" (${htmlCode.length} chars)`);
  return { html: htmlCode, title };
}

// ═══════════════════════════════════════════════════
// Experimental Pipeline Mode (مشهد بمشهد)
// ═══════════════════════════════════════════════════

async function runPipeline(
  apiKey: string,
  model: string,
  prompt: string,
  duration: number,
  brandStyle?: string,
): Promise<{ html: string; title: string; phaseLogs: string[] }> {
  const logs: string[] = [];

  // Phase 1: Plan
  logs.push("المرحلة 1: تحليل البرومبت وتخطيط المشاهد...");
  console.log("[Pipeline] Phase 1: Planning scenes...");
  const plan = await planScenes(apiKey, model, prompt, duration, brandStyle);
  logs.push(`✓ تم إنشاء خطة من ${plan.scenes.length} مشاهد: "${plan.filmTitle}"`);

  // Phase 2: Generate each scene
  logs.push(`المرحلة 2: توليد كود المشاهد (${plan.scenes.length} مشاهد)... `);
  console.log(`[Pipeline] Phase 2: Generating ${plan.scenes.length} scenes...`);
  const scenes = await generateAllScenes(apiKey, model, plan);
  logs.push("✓ تم توليد جميع المشاهد");

  // Phase 3: Assemble
  logs.push("المرحلة 3: تجميع الفيلم النهائي...");
  console.log("[Pipeline] Phase 3: Assembling film...");
  const html = assembleFilm(plan, scenes);
  logs.push(`✓ تم تجميع الفيلم: ${html.length} حرف`);

  return { html, title: plan.filmTitle, phaseLogs: logs };
}

// ═══════════════════════════════════════════════════
// POST Handler
// ═══════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = GenerateSchema.parse(json);

    const cookieStore = cookies();
    const apiKey =
      cookieStore.get("OPENROUTER_SESSION_KEY")?.value ||
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "يرجى إدخال مفتاح OpenRouter API من نافذة الإعدادات أولاً للبدء بالتوليد." },
        { status: 401 }
      );
    }

    const model =
      input.model ||
      cookieStore.get("OPENROUTER_MODEL")?.value ||
      process.env.OPENROUTER_MODEL ||
      "google/gemini-3.8-flash";

    // Block problematic reasoning-only models
    const lowerModel = model.toLowerCase();
    if (lowerModel.includes("deepseek-reasoner") || lowerModel.includes("deepseek-r1") || lowerModel.includes("deepseek-v4") || lowerModel.includes("qwen")) {
      return NextResponse.json({
        error: "يرجى استخدام نموذج متقدم لكتابة الكود مثل Claude 3.7 Sonnet أو Gemini 2.0 Flash."
      }, { status: 400 });
    }

    const mode = input.mode || "legacy";
    console.log(`[v3/generate] Mode: ${mode.toUpperCase()}, Model: ${model}, Duration: ${input.duration}s`);

    let htmlCode: string;
    let title: string;
    let phaseLogs: string[] | undefined;

    if (mode === "agentic") {
      const result = await runAgenticEngine(apiKey, model, input.prompt, input.duration, input.brandStyle, input.styleId);
      htmlCode = result.html;
      title = result.title;
      phaseLogs = result.phaseLogs;
    } else if (mode === "pipeline") {
      const result = await runPipeline(apiKey, model, input.prompt, input.duration, input.brandStyle);
      htmlCode = result.html;
      title = result.title;
      phaseLogs = result.phaseLogs;
    } else {
      const result = await runLegacy(apiKey, model, input.prompt, input.duration, input.brandStyle, input.styleId);
      htmlCode = result.html;
      title = result.title;
    }

    // Always guarantee full Studio API contract
    htmlCode = injectStudioBridge(htmlCode, input.duration);

    // Auto-save project
    let savedProjectId: string | undefined;
    try {
      const saved = await saveProject({
        title,
        durationSeconds: input.duration,
        modelUsed: model,
        prompt: input.prompt,
        htmlCode,
      });
      savedProjectId = saved.id;
    } catch (dbErr) {
      console.error("[v3/generate] Database auto-save warning:", dbErr);
    }

    return NextResponse.json({
      success: true,
      html: htmlCode,
      title,
      durationSeconds: input.duration,
      modelUsed: model,
      mode,
      phaseLogs,
      projectId: savedProjectId,
    });
  } catch (error: any) {
    console.error("[v3/generate] Error:", error);
    return NextResponse.json(
      { error: error?.message || "حدث خطأ أثناء توليد كود الفيلم." },
      { status: 500 }
    );
  }
}
