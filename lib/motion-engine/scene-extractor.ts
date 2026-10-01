/**
 * Scene Extractor
 * Extracts scenes, visual texts, and time boundaries from generated Motion HTML films
 * without needing to modify or alter the visual generation engine.
 */

export interface ExtractedScene {
  sceneIndex: number;
  kicker: string;
  headline: string;
  sub: string;
  fullTextSummary: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  suggestedMaxWords: number;
}

export function extractScenesFromHtml(
  htmlContent: string,
  totalDurationSeconds: number = 30
): ExtractedScene[] {
  if (!htmlContent || typeof htmlContent !== "string") {
    return [];
  }

  // 1. Try to check if script defines an explicit scenes array
  let scriptSceneBounds: Array<{ start: number; end: number }> = [];
  const scriptMatch =
    htmlContent.match(/(?:const|let|var)\s+scenes\s*=\s*(\[\s*\{[\s\S]*?\}\s*\])/i) ||
    htmlContent.match(/__filmScenes\s*=\s*(\[\s*\{[\s\S]*?\}\s*\])/i);

  if (scriptMatch) {
    try {
      const parsed = JSON.parse(
        scriptMatch[1].replace(/(\w+)\s*:/g, '"$1":').replace(/'/g, '"')
      );
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].start === "number") {
        scriptSceneBounds = parsed.map((s: any) => ({
          start: s.start ?? s.startTime ?? 0,
          end: s.end ?? s.endTime ?? 0,
        }));
      }
    } catch (_) {}
  }

  // 2. Extract scene DOM elements (<section class="scene"> or <div class="scene">)
  const sceneRegex =
    /<(?:section|div)[^>]*class=["']([^"']*\bscene\b[^"']*)["'][^>]*>([\s\S]*?)<\/(?:section|div)>/gi;
  let match: RegExpExecArray | null;
  const rawScenes: Array<{
    kicker: string;
    headline: string;
    sub: string;
    plainText: string;
  }> = [];

  while ((match = sceneRegex.exec(htmlContent)) !== null) {
    const inner = match[2];

    let kicker = "";
    let headline = "";
    let sub = "";

    // Search for headings, kickers, subs
    const tagRegex =
      /<(?:h[1-6]|p|span|div)[^>]*class=["']([^"']*?)["'][^>]*>([\s\S]*?)<\/(?:h[1-6]|p|span|div)>/gi;
    let tagMatch: RegExpExecArray | null;

    while ((tagMatch = tagRegex.exec(inner)) !== null) {
      const cls = tagMatch[1].toLowerCase();
      // Clean inner text of HTML tags
      const text = tagMatch[2].replace(/<[^>]+>/g, " ").trim();
      if (!text || text.length > 200) continue;

      if (cls.includes("kicker") && !kicker) {
        kicker = text;
      } else if ((cls.includes("headline") || cls.includes("title")) && !headline) {
        headline = text;
      } else if ((cls.includes("sub") || cls.includes("desc")) && !sub) {
        sub = text;
      }
    }

    // Strip scripts, styles, svgs for a clean textual fallback
    const plainText = inner
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!headline && plainText) {
      // Pick first sentence/line as headline
      headline = plainText.split(/[.\n]/)[0].trim().slice(0, 70);
    }

    rawScenes.push({
      kicker,
      headline: headline || "مشهد متحرك",
      sub,
      plainText: plainText.slice(0, 180),
    });
  }

  // Fallback: If no .scene elements were found, divide total duration into 4 logical scenes
  if (rawScenes.length === 0) {
    const fallbackCount = Math.max(3, Math.min(6, Math.round(totalDurationSeconds / 6)));
    for (let i = 0; i < fallbackCount; i++) {
      rawScenes.push({
        kicker: `المشهد ${i + 1}`,
        headline: `لقطة سينمائية ${i + 1}`,
        sub: "",
        plainText: `مشهد رقم ${i + 1} من الفيلم`,
      });
    }
  }

  const count = rawScenes.length;
  const uniformDuration = parseFloat((totalDurationSeconds / count).toFixed(2));

  return rawScenes.map((s, i) => {
    let startTime = parseFloat((i * uniformDuration).toFixed(2));
    let endTime = parseFloat(((i + 1) * uniformDuration).toFixed(2));

    if (scriptSceneBounds[i]) {
      startTime = scriptSceneBounds[i].start;
      endTime = scriptSceneBounds[i].end;
    }

    const durationSeconds = Math.max(1.5, parseFloat((endTime - startTime).toFixed(2)));
    // Natural Arabic speaking rate: ~2.5 to 3 words per second.
    // We aim for 75-80% duration coverage to allow breathing room and music.
    const suggestedMaxWords = Math.max(5, Math.floor(durationSeconds * 2.5));

    return {
      sceneIndex: i,
      kicker: s.kicker,
      headline: s.headline,
      sub: s.sub,
      fullTextSummary: s.plainText,
      startTime,
      endTime,
      durationSeconds,
      suggestedMaxWords,
    };
  });
}
