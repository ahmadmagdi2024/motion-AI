import "server-only";

import {NextResponse} from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import {bundle} from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import {ProjectSchema} from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const COMPOSITION_ID = "AiVideo";

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    name: "UnknownError",
    message: String(error),
    stack: null,
  };
}

export async function POST(request: Request) {
  const renderId = crypto.randomUUID();

  try {
    const body = await request.json();

    const rawProject =
      body?.project && typeof body.project === "object"
        ? body.project
        : body;

    const parsed = ProjectSchema.safeParse(rawProject);

    if (!parsed.success) {
      console.error(
        "[render] Invalid project:",
        parsed.error.flatten()
      );
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_PROJECT",
          message: "بيانات المشروع غير صالحة.",
          details: parsed.error.flatten(),
        },
        {status: 400}
      );
    }

    const project = parsed.data;

    const rootDirectory = process.cwd();
    const entryPoint = path.join(
      rootDirectory,
      "remotion",
      "index.ts"
    );
    const publicDirectory = path.join(
      rootDirectory,
      "public"
    );
    const rendersDirectory = path.join(
      publicDirectory,
      "renders"
    );

    await fs.access(entryPoint);
    await fs.mkdir(rendersDirectory, {recursive: true});

    const outputFileName = `${renderId}.mp4`;
    const outputLocation = path.join(
      rendersDirectory,
      outputFileName
    );

    console.log("[render] Starting:", {
      renderId,
      entryPoint,
      publicDirectory,
      outputLocation,
      compositionId: COMPOSITION_ID,
    });

    const serveUrl = await bundle({
      entryPoint,
      publicDir: publicDirectory,
      onProgress: (progress) => {
        console.log(
          `[render:${renderId}] Bundling ${Math.round(progress * 100)}%`
        );
      },
    });

    console.log("[render] Bundle created:", serveUrl);

    const composition = await selectComposition({
      serveUrl,
      id: COMPOSITION_ID,
      inputProps: {
        project,
      },
    });

    console.log("[render] Composition selected:", {
      id: composition.id,
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      durationInFrames: composition.durationInFrames,
    });

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation,
      inputProps: {
        project,
      },
      overwrite: true,
      onProgress: ({progress}) => {
        console.log(
          `[render:${renderId}] Rendering ${Math.round(progress * 100)}%`
        );
      },
    });

    await fs.access(outputLocation);

    console.log("[render] Completed:", outputLocation);

    return NextResponse.json({
      ok: true,
      renderId,
      outputUrl: `/renders/${outputFileName}`,
    });
  } catch (error) {
    const details = getErrorDetails(error);
    console.error("[render] Export failed:", details);
    return NextResponse.json(
      {
        ok: false,
        error: "RENDER_FAILED",
        message: details.message,
        details:
          process.env.NODE_ENV === "development"
            ? details
            : undefined,
      },
      {status: 500}
    );
  }
}
