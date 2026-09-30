import "server-only";
import {NextResponse} from "next/server";
import {z} from "zod";
import {AssetSchema, HexColor, ProjectSchema, totalFrames, type VideoProject} from "@/lib/schema";
import {createLocalProject} from "@/lib/local-planner";
import {cookies} from "next/headers";
import {sendOpenRouterRequest, extractJsonFromResponse} from "@/lib/openrouter/client";
import {OPENROUTER_SYSTEM_PROMPT} from "@/lib/openrouter/prompts";
import {prepareVisionMessages} from "@/lib/media/analyze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BrandColorsInput = z.object({
  primaryColor: HexColor.optional(),
  secondaryColor: HexColor.optional(),
  accentColor: HexColor.optional()
}).optional();

const Input = z.object({
  prompt: z.string().min(4).max(5000),
  language: z.enum(["ar", "en"]),
  duration: z.number().int().min(10).max(120),
  assets: z.array(AssetSchema),
  brandColors: BrandColorsInput,
  requestedScreenTypes: z.array(z.string()).optional(),
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
    if ((scene as any).foregroundAssetId && !validAssets.has((scene as any).foregroundAssetId)) {
      (scene as any).foregroundAssetId = undefined;
    }
  }
  if (project.brand.logoAssetId && !validAssets.has(project.brand.logoAssetId)) {
    project.brand.logoAssetId = undefined;
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
      finalProject = createLocalProject({
        prompt: input.prompt,
        language: input.language,
        duration: input.duration,
        assets: input.assets,
        brandColors: input.brandColors,
        requestedScreenTypes: input.requestedScreenTypes
      });
    } else {
      try {
        const fallback = createLocalProject({
          prompt: input.prompt,
          language: input.language,
          duration: input.duration,
          assets: input.assets,
          brandColors: input.brandColors,
          requestedScreenTypes: input.requestedScreenTypes
        });
        
        // Prepare Context with Brand Colors and Requested Screen Templates
        const projectContext = {
          userRequest: input.prompt,
          language: input.language,
          targetDurationSeconds: input.duration,
          fps: 30,
          width: 1080,
          height: 1920,
          brandColors: {
            primaryColor: input.brandColors?.primaryColor || fallback.brand.primaryColor,
            secondaryColor: input.brandColors?.secondaryColor || fallback.brand.secondaryColor,
            accentColor: input.brandColors?.accentColor || fallback.brand.accentColor
          },
          requestedScreenTypes: input.requestedScreenTypes || [],
          assets: input.assets.map(a => ({
            assetId: a.id,
            type: a.type,
            name: a.name,
            description: a.description
          }))
        };

        const screenDirective = input.requestedScreenTypes && input.requestedScreenTypes.length > 0
          ? `\n\nEXPLICIT SCREEN SEQUENCE DIRECTIVE:\nThe user has deliberately selected the exact sequence of ${input.requestedScreenTypes.length} screen templates: ${JSON.stringify(input.requestedScreenTypes)}. You MUST generate exactly ${input.requestedScreenTypes.length} scenes matching these exact template types in this exact sequence!`
          : '';

        const userPromptText = `PROJECT_CONTEXT:\n${JSON.stringify(projectContext, null, 2)}\n\nUSER_CREATIVE_REQUEST:\n${input.prompt}${screenDirective}`;

        let userMessageContent: any;
        if (visionEnabled && input.assets.some(a => a.type === 'image' || a.type === 'logo')) {
          const visionMessages = await prepareVisionMessages(input.assets);
          userMessageContent = [{ type: "text", text: userPromptText }, ...visionMessages];
        } else {
          userMessageContent = userPromptText;
        }

        const payload = {
          model,
          messages: [
            { role: "system" as const, content: OPENROUTER_SYSTEM_PROMPT },
            { role: "user" as const, content: userMessageContent }
          ],
          temperature: 0.7,
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
          brand: {
            ...fallback.brand,
            ...(input.brandColors || {}),
            ...(rawJson.brand || {})
          },
          scenes: (rawJson.scenes && rawJson.scenes.length > 0 ? rawJson.scenes : fallback.scenes).map((s: any, i: number) => {
            const fallbackScene = fallback.scenes[Math.min(i, fallback.scenes.length - 1)];
            const explicitType = input.requestedScreenTypes && input.requestedScreenTypes[i]
              ? input.requestedScreenTypes[i]
              : s.type || fallbackScene.type;

            return {
              ...fallbackScene,
              ...s,
              type: explicitType,
              icon: s.icon || fallbackScene.icon || 'sparkles',
              accent: s.accent || fallbackScene.accent,
              backgroundColor: s.backgroundColor || fallbackScene.backgroundColor,
              textColor: s.textColor || fallbackScene.textColor || '#ffffff',
              iconColor: s.iconColor || s.accent || fallbackScene.iconColor,
              id: crypto.randomUUID()
            };
          })
        };
        
        const validAssets = new Set(input.assets.map(a => a.id));
        cleanAssetIds(generated, validAssets);
        normalizeSceneDurations(generated, input.duration);
        
        finalProject = ProjectSchema.parse(generated);

      } catch (aiError) {
        console.error("OpenRouter Error, falling back to local:", aiError);
        usedFallback = true;
        finalProject = createLocalProject({
          prompt: input.prompt,
          language: input.language,
          duration: input.duration,
          assets: input.assets,
          brandColors: input.brandColors
        });
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
