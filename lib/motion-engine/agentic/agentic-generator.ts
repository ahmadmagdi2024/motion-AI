import "server-only";
import vm from "node:vm";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";
import { OpenRouterMessage } from "@/lib/openrouter/types";
import { AGENTIC_TOOLS_SCHEMA, executeAgenticTool } from "./tools-definition";
import { CANV_RUNTIME_HELPERS } from "./mechanics-library";
import { scanMotionStyles, type MotionStyleItem } from "../styles-scanner";
import { injectStudioBridge } from "../studio-bridge";

function healScriptBody(js: string): string {
  let cleaned = js.trim();
  try {
    new vm.Script(cleaned);
    return cleaned;
  } catch (_) {}

  cleaned = cleaned.replace(/\([a-zA-Z0-9_$]+\s*===\s*=>\s*[^)]+\)/g, "");
  cleaned = cleaned.replace(/;\s*[\w$]+\s*$/, ";");
  cleaned = cleaned.replace(/(?:let|const|var)\s+[\w$]+\s*=\s*$/, "");
  cleaned = cleaned.replace(/[a-zA-Z0-9_$]+\s*\.\s*$/, "");

  const lines = cleaned.split("\n");
  while (lines.length > 2) {
    lines.pop();
    let attempt = lines.join("\n").trim();
    const openBraces = (attempt.match(/\{/g) || []).length;
    const closeBraces = (attempt.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      attempt += "\n" + "}".repeat(openBraces - closeBraces);
    }
    try {
      new vm.Script(attempt);
      return attempt;
    } catch (_) {}
  }
  return cleaned;
}

function cleanAgenticHtml(raw: string): string {
  let text = raw.trim();

  // If wrapped in ```html ... ``` code block, extract it
  const codeBlockMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  // Ensure it has basic HTML skeleton if model only returned body/script
  if (!text.toLowerCase().includes("<html")) {
    text = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Motion Graphic Film</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0b0f17; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; font-family: 'Cairo', sans-serif; }
#stage-container { position: relative; width: 100vw; height: 100vh; max-width: 56.25vh; max-height: 177.78vw; aspect-ratio: 9/16; background: #000; overflow: hidden; }
canvas { width: 100%; height: 100%; display: block; }
</style>
</head>
<body>
<div id="stage-container">
  <canvas id="motion-canvas" width="1080" height="1920"></canvas>
</div>
<script>
${text}
</script>
</body>
</html>`;
  }

  // Ensure helper functions exist if canvas mechanics are referenced
  if (text.includes("odometer") || text.includes("dotGrid") || text.includes("flipCard") || text.includes("gauge") || text.includes("growBars")) {
    if (!text.includes("function cl(") && !text.includes("const cl =")) {
      text = text.replace("<script>", `<script>\n${CANV_RUNTIME_HELPERS}\n`);
    }
  }

  // Handle cut off inside <script>
  const lastScriptOpen = text.lastIndexOf("<script");
  const lastScriptClose = text.lastIndexOf("</script>");

  if (lastScriptOpen > -1 && (lastScriptClose < lastScriptOpen || lastScriptClose === -1)) {
    console.warn("[AgenticEngine] Output was truncated before closing script. Auto-healing code...");
    const tagEnd = text.indexOf(">", lastScriptOpen);
    if (tagEnd > -1) {
      let scriptBody = text.substring(tagEnd + 1);
      scriptBody = healScriptBody(scriptBody);
      text = text.substring(0, tagEnd + 1) + "\n" + scriptBody + "\n</script>\n</body>\n</html>";
    } else {
      text += "\n</script>\n</body>\n</html>";
    }
  } else if (!text.toLowerCase().includes("</body>")) {
    text += "\n</body>\n</html>";
  } else if (!text.toLowerCase().includes("</html>")) {
    text += "\n</html>";
  }

  // Smart script syntax healer
  const scriptMatch = text.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    const healed = healScriptBody(scriptMatch[1]);
    text = text.replace(scriptMatch[1], healed);
  }

  return text;
}

export async function runAgenticEngine(
  apiKey: string,
  model: string,
  prompt: string,
  duration: number,
  brandStyle?: string,
  styleId?: string
): Promise<{ html: string; title: string; phaseLogs: string[] }> {
  const phaseLogs: string[] = [];
  phaseLogs.push("🚀 تشغيل المحرك التفاعلي الذكي (Agentic Motion Director)...");

  // Load visual style if available
  let selectedStyleInfo: MotionStyleItem | null = null;
  try {
    const { styles } = await scanMotionStyles();
    if (styleId) selectedStyleInfo = styles.find((s) => s.id === styleId) || null;
    if (!selectedStyleInfo && brandStyle) {
      const lower = brandStyle.toLowerCase();
      if (lower.includes("flat") || lower.includes("فلات")) {
        selectedStyleInfo = styles.find((s) => s.filename.toLowerCase().includes("flat")) || null;
      }
    }
    if (!selectedStyleInfo && styles.length > 0) selectedStyleInfo = styles[0];
  } catch (e) {
    console.warn("[AgenticEngine] Could not load styles:", e);
  }

  const systemPrompt = `أنت مخرج ومبرمج موشن جرافيك عبقري (Motion Graphics Creative Director & Lead Visual Technologist).
أنت تعمل بنظام الوكيل التفاعلي (Agentic Loop)، حيث تمتلك وصولاً حياً لأدوات استوديو الموشن:

═══════════════════════════════════════════════════
## أدوات الاستوديو المتاحة لك (Available Tools):
═══════════════════════════════════════════════════
1. 'get_available_motion_mechanics': لاستكشاف مكتبة الحركات الفيزيائية (عدّاد الأرقام odometer، شبكة النقاط dotGrid، مخطط الدونات donutSplit، البطاقات القلابة flipCard، المكعبات المتراكمة stackBlocks، الأعمدة البيانية growBars، صف الأيقونات iconStrip، المسار المتعرج windingPath، الدوائر متحدة المركز rings، مقياس السرعة gauge، صفوف القوائم listRow، كرت الخلاصة summaryCard).
2. 'get_mechanic_code': لجلب الأكواد الرياضية الدقيقة للآليات التي تختارها لتضمينها في كود المشاهد.
3. 'get_directing_rules': لاسترجاع دستور الإخراج (قاعدة الحالات الثلاث للعنصر Cold->Live->Done، التباين اللوني، قواعد خط Cairo وزن 700، والمناطق الآمنة 9:16، وقانون فصل الموضوع الصارم).

═══════════════════════════════════════════════════
## خطوات العمل وقواعد الإخراج الإلزامية:
═══════════════════════════════════════════════════
1. استدعِ أولاً أدوات 'get_available_motion_mechanics' و 'get_directing_rules'.
2. قسّم الفكرة إلى مشاهد متسلسلة متناسقة زمنيًا (المدة الإجمالية: ${duration} ثانية).
3. اختر آلية حركة مختلفة لكل مشهد (ممنوع تكرار نفس الحركة مرتين في نفس الفيديو!).
4. اطلب كود الحركات المختارة عبر 'get_mechanic_code'.
5. ولّد كود HTML كامل ومستقل (1080x1920 9:16 Pure Canvas Stage) يجسد هذه الحركات بدقة متناهية، مع توقيت دقيق عبر renderAtTime(t).

═══════════════════════════════════════════════════
⛔ قانون الفصل الصارم والمطلق بين (موضوع وسيناريو الفيديو) و (نمط الرسم المختار):
═══════════════════════════════════════════════════
1. [موضوع وسيناريو وهوية الفيديو]: يُشتق بنسبة 100% وبشكل حصري من "فكرة المستخدم فقط"!
   - النص، التعليق الصوتي، العناوين، الأشكال، الأيقونات، العناصر المرئية، والبطاقات يجب أن تعبر حرفياً ومباشرة عن موضوع المستخدم ومجال عمله.
   - مثال حاسم: إذا طلب المستخدم فيديو عن "منصة لإنشاء الموشن جرافيك بالذكاء الاصطناعي"، فإن كافة المشاهد والعناصر يجب أن تصور منصة الذكاء الاصطناعي، بطاقات توليد الفيديو، محركات التحريك، كفاءة الوقت والمال، والأيقونات التقنية.
   - ⛔ ممنوع منعاً باتاً استعارة أي عناصر قصصية أو مجازات بصرية من أمثلة ملفات الأنماط (مثل المراكب، السفن، البحار، الأمواج، العواصف، السيارات، العطور، المقامرة) إلا إذا طلبها المستخدم نصاً في فكرته!
2. [النمط البصري المختار]: هو مجرد "فرشاة رسم ونمط تلوين وفيزياء" (Rendering Style & Shader):
   - يحدد حصراً: كيفية تظليل الكانفس، سماكة خطوط الرسم، أسلوب التلوين (فلات صلب، كرتوني بظلال، أو تقني حديث)، وسلوك المنحنيات الحركية.
   - النمط يخدم فكرة المستخدم ويطبق عليها، ولا يغيرها أبداً!

⛔ محظورات قطعية (STRICTLY FORBIDDEN):
- ممنوع منعاً باتاً استبدال فكرة المستخدم أو تحريفها إلى استعارة مجازية مأخوذة من اسم ملف النمط المرجعي!
- ممنوع منعاً باتاً إنشاء لوحة تحكم HTML أو شريط جانبي (<div class="panel"> أو <main>) أو أزرار أو مدخلات ملفات (<input type="file">) أو مربعات اختيار (<input type="checkbox">). الاستوديو يمتلك واجهة تشغيل خارجية؛ كودك يجب أن يعرض فقط شاشة الموشن (1080x1920) ملء الإطار!
- ممنوع إخفاء النصوص أو جعل الكابشن مشروطاً بمربع اختيار. النصوص والعناوين العربية جزء أساسي من العمل الفني وتظهر بحركات دخول وخروج مدروسة.
- ممنوع ترك مربعات فارغة أو خطوط متقطعة (Dashed Placeholders) وكتابة "يُضاف في المونتاج" أو "الشعار مفقود". ارسم كل شيء بصرياً بشكل مكتمل واحترافي داخل الكانفس (شعار أيقوني، بطاقات تفاعلية، أختام رسمية).
- ممنوع رسم شخبطات خطية بدائية (Stick figures). استخدم رسومات وأيقونات 2D هندسية أنيقة بانحناءات ناعمة وتدرجات وظلال متوهجة تعكس أعلى درجات الاحترافية.
${selectedStyleInfo ? `\n═══════════════════════════════════════════════════\nالأسلوب والنمط البصري المطلوب للرسم والتلوين (${selectedStyleInfo.name}):\n═══════════════════════════════════════════════════\n${selectedStyleInfo.promptDirectives}` : ""}`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `═══════════════════════════════════════════════════
🎯 فكرة وموضوع الفيديو المطلوب تنفيذه بدقة تامة وبشكل حصري:
"${prompt}"
المدة المستهدفة: ${duration} ثانية.
النمط الفني المطلوب للرسم والتلوين: "${selectedStyleInfo?.name || "Modern Motion"}".
═══════════════════════════════════════════════════
تنبيه صارم: التزم 100% بموضوع "${prompt}". النمط الفني هو لأسلوب الرسم والتلوين فقط، ولا تستعر منه أي قصة أو عناصر خارج موضوع المستخدم. ابدأ باستدعاء أدوات الاستوديو المناسبة لفحص آليات التحريك والقواعد الإخراجية المطلوبة لهذا المشروع.`,
    },
  ];

  let rawOutput = "";
  let iterations = 0;
  const maxIterations = 4;

  while (iterations < maxIterations) {
    iterations++;
    console.log(`[AgenticEngine] Iteration ${iterations}/${maxIterations}...`);

    const response = await sendOpenRouterRequest(apiKey, {
      model,
      messages,
      tools: AGENTIC_TOOLS_SCHEMA,
      temperature: 0.35,
      max_tokens: 32000,
    });

    const choice = response.choices?.[0];
    if (!choice) {
      throw new Error("لم يتم استلام أي رد من مزود الذكاء الاصطناعي.");
    }

    const assistantMsg = choice.message;
    const toolCalls = assistantMsg?.tool_calls;

    // If model made tool calls
    if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: assistantMsg.content || null,
        tool_calls: toolCalls,
      });

      for (const call of toolCalls) {
        const fnName = call.function.name;
        let fnArgs: any = {};
        try {
          fnArgs = JSON.parse(call.function.arguments || "{}");
        } catch (_) {}

        if (fnName === "get_available_motion_mechanics") {
          phaseLogs.push("🛠️ [الوكيل الذكي] استعلام عن مكتبة آليات الموشن جرافيك في الاستوديو...");
        } else if (fnName === "get_mechanic_code") {
          const names = fnArgs.mechanic_names?.join("، ") || "";
          phaseLogs.push(`⚡ [الوكيل الذكي] سحب الأكواد الرياضية لآليات التحريك: [${names}]`);
        } else if (fnName === "get_directing_rules") {
          phaseLogs.push("📐 [الوكيل الذكي] مراجعة دستور وقواعد الإخراج والتباين اللوني والمناطق الآمنة...");
        }

        const toolResult = await executeAgenticTool(fnName, fnArgs);

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          name: fnName,
          content: JSON.stringify(toolResult),
        });
      }

      continue; // Continue loop to get next turn from model
    }

    // No tool calls: check if model gave final HTML or plan
    const content = assistantMsg?.content;
    if (typeof content === "string") {
      rawOutput = content;
      if (content.includes("<canvas") || content.includes("<html") || content.includes("function renderAtTime") || content.includes("requestAnimationFrame")) {
        phaseLogs.push("✨ [الوكيل الذكي] اكتملت صياغة المشاهد وبرمجة الحركات بالكامل!");
        break;
      } else {
        // Model answered with plan/thought but didn't output code yet
        phaseLogs.push("💡 [الوكيل الذكي] إعداد خطة المشاهد وتوزيع الحركات...");
        messages.push({
          role: "assistant",
          content,
        });
        messages.push({
          role: "user",
          content: `ممتاز جداً! قم الآن بإنشاء كود الـ HTML النهائي والكامل والمستقل (1080x1920 9:16 Pure Canvas)، متضمناً دوال التحريك المختارة وقواعد الإخراج بدون أي نقصان داخل وسم <html>...</html>.
تذكير صارم: التزم بنسبة 100% بموضوع وسيناريو فكرة المستخدم ("${prompt}") ولا تقحم أي استعارات أو عناصر من أمثلة ملفات الأنماط.`,
        });
      }
    } else {
      break;
    }
  }

  if (!rawOutput) {
    throw new Error("لم يتم إنتاج كود للمشروع من المحرك التفاعلي.");
  }

  const finalHtml = injectStudioBridge(cleanAgenticHtml(rawOutput), duration);

  // Extract a suitable title
  const titleMatch = finalHtml.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : prompt.slice(0, 30) + "...";

  return {
    html: finalHtml,
    title,
    phaseLogs,
  };
}
