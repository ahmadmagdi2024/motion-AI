import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { sendOpenRouterRequest } from "@/lib/openrouter/client";
import { extractScenesFromHtml } from "@/lib/motion-engine/scene-extractor";
import { saveProjectTranslation, getProjectById } from "@/lib/db/projects";
import { getAudioDuration, stitchSceneAudios } from "@/lib/audio/ffmpeg-utils";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for full translation + TTS pipeline

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      projectId,
      htmlCode,
      targetLanguage = "en",
      targetLanguageName = "English",
      targetDirection = "ltr",
      translateVoiceover = true,
      synthesizeAudio = true,
      sourceVoiceoverScript,
      totalDuration = 30,
      filmTitle = "مشروع موشن جرافيك",
    } = body;

    if (!htmlCode || typeof htmlCode !== "string") {
      return NextResponse.json(
        { error: "كود HTML الأصلي مطلوب لإتمام الترجمة." },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const apiKey =
      cookieStore.get("OPENROUTER_SESSION_KEY")?.value ||
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح OpenRouter API غير متوفر. يرجى ضبطه من الإعدادات." },
        { status: 401 }
      );
    }

    const translationModel =
      cookieStore.get("OPENROUTER_MODEL")?.value ||
      process.env.OPENROUTER_MODEL ||
      "google/gemini-3.8-flash";

    const ttsModel = "fish-audio/s2.1-pro-free:free";

    console.log(`[TranslateAPI] Translating video to ${targetLanguageName} (${targetLanguage})...`);

    // ==========================================
    // STEP 1: Translate Motion Graphics HTML
    // ==========================================
    const isLtr = targetDirection === "ltr" || !["ar", "fa", "ur", "he"].includes(targetLanguage.toLowerCase());

    const htmlTranslationPrompt = `You are a master motion graphics engineer and internationalization (i18n) expert.
Your mission is to translate and localize an entire HTML5 motion graphics film into ${targetLanguageName} (${targetLanguage}).

CRITICAL LOCALIZATION RULES:
1. ACCURATE TRANSLATION:
   - Translate ALL visible user-facing textual content (titles, kickers, subtitles, badge tags, stats labels, descriptions, calls to action) into natural, punchy, cinematic ${targetLanguageName}.
   - Keep headline and subtitle lengths appropriate so they fit nicely within their existing visual layout boxes.

2. DOCUMENT DIRECTION & TYPOGRAPHY:
   - Update <html lang="${targetLanguage}" dir="${isLtr ? "ltr" : "rtl"}">.
   - For LTR languages (like English, French, Spanish, German, etc.):
     - Ensure font-family includes clean modern fonts: Montserrat, Inter, Roboto, sans-serif.
     - Adjust text alignment (e.g. text-align: left or center as fits the design).
   - For RTL languages (like Arabic, Persian, Urdu):
     - Ensure font-family includes Cairo, Amiri, sans-serif.
     - Ensure dir="rtl".

3. STRICT PRESERVATION OF CODE & ANIMATION:
   - DO NOT REMOVE, RENAME, OR ALTER ANY CSS classes (such as .scene, .kicker, .scene-title, .scene-sub, #film-stage, etc.) or IDs.
   - DO NOT ALTER ANY JavaScript timing logic, GSAP timelines, requestAnimationFrame loops, duration calculations, or start/end timestamp attributes.
   - DO NOT alter canvas scripts, SVG coordinate paths, matrix math, or particle loops.
   - Keep all data-* attributes (like data-start, data-end, data-scene) untouched.

4. TITLE:
   - Update the <title> tag inside <head> with the new translated title in ${targetLanguageName}.

5. OUTPUT FORMAT:
   - Output ONLY the complete, raw, valid HTML document starting with <!DOCTYPE html> and ending with </html>.
   - Absolutely NO markdown backticks (no \`\`\`html), no preamble, no commentary.`;

    const htmlResponse = await sendOpenRouterRequest(apiKey, {
      model: translationModel,
      messages: [
        { role: "system", content: htmlTranslationPrompt },
        { role: "user", content: `Here is the HTML motion graphics code to localize:\n\n${htmlCode}` },
      ],
      temperature: 0.4,
      max_tokens: 16000,
    });

    let translatedHtml = htmlResponse.choices?.[0]?.message?.content || "";
    // Clean potential markdown wrappers
    translatedHtml = translatedHtml
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    if (!translatedHtml.includes("<html") || !translatedHtml.includes("</html>")) {
      console.warn("[TranslateAPI] Translated HTML output looks incomplete or malformed.");
    }

    // Extract translated title from <title> tag
    const titleMatch = translatedHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    const translatedTitle = titleMatch ? titleMatch[1].trim() : `${filmTitle} (${targetLanguageName})`;

    // ==========================================
    // STEP 2: Translate Voiceover Narration Script
    // ==========================================
    let translatedVoiceoverScript: Array<{
      sceneIndex: number;
      startTime: number;
      endTime: number;
      durationSeconds: number;
      headline?: string;
      narration: string;
      wordCount?: number;
    }> = [];

    if (translateVoiceover) {
      console.log(`[TranslateAPI] Generating localized voiceover script in ${targetLanguageName}...`);

      // Extract scenes from the newly translated HTML
      const scenes = extractScenesFromHtml(translatedHtml, totalDuration);

      const scriptSystemPrompt = `You are an elite multilingual commercial voiceover copywriter.
Translate or compose the voiceover narration (spoken script) for each scene of this motion graphics video in ${targetLanguageName}.

CRITICAL RULES:
1. For each scene, write an impactful, concise, and cinematic spoken narration sentence in ${targetLanguageName}.
2. STRICT WORD COUNT / PACING LIMIT:
   - Average speaking rate is ~2.5 words per second.
   - For a 6-second scene, maximum word count is 14-16 words.
   - The narration MUST finish comfortably before the scene duration ends.
3. OUTPUT FORMAT:
   - Output ONLY a raw valid JSON array of objects, with NO markdown formatting, no backticks:
   [
     {
       "sceneIndex": 0,
       "narration": "Spoken sentence in ${targetLanguageName}"
     }
   ]`;

      const scriptUserPayload = JSON.stringify({
        filmTitle: translatedTitle,
        targetLanguage: targetLanguageName,
        totalDurationSeconds: totalDuration,
        sourceScenes: scenes.map((s) => ({
          sceneIndex: s.sceneIndex,
          headline: s.headline,
          kicker: s.kicker,
          startTime: s.startTime,
          durationSeconds: s.durationSeconds,
          suggestedMaxWords: isLtr ? Math.round(s.durationSeconds * 2.6) : s.suggestedMaxWords,
        })),
        sourceScript: sourceVoiceoverScript || undefined,
      });

      try {
        const scriptResponse = await sendOpenRouterRequest(apiKey, {
          model: translationModel,
          messages: [
            { role: "system", content: scriptSystemPrompt },
            { role: "user", content: scriptUserPayload },
          ],
          temperature: 0.6,
          max_tokens: 2000,
        });

        const rawScript = scriptResponse.choices?.[0]?.message?.content || "";
        const cleanScript = rawScript
          .replace(/```(?:json)?/gi, "")
          .replace(/```/g, "")
          .trim();

        let parsedScript: Array<{ sceneIndex: number; narration: string }> = [];
        try {
          parsedScript = JSON.parse(cleanScript);
        } catch (_) {
          const s = cleanScript.indexOf("[");
          const e = cleanScript.lastIndexOf("]");
          if (s !== -1 && e > s) {
            parsedScript = JSON.parse(cleanScript.slice(s, e + 1));
          }
        }

        translatedVoiceoverScript = scenes.map((sc) => {
          const matched = parsedScript.find((p) => p.sceneIndex === sc.sceneIndex);
          const narrationText = matched?.narration?.trim() || `${sc.headline}.`;
          return {
            sceneIndex: sc.sceneIndex,
            startTime: sc.startTime,
            endTime: sc.endTime,
            durationSeconds: sc.durationSeconds,
            headline: sc.headline,
            narration: narrationText,
            wordCount: narrationText.split(/\s+/).filter(Boolean).length,
          };
        });
      } catch (err: any) {
        console.error("[TranslateAPI] Script generation error:", err);
      }
    }

    // ==========================================
    // STEP 3: Voiceover Audio Synthesis (TTS)
    // ==========================================
    let localizedAudioTrack: {
      id: string;
      name: string;
      url: string;
      duration: number;
      type: string;
      language: string;
    } | null = null;

    if (synthesizeAudio && translatedVoiceoverScript.length > 0) {
      console.log(`[TranslateAPI] Synthesizing audio via Fish Audio for ${translatedVoiceoverScript.length} scenes in ${targetLanguageName}...`);

      const uploadDir = path.join(process.cwd(), "public", "uploads", "audio");
      await fs.mkdir(uploadDir, { recursive: true });

      const batchId = crypto.randomUUID().slice(0, 8);
      const stitchCandidates: Array<{ path: string; startTime: number }> = [];

      for (const item of translatedVoiceoverScript) {
        const textToSpeak = item.narration.trim();
        if (!textToSpeak) continue;

        try {
          const ttsRes = await fetch("https://openrouter.ai/api/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3005",
              "X-Title": "Motion AI Studio",
            },
            body: JSON.stringify({
              model: ttsModel,
              input: textToSpeak,
              response_format: "mp3",
            }),
          });

          if (ttsRes.ok) {
            const buf = Buffer.from(await ttsRes.arrayBuffer());
            const fileName = `scene_${targetLanguage}_${batchId}_${item.sceneIndex}.mp3`;
            const fullPath = path.join(uploadDir, fileName);
            await fs.writeFile(fullPath, buf);

            stitchCandidates.push({
              path: fullPath,
              startTime: item.startTime,
            });
          } else {
            console.warn(`[TranslateAPI] TTS warning for scene ${item.sceneIndex}:`, ttsRes.status);
          }
        } catch (ttsErr) {
          console.error(`[TranslateAPI] TTS exception for scene ${item.sceneIndex}:`, ttsErr);
        }
      }

      // Stitch master localized audio
      if (stitchCandidates.length > 0) {
        const masterFileName = `voiceover_${targetLanguage}_${batchId}_full.mp3`;
        const masterFullPath = path.join(uploadDir, masterFileName);

        const stitched = await stitchSceneAudios(stitchCandidates, totalDuration, masterFullPath);
        if (stitched) {
          const measuredDuration = await getAudioDuration(masterFullPath);
          localizedAudioTrack = {
            id: `ai_voiceover_${targetLanguage}_${batchId}`,
            name: `تعليق صوتي (${targetLanguageName})`,
            url: `/uploads/audio/${masterFileName}`,
            duration: measuredDuration || totalDuration,
            type: "ai_voiceover",
            language: targetLanguage,
          };
          console.log(`[TranslateAPI] Master localized audio created: ${localizedAudioTrack.url}`);
        }
      }
    }

    // ==========================================
    // STEP 4: Persist Translation to Project
    // ==========================================
    const translationRecord = {
      language: targetLanguage,
      languageName: targetLanguageName,
      title: translatedTitle,
      htmlCode: translatedHtml,
      voiceoverScript: translatedVoiceoverScript,
      audioTrack: localizedAudioTrack,
      translatedAt: new Date().toISOString(),
    };

    if (projectId) {
      await saveProjectTranslation(projectId, translationRecord);
      console.log(`[TranslateAPI] Translation for project ${projectId} (${targetLanguage}) saved to database.`);
    }

    return NextResponse.json({
      success: true,
      translation: translationRecord,
    });
  } catch (error: any) {
    console.error("[TranslateAPI] Top-level error:", error);
    return NextResponse.json(
      { error: error?.message || "حدث خطأ غير متوقع أثناء ترجمة وتوطين الفيديو." },
      { status: 500 }
    );
  }
}
