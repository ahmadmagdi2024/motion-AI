import "server-only";
import { getStyleRaw } from "@/lib/motion-engine/styles-scanner";

export const dynamic = "force-dynamic";

const CLEAN_STORY_OVERRIDE = `
<style id="studio-clean-story-override">
  /* 1. Hide sidebars, duplicate topbars, scene lists, upload buttons */
  .sidebar,
  aside,
  [class*="sidebar"],
  .scenes-list,
  .scene-button,
  .scene-nav,
  .scenes-panel,
  .topbar,
  .upload,
  .brand,
  .brand small {
    display: none !important;
  }

  /* 2. Full viewport reset */
  html, body {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: #060709 !important;
  }

  .app {
    grid-template-columns: 1fr !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .main {
    flex: 1 1 0% !important;
    height: 100% !important;
    min-height: 0 !important;
    padding: 10px 16px 8px 16px !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
  }

  /* 3. Strict 9:16 Portrait Story Stage (Maximized & Centered) */
  .stage-area,
  .stage,
  .player-area {
    flex: 1 1 0% !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  .stage-shell,
  #shell {
    position: relative !important;
    height: 100% !important;
    max-height: calc(100vh - 65px) !important;
    aspect-ratio: 9 / 16 !important;
    width: auto !important;
    max-width: 100% !important;
    margin: 0 auto !important;
    border-radius: 16px !important;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.85) !important;
    overflow: hidden !important;
    display: block !important;
    background: #000 !important;
  }

  #film,
  #film-stage {
    position: absolute !important;
    width: 1080px !important;
    height: 1920px !important;
    left: 50% !important;
    top: 50% !important;
    transform-origin: center center !important;
  }

  /* 4. Sleek compact bottom controls */
  .controls {
    flex: none !important;
    width: 100% !important;
    max-width: 240px !important;
    margin: 0 auto 6px auto !important;
    padding: 4px 10px !important;
    box-sizing: border-box !important;
    border-radius: 20px !important;
    transform: scale(0.85) !important;
    transform-origin: center bottom !important;
  }
  .stage-shell, #shell {
    border-radius: 0 !important;
    box-shadow: none !important;
  }
</style>
<script>
  (function() {
    let ticking = false;
    function safeResize() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        try {
          const shell = document.getElementById("shell") || document.querySelector(".stage-shell");
          const film = document.getElementById("film") || document.getElementById("film-stage");
          if (shell && film && shell.clientHeight > 0) {
            const scale = Math.min(shell.clientWidth / 1080, shell.clientHeight / 1920);
            film.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
          }
        } catch(e) {}
        ticking = false;
      });
    }

    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", safeResize);
    } else {
      safeResize();
    }
    window.addEventListener("load", () => {
      safeResize();
      setTimeout(safeResize, 100);
      setTimeout(safeResize, 300);
    });
    window.addEventListener("resize", safeResize);
  })();
</script>
`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("file");

    if (!filename) {
      return new Response("اسم ملف النمط مطلوب", { status: 400 });
    }

    const html = await getStyleRaw(filename);
    if (!html) {
      return new Response("ملف النمط غير موجود", { status: 404 });
    }

    // Inject clean 9:16 story override
    let cleanedHtml = html;
    if (cleanedHtml.includes("</head>")) {
      cleanedHtml = cleanedHtml.replace("</head>", `${CLEAN_STORY_OVERRIDE}\n</head>`);
    } else {
      cleanedHtml = CLEAN_STORY_OVERRIDE + cleanedHtml;
    }

    return new Response(cleanedHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}
