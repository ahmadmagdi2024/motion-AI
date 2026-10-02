/**
 * Dedicated Isolated Engine for Space Bunny Alpha (stealth/space-bunny-alpha)
 * ════════════════════════════════════════════════════════════════════════════
 * This file is completely isolated and decoupled from the studio's primary engines.
 * It is invoked ONLY when the user explicitly selects `stealth/space-bunny-alpha`.
 * It configures reasoning suppression (`reasoning: { effort: "low" }`) to prevent
 * the model from exhausting its token budget in internal thoughts, and provides
 * a tailored creative motion prompt with full deterministic renderAtTime(t) support.
 */

import "server-only";
import vm from "node:vm";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";
import { injectStudioBridge } from "./studio-bridge";
import { scanMotionStyles, type MotionStyleItem } from "./styles-scanner";
import { buildDynamicMotionCatalog } from "./motion-catalog";

function cleanSpaceBunnyOutput(raw: string): string {
  let cleaned = raw.trim();

  // Strip any <think>...</think> tags if present in output
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Extract from markdown code fence if wrapped
  const codeBlockMatch = cleaned.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Ensure standard HTML structure
  if (!cleaned.toLowerCase().includes("<html")) {
    cleaned = `<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="UTF-8">\n<title>Motion Film</title>\n</head>\n<body>\n${cleaned}\n</body>\n</html>`;
  }

  // Ensure closing tags
  if (!cleaned.toLowerCase().includes("</body>")) cleaned += "\n</body>";
  if (!cleaned.toLowerCase().includes("</html>")) cleaned += "\n</html>";

  return cleaned;
}

export async function runStealthSpaceBunnyEngine(
  apiKey: string,
  model: string,
  prompt: string,
  duration: number,
  brandStyle?: string,
  styleId?: string
): Promise<{ html: string; title: string; phaseLogs: string[] }> {
  const phaseLogs: string[] = [];
  phaseLogs.push("🐰 تشغيل المحرك المستقل الخاص بنموذج Space Bunny Alpha...");
  phaseLogs.push("⚡ تفعيل وضع الاستجابة الفورية وضبط مجهود التفكير المنخفض (reasoning.effort = low)...");

  // Load style info if selected
  let styleDirective = "";
  try {
    const { styles } = await scanMotionStyles();
    let selectedStyle: MotionStyleItem | null = null;
    if (styleId) selectedStyle = styles.find((s) => s.id === styleId) || null;
    if (!selectedStyle && styles.length > 0) selectedStyle = styles[0];
    if (selectedStyle?.promptDirectives) {
      styleDirective = `\nالنمط الفني وهوية الألوان:\n${selectedStyle.promptDirectives}\n`;
    }
  } catch (_) {}

  // Load motion catalog
  let motionCatalogSnippet = "";
  try {
    const catalog = await buildDynamicMotionCatalog();
    if (catalog) motionCatalogSnippet = `\n${catalog}\n`;
  } catch (_) {}

  const systemPrompt = `أنت مهندس ومخرج موشن جرافيك سينمائي فائق الاحترافية.
مهمتك: كتابة كود فيلم موشن جرافيك كامل ومستقل يعمل على الويب بدقة عالية (1080x1920 عمودي 9:16).

═══ القواعد الفنية والهندسية الإلزامية ═══
1. الأبعاد: الكادر 1080×1920 بكسل في منتصف الشاشة مع تكبير وتصغير متجاوب (#film-stage).
2. المحرك الحسابي الحتمي:
   - يجب تعريف دالة أساسية بالاسم: renderAtTime(t) حيث t هو الزمن المنقضي بالثواني من 0 إلى ${duration}.
   - نفس الزمن t يعطي دائماً نفس النتيجة بدقة الفريم الواحد.
   - لا تستخدم setTimeout أو setInterval إطلاقاً للحركة، بل كل التحريكات تعتمد على t.
3. الجماليات البصرية:
   - استخدم عناصر رسومية متجهة (SVG)، بطاقات، أيقونات، وأشكال هندسية أنيقة تشغل المساحة وتخدم فكرة المستخدم.
   - الخطوط: استخدم خط 'Cairo' بوزن 700 من Google Fonts للنصوص العربية، مع مقروئية عالية وتباين ممتاز.
   - تجنب السواد التام المفرط: اجعل أغلب المشاهد ناصعة ومشرقة ونظيفة مع تباين قوي.
4. استقلال الموضوع: التزم 100% بفكرة المستخدم ولا تضف عناصر غريبة عنها.
${styleDirective}
${motionCatalogSnippet}

═══ صيغة الإخراج المطلوبة ═══
أخرج كود HTML كامل فقط ومستقل يبدأ بـ <!DOCTYPE html> وينتهي بـ </html> بدون أي كلام جانبي أو شروحات.`;

  const userPromptContent = `فكرة وموضوع الفيديو المطلوب تنفيذه:
"${prompt}"

المدة المطلوبة: ${duration} ثانية.
المقاس: 1080×1920 عمودي (9:16).
${brandStyle ? `ملاحظات الهوية: ${brandStyle}` : ""}`;

  console.log(`[SpaceBunnyEngine] Invoking OpenRouter with model: ${model}, duration: ${duration}s`);

  const response = await sendOpenRouterRequest(apiKey, {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPromptContent },
    ],
    temperature: 0.6,
    max_tokens: 16000,
    // CRITICAL: Low reasoning effort prevents token exhaustion in internal reasoning loops
    reasoning: { effort: "low" },
  } as any);

  const choice = response.choices?.[0];
  const rawContent = choice?.message?.content;

  if (!rawContent || typeof rawContent !== "string") {
    // Check if the response was cut off inside reasoning
    if (choice?.message?.reasoning) {
      throw new Error(
        "استنفذ النموذج كل التوكنز في التفكير الداخلي. يرجى إعادة المحاولة مع برومبت أقصر."
      );
    }
    throw new Error("لم يُرجع نموذج Space Bunny أي محتوى صالح.");
  }

  phaseLogs.push("🎨 معالجة وضبط الكود المستلم من Space Bunny...");
  let htmlCode = cleanSpaceBunnyOutput(rawContent);

  // Guarantee Universal Studio Bridge for seamless preview and video render
  htmlCode = injectStudioBridge(htmlCode, duration);

  const titleMatch = htmlCode.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : `${prompt.slice(0, 30)} (Space Bunny)`;

  phaseLogs.push(`✨ تم بنجاح إنتاج الفيلم عبر Space Bunny Alpha: "${title}" (${htmlCode.length} حرف)!`);
  console.log(`[SpaceBunnyEngine] Successfully generated film: "${title}" (${htmlCode.length} chars)`);

  return {
    html: htmlCode,
    title,
    phaseLogs,
  };
}
