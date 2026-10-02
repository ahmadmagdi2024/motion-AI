import "server-only";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

export interface MotionStyleItem {
  id: string;
  filename: string;
  name: string;
  title: string;
  promptDirectives: string;
  mtime: number;
}

export function getStyleDirectory(): string {
  if (process.env.MOTION_STYLES_DIR && fsSync.existsSync(process.env.MOTION_STYLES_DIR)) {
    return process.env.MOTION_STYLES_DIR;
  }

  const parent = "/Users/ahmad/Desktop/general/صانع الموشن جرافيك";
  if (fsSync.existsSync(parent)) {
    const entries = fsSync.readdirSync(parent);
    for (const e of entries) {
      if (e.normalize("NFC") === "أنماط الرسم" || e.includes("أنماط") || e.includes("أنماط")) {
        return path.join(parent, e);
      }
    }
  }

  return path.join(parent, "أنماط الرسم");
}

export async function scanMotionStyles(): Promise<{
  directory: string;
  exists: boolean;
  styles: MotionStyleItem[];
}> {
  const targetDir = getStyleDirectory();

  if (!fsSync.existsSync(targetDir)) {
    return { directory: targetDir, exists: false, styles: [] };
  }

  try {
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const htmlFiles = entries.filter(
      (e) => e.isFile() && e.name.toLowerCase().endsWith(".html") && !e.name.startsWith(".")
    );

    const styles: MotionStyleItem[] = [];

    for (const file of htmlFiles) {
      const filePath = path.join(targetDir, file.name);
      try {
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, "utf-8");

        const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
        const rawTitle = titleMatch ? titleMatch[1].trim() : file.name.replace(/\.html$/i, "");

        let name = rawTitle;
        let promptDirectives = "";

        const fnameLower = file.name.toLowerCase();

        if (fnameLower.includes("flat") || content.includes("--wine") || content.includes("--clay")) {
          name = "نمط فلات صلب مينيماليست (Flat Solid 2D)";
          promptDirectives = `ARTISTIC VISUAL STYLE: MODERN FLAT SOLID 2D (أسلوب فلات نقي بألوان صلبة)
- COLOR & BACKGROUND CEILING: 60% of scenes MUST use clean, bright, light backgrounds (#ffffff, #f8fafc, light slate, warm ivory) with crisp dark text (#0f172a). Dark scenes capped at 40% max.
- RENDERING TECHNIQUE: Pure solid colors (Solid Fills) with ZERO linear/radial gradients, NO neon glow, NO glassmorphism.
- AESTHETICS: Bold geometric vector silhouettes, clean 2D cutouts, high-contrast typography, and snappy spring pop-in transitions.
- ⛔ STRICT TOPIC ISOLATION: Apply this rendering technique ONLY to the user's requested topic. Do NOT invent unrelated themes.`;
        } else if (fnameLower.includes("مركب") || fnameLower.includes("عاصفة") || content.includes("عاصفة") || fnameLower.includes("boat")) {
          name = "نمط كرتوني توضيحي وديناميكي (Dynamic Cartoon Illustration)";
          promptDirectives = `ARTISTIC VISUAL STYLE: DYNAMIC CARTOON ILLUSTRATION (أسلوب كرتوني توضيحي مرسوم)
- COLOR & BACKGROUND CEILING: 60% of scenes MUST use bright, clean, light backgrounds (crisp ivory, light pastels, clean white) with high-contrast text. Dark scenes capped at 40% max.
- RENDERING TECHNIQUE: Expressive cartoon illustration with distinct stroke outlines (lineWidth: 3-5px, round lineJoin/lineCap), vibrant contrasting fills, and organic dynamic physics curves (elastic bounce, smooth fluid wave oscillations).
- AESTHETICS: Modern friendly character/object illustration, stylized graphic metaphors representing the USER'S subject, and tactile animated micro-movements.
- ⛔ STRICT TOPIC ISOLATION (قانون فصل الموضوع الحاسم): The reference file originally drew a boat to demonstrate water wave physics. YOU MUST NEVER DRAW A BOAT, SHIP, SEA, OR STORM unless the user explicitly requested it! Apply the cartoon stroke and fluid physics ONLY to the user's actual requested subject (e.g. AI platform UI cards, robots, code blocks, documents, people, graphs)!`;
        } else if (fnameLower.includes("عربية") || fnameLower.includes("طريق") || fnameLower.includes("car")) {
          name = "نمط ستوري بورد كرتوني وتتبعي (Storyboard Cartoon & Path Motion)";
          promptDirectives = `ARTISTIC VISUAL STYLE: STORYBOARD CARTOON & PATH MOTION (أسلوب ستوري بورد وحركة مسارات)
- COLOR & BACKGROUND CEILING: 60% of scenes MUST use bright/light backgrounds with dark text, keeping dark scenes to 40% max.
- RENDERING TECHNIQUE: Continuous camera tracking along a smooth motion path (journey progression), expressive 2D cartoon assets, and clean linear transitions.
- AESTHETICS: Step-by-step storyboard narrative showing progress, workflow, and transformation of the user's idea.
- ⛔ STRICT TOPIC ISOLATION (قانون فصل الموضوع الحاسم): The reference file drew a car on a road to demonstrate path motion. YOU MUST NEVER DRAW A CAR OR HIGHWAY unless the user asked for one! Apply the path motion and storyboard progression ONLY to the user's topic (e.g. how a user enters the platform, clicks generate, and receives results)!`;
        } else if (fnameLower.includes("سوشيالورا") || content.includes("سوشيالورا")) {
          name = "نمط تقني وواجهات رقمية (Modern Tech & SaaS UI)";
          promptDirectives = `ARTISTIC VISUAL STYLE: MODERN TECH SAAS (أسلوب تقني وبرمجي حديث)
- COLOR & BACKGROUND CEILING: 60% of scenes MUST use clean, bright tech backgrounds (#f8fafc, pure white, light cyan tint) with dark high-contrast text (#0f172a). Dark scenes capped at 40% max.
- RENDERING TECHNIQUE: Futuristic digital aesthetic, 2.5D isometric floating cards, cyber UI panels, holographic data lines, telemetry indicators, and dot grids.
- AESTHETICS: Modern software product launch, clean sleek typography, subtle ambient glows.
- ⛔ STRICT TOPIC ISOLATION: Apply this tech aesthetic directly to the user's product or service.`;
        } else if (fnameLower.includes("artek") && fnameLower.includes("animated")) {
          name = "نمط سينمائي فاخر (Luxury Cinematic Motion)";
          promptDirectives = `ARTISTIC VISUAL STYLE: LUXURY CINEMATIC MOTION (أسلوب سينمائي غني وفاخر)
- COLOR & BACKGROUND CEILING: 60% of scenes MUST use radiant light/cream/warm ivory backgrounds (#fafaf9, pearl white, light champagne) with dark crisp typography. Dark scenes capped at 40% max.
- RENDERING TECHNIQUE: Rich ambient lighting, smooth depth gradients, volumetric bevels, specular reflections, and soft contact shadows.
- AESTHETICS: High-end luxury brand aesthetic, smooth slow-mo parallax depth, and elegant premium motion.
- ⛔ STRICT TOPIC ISOLATION: The reference file featured perfume bottles. YOU MUST NEVER DRAW PERFUME BOTTLES! Apply this luxury cinematic atmosphere directly to the user's subject!`;
        } else if (fnameLower.includes("تداول") || fnameLower.includes("مقامرة") || fnameLower.includes("trading")) {
          name = "نمط إنفوجرافيك سينمائي عالي التباين (Cinematic Infographic)";
          promptDirectives = `ARTISTIC VISUAL STYLE: CINEMATIC INFOGRAPHIC & ANALYTICS (إنفوجرافيك سينمائي تحليلي)
- COLOR & BACKGROUND CEILING: 60% of scenes MUST use light, clear backgrounds with dark typography. Dark scenes capped at 40% max.
- RENDERING TECHNIQUE: Bold symbolic infographic shapes, animated metric meters, split-screen comparisons, dynamic charts, and dramatic problem vs solution contrast.
- AESTHETICS: High-impact analytical motion design, clear data storytelling, and decisive visual hierarchy.
- ⛔ STRICT TOPIC ISOLATION: Apply this analytical infographic style ONLY to the metrics, benefits, and features of the user's requested topic!`;
        } else {
          name = rawTitle;
          promptDirectives = `ARTISTIC VISUAL STYLE: ${rawTitle}
- Apply ONLY the visual drawing technique, line styles, and color harmonies from this reference.
- 40% DARK CEILING RULE: At least 60% of scenes must feature bright/light backgrounds with dark text, keeping dark scenes to 40% max of the video.
- ⛔ STRICT TOPIC ISOLATION: Never borrow the story, characters, or nouns from the reference file. The subject matter must come 100% from the user's prompt!`;
        }

        styles.push({
          id: Buffer.from(file.name).toString("base64url"),
          filename: file.name,
          name,
          title: rawTitle,
          promptDirectives,
          mtime: stats.mtimeMs,
        });
      } catch (err) {
        console.error(`[StylesScanner] Error reading ${file.name}:`, err);
      }
    }

    // Sort: Flat first, then others
    styles.sort((a, b) => (a.filename.includes("Flat") ? -1 : 1));

    return { directory: targetDir, exists: true, styles };
  } catch (error) {
    console.error("[StylesScanner] Error scanning directory:", error);
    return { directory: targetDir, exists: false, styles: [] };
  }
}

export async function getStyleRaw(filename: string): Promise<string | null> {
  const targetDir = getStyleDirectory();
  const filePath = path.join(targetDir, filename);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}
