import "server-only";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

export interface PhysicsMotionItem {
  id: string;
  filename: string;
  title: string;
  description: string;
  mathFunctions: string[];
  scriptSummary: string;
  mtime: number;
}

export const DEFAULT_PHYSICS_DIR =
  process.env.PHYSICS_LIBRARY_DIR ||
  "/Users/ahmad/Desktop/general/صانع الموشن جرافيك/مكتبة حركات فيزيائية مرجعية";

export async function scanPhysicsLibrary(customDir?: string): Promise<{
  directory: string;
  exists: boolean;
  items: PhysicsMotionItem[];
}> {
  const targetDir = customDir || DEFAULT_PHYSICS_DIR;

  if (!fsSync.existsSync(targetDir)) {
    return { directory: targetDir, exists: false, items: [] };
  }

  try {
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const htmlFiles = entries.filter(
      (e) => e.isFile() && e.name.toLowerCase().endsWith(".html") && !e.name.startsWith(".")
    );

    const items: PhysicsMotionItem[] = [];

    for (const file of htmlFiles) {
      const filePath = path.join(targetDir, file.name);
      try {
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, "utf-8");

        const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : file.name.replace(/\.html$/i, "");

        const commentMatches = content.match(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g) || [];
        const arabicComments = commentMatches
          .map((c) => c.replace(/^\/\*+|\*+\/$|^\/\/+/g, "").trim())
          .filter((c) => c.length > 5 && /[\u0600-\u06FF]/.test(c))
          .slice(0, 5)
          .join(" | ");

        const mathFunctions: string[] = [];
        const funcMatches = content.matchAll(
          /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/g
        );
        for (const m of Array.from(funcMatches)) {
          const fnName = m[1] || m[3];
          if (fnName && !mathFunctions.includes(fnName)) {
            mathFunctions.push(fnName);
          }
        }

        const scriptMatch = content.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
        let scriptSummary = "";
        if (scriptMatch) {
          scriptSummary = scriptMatch[1]
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 1200);
        }

        items.push({
          id: Buffer.from(file.name).toString("base64url"),
          filename: file.name,
          title,
          description: arabicComments || "محاكاة فيزيائية حركية متطورة للحركة والمقذوفات والمرونة",
          mathFunctions: mathFunctions.slice(0, 10),
          scriptSummary,
          mtime: stats.mtimeMs,
        });
      } catch (err) {
        console.error(`[PhysicsScanner] Error reading ${file.name}:`, err);
      }
    }

    items.sort((a, b) => b.mtime - a.mtime);

    return { directory: targetDir, exists: true, items };
  } catch (error) {
    console.error("[PhysicsScanner] Failed to scan physics directory:", error);
    return { directory: targetDir, exists: false, items: [] };
  }
}

export async function getPhysicsLibraryPromptContext(): Promise<string> {
  const { items, exists } = await scanPhysicsLibrary();
  if (!exists || items.length === 0) return "";

  let prompt = `\n\nDYNAMIC INTERNAL PHYSICS LIBRARY (AUTONOMOUSLY LOADED FROM USER REPOSITORY):\n`;
  prompt += `The studio is equipped with ${items.length} validated real-time physical simulation models. You MUST actively draw upon and adapt these mathematical equations into your 'renderAtTime(t)' function when relevant:\n\n`;

  items.forEach((item, idx) => {
    prompt += `--- [SIMULATION ${idx + 1}: ${item.title}] ---\n`;
    prompt += `File: "${item.filename}"\n`;
    prompt += `Physics Context: ${item.description}\n`;
    if (item.mathFunctions.length > 0) {
      prompt += `Core Mathematical Functions: ${item.mathFunctions.join(", ")}\n`;
    }
    if (item.scriptSummary) {
      prompt += `Mathematical Logic Reference: ${item.scriptSummary.slice(0, 300)}...\n`;
    }
    prompt += `Usage Guideline: Whenever the scene features fluid droplets, perfumes, papers, floating documents, cables, pendulum swings, or elastic springs, adapt the exact formulas from this simulation.\n\n`;
  });

  return prompt;
}

export async function getPhysicsMotionRaw(filename: string): Promise<string | null> {
  const filePath = path.join(DEFAULT_PHYSICS_DIR, filename);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}
