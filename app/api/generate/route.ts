import "server-only";
import {NextResponse} from "next/server";
import {z} from "zod";
import {AssetSchema, ProjectSchema, totalFrames, type VideoProject} from "@/lib/schema";
import {createLocalProject} from "@/lib/local-planner";
import {cookies} from "next/headers";
import {sendOpenRouterRequest, extractJsonFromResponse} from "@/lib/openrouter/client";
import {OPENROUTER_SYSTEM_PROMPT} from "@/lib/openrouter/prompts";
import {prepareVisionMessages} from "@/lib/media/analyze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Input = z.object({
  prompt: z.string().min(8).max(5000),
  language: z.enum(["ar", "en"]),
  duration: z.number().int().min(10).max(120),
  assets: z.array(AssetSchema),
  forceFallback: z.boolean().optional().default(false)
});

function normalizeSceneDurations(project: VideoProject, targetDurationSeconds: number) {
  const targetFrames = targetDurationSeconds * project.fps;
  let currentFrames = 0;
  
  for (const scene of project.scenes) {
    if (scene.durationInFrames <= 0) scene.durationInFrames = Math.max(1, project.fps);
    currentFrames += scene.durationInFrames;
  }
  
  if (currentFrames !== targetFrames && project.scenes.length > 0) {
    const lastScene = project.scenes[project.scenes.length - 1];
    lastScene.durationInFrames += (targetFrames - currentFrames);
    if (lastScene.durationInFrames < 1) lastScene.durationInFrames = 1;
  }
}

function cleanAssetIds(project: VideoProject, validAssets: Set<string>) {
  for (const scene of project.scenes) {
    if (scene.backgroundAssetId && !validAssets.has(scene.backgroundAssetId)) {
      scene.backgroundAssetId = undefined;
    }
    // Also clean logoAssetId if not present
    if ((scene as any).logoAssetId && !validAssets.has((scene as any).logoAssetId)) {
      (scene as any).logoAssetId = undefined;
    }
  }
}

export async function POST(req: Request) {
  try {
    const input = Input.parse(await req.json());
    
    // Read Settings
    const cookieStore = cookies();
    const apiKey = cookieStore.get("OPENROUTER_SESSION_KEY")?.value || process.env.OPENROUTER_API_KEY;
    const model = cookieStore.get("OPENROUTER_MODEL")?.value || process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
    const visionEnabled = cookieStore.get("OPENROUTER_VISION")?.value === "true";
    
    let usedFallback = false;
    let finalProject: VideoProject;
    
    if (!apiKey || input.forceFallback) {
      usedFallback = true;
      finalProject = createLocalProject(input);
    } else {
      try {
        const fallback = createLocalProject(input);
        
        // Prepare Context
        const projectContext = {
          userRequest: input.prompt,
          language: input.language,
          targetDurationSeconds: input.duration,
          fps: 30,
          width: 1080,
          height: 1920,
          assets: input.assets.map(a => ({
            assetId: a.id,
            type: a.type,
            name: a.name,
            description: a.description
          }))
        };

        const contentParts: any[] = [
          { type: "text", text: `PROJECT_CONTEXT:\n${JSON.stringify(projectContext, null, 2)}\n\nUSER_REQUEST:\n${input.prompt}` }
        ];

        if (visionEnabled) {
          const visionMessages = await prepareVisionMessages(input.assets);
          contentParts.push(...visionMessages);
        }

        const payload = {
          model,
          messages: [
            { role: "system" as const, content: OPENROUTER_SYSTEM_PROMPT },
            { role: "user" as const, content: contentParts }
          ],
          temperature: 0.4,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        };

        const data = await sendOpenRouterRequest(apiKey, payload);
        const rawJson = extractJsonFromResponse(data.choices?.[0]?.message?.content || "{}");
        
        // Merge and validate
        const generated = {
          ...fallback,
          ...rawJson,
          id: fallback.id,
          brief: input.prompt,
          language: input.language,
          direction: input.language === "ar" ? "rtl" : "ltr",
          fps: 30,
          width: 1080,
          height: 1920,
          assets: input.assets,
          brand: { ...fallback.brand, ...(rawJson.brand || {}) },
          scenes: (rawJson.scenes || []).map((s: any, i: number) => ({
            ...fallback.scenes[Math.min(i, fallback.scenes.length - 1)],
            ...s,
            id: crypto.randomUUID()
          }))
        };
        
        const validAssets = new Set(input.assets.map(a => a.id));
        cleanAssetIds(generated, validAssets);
        normalizeSceneDurations(generated, input.duration);
        
        finalProject = ProjectSchema.parse(generated);

      } catch (aiError) {
        console.error("OpenRouter Error, falling back to local:", aiError);
        usedFallback = true;
        finalProject = createLocalProject(input);
      }
    }

    return NextResponse.json({
      ok: true,
      provider: usedFallback ? "local" : "openrouter",
      model: usedFallback ? "local-planner" : model,
      usedFallback,
      project: finalProject,
      warnings: []
    });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "GENERATION_FAILED", message: e?.message || "Generation failed" }, { status: 400 });
  }
}
