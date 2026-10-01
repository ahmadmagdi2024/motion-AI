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
          name = "نمط فلات (ألوان صلبة بدون تدرجات)";
          promptDirectives = `MANDATORY ARTISTIC STYLE RULE: MODERN FLAT SOLID COLORS (أسلوب فلات بألوان صلبة)
- COLOR FREEDOM & 40% DARK CEILING: Color shades are completely free! Apply the 40% dark ceiling rule: at least 60% of scenes must use bright, clean, light solid backgrounds (such as crisp white, off-white, light slate #f8fafc, warm cream, or pastel tints) with high-contrast dark typography (#0f172a). Dark scenes must not exceed 40% of the video.
- TECHNIQUE RULE: All elements and backgrounds must use PURE SOLID COLORS (Solid Fills).
- STRICT FORBIDDEN: Absolutely NO complex linear/radial gradients, NO neon glows, NO glassy blur, NO ambient spotlights.
- AESTHETICS: Clean geometric silhouettes, bold solid cutouts, high-contrast typography, and crisp flat vector feel.`;
        } else if (fnameLower.includes("سوشيالورا") || content.includes("سوشيالورا")) {
          name = "نمط تقني حديث (سوشيالورا)";
          promptDirectives = `MANDATORY ARTISTIC STYLE RULE: MODERN TECH SAAS (أسلوب تقني وبرمجي حديث)
- COLOR FREEDOM & 40% DARK CEILING: Choose modern high-tech hues suitable for the product. Apply the 40% dark ceiling rule: at least 60% of scenes must use clean, bright tech backgrounds (clean light gray #f8fafc, pure white, or light slate) with dark high-contrast text (#0f172a), with dark scenes capped at 40% max.
- TECHNIQUE RULE: Futuristic digital aesthetic, 2.5D isometric floating cards, cyber panels, holographic data lines, and telemetry indicators.`;
        } else if (fnameLower.includes("artek") && fnameLower.includes("animated")) {
          name = "نمط سينمائي فاخر (عطور أرتيك)";
          promptDirectives = `MANDATORY ARTISTIC STYLE RULE: CINEMATIC MOTION (أسلوب سينمائي غني)
- COLOR FREEDOM & 40% DARK CEILING: Choose colors matching the subject matter. Apply the 40% dark ceiling rule: at least 60% of scenes must use light/bright luxury backgrounds (radiant cream, warm ivory #fafaf9, bright pearl, or light gold tint) with dark crisp typography, and dark scenes capped at 40% max.
- TECHNIQUE RULE: Rich lighting atmosphere, smooth depth gradients, volumetric bevels, specular reflections, and soft contact shadows.`;
        } else {
          name = rawTitle;
          promptDirectives = `MANDATORY ARTISTIC STYLE RULE: ${rawTitle}
- Adopt the artistic style, illustration style, and motion language inspired by this reference film.
- 40% DARK CEILING RULE: At least 60% of scenes must feature bright/light backgrounds with dark text, keeping dark scenes to 40% max of the video.`;
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
