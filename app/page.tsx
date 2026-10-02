"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { PlayerView } from "@/components/PlayerView";
import { SettingsModal } from "@/components/SettingsModal";
import { CodeModal } from "@/components/CodeModal";
import { PromptModal } from "@/components/PromptModal";
import { ExportVideoModal } from "@/components/ExportVideoModal";
import { LibraryModal, LibraryProject } from "@/components/LibraryModal";
import { StyleCatalogModal, MotionStyle } from "@/components/StyleCatalogModal";
import { VisualCritiqueModal } from "@/components/VisualCritiqueModal";
import type { AudioTrack } from "@/components/AudioPickerModal";
import { DEFAULT_MOTION_FILM } from "@/lib/motion-engine/master-template";
import { ProjectTranslation } from "@/lib/db/projects";

export default function StudioPage() {
  const [htmlCode, setHtmlCode] = useState<string>(DEFAULT_MOTION_FILM);
  const [videoTitle, setVideoTitle] = useState<string>("فيلم مصنع أرتيك للعطور (النموذج الأصلي)");
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [durationSeconds, setDurationSeconds] = useState<number>(60);
  const [currentModel, setCurrentModel] = useState<string>("google/gemini-3.8-flash");
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>("artek-perfumes-default");

  // Multilingual translation state
  const [currentLanguage, setCurrentLanguage] = useState<string>("ar");
  const [translations, setTranslations] = useState<Record<string, ProjectTranslation>>({});
  const [masterProjectData, setMasterProjectData] = useState<{
    htmlCode: string;
    title: string;
    prompt: string;
    audioTrack: AudioTrack | null;
  } | null>(null);

  // Visual Style state (Cinematic vs Flat Solid)
  const [currentStyleId, setCurrentStyleId] = useState<string>("");
  const [currentStyleName, setCurrentStyleName] = useState<string>("فلات ألوان صلبة");

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isExportVideoOpen, setIsExportVideoOpen] = useState(false);
  const [isCritiqueOpen, setIsCritiqueOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isStylesOpen, setIsStylesOpen] = useState(false);
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);

  // Load initial settings, default style, and restore last active project on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings/openrouter");
        if (res.ok) {
          const data = await res.json();
          setApiKeyConfigured(data.apiKeyConfigured);
          if (data.model) setCurrentModel(data.model);
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }

    async function loadDefaultStyle() {
      try {
        const res = await fetch("/api/styles");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.styles) && data.styles.length > 0) {
            // Find flat style if available, or first
            const flat = data.styles.find((s: any) => s.filename.toLowerCase().includes("flat"));
            const chosen = flat || data.styles[0];
            setCurrentStyleId(chosen.id);
            setCurrentStyleName(chosen.name.includes("فلات") ? "فلات صلب" : "سينمائي فاخر");
          }
        }
      } catch (e) {}
    }

    async function loadRecentProject() {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const projectsList: any[] = data.projects || (Array.isArray(data) ? data : []);
          if (projectsList.length > 0) {
            const lastActiveId =
              typeof window !== "undefined"
                ? localStorage.getItem("motion_last_active_project_id")
                : null;
            const found = lastActiveId
              ? projectsList.find((p: any) => p.id === lastActiveId)
              : null;
            // Load last active or newest project
            const projectToLoad = found || projectsList[0];

            if (projectToLoad && projectToLoad.htmlCode) {
              setHtmlCode(projectToLoad.htmlCode);
              setVideoTitle(projectToLoad.title);
              setDurationSeconds(projectToLoad.durationSeconds || 30);
              setCurrentProjectId(projectToLoad.id);
              if (projectToLoad.prompt) setCurrentPrompt(projectToLoad.prompt);
              if (projectToLoad.modelUsed) setCurrentModel(projectToLoad.modelUsed);

              // Normalize translations (support object or array)
              const loadedTranslations: Record<string, ProjectTranslation> = {};
              if (projectToLoad.translations) {
                if (Array.isArray(projectToLoad.translations)) {
                  projectToLoad.translations.forEach((tr: any) => {
                    if (tr && tr.language) loadedTranslations[tr.language] = tr;
                  });
                } else if (typeof projectToLoad.translations === "object") {
                  Object.assign(loadedTranslations, projectToLoad.translations);
                }
              }
              setTranslations(loadedTranslations);

              setMasterProjectData({
                htmlCode: projectToLoad.htmlCode,
                title: projectToLoad.title,
                prompt: projectToLoad.prompt || "",
                audioTrack: projectToLoad.audioTrack || null,
              });

              // Always remember last active project
              if (typeof window !== "undefined") {
                localStorage.setItem("motion_last_active_project_id", projectToLoad.id);
              }

              // Check if an active language was saved
              const savedLang =
                typeof window !== "undefined"
                  ? localStorage.getItem(`motion_active_lang_${projectToLoad.id}`) || projectToLoad.currentLanguage
                  : projectToLoad.currentLanguage;

              const activeLang =
                savedLang && savedLang !== "ar" && loadedTranslations[savedLang]
                  ? savedLang
                  : (projectToLoad.currentLanguage && projectToLoad.currentLanguage !== "ar" && loadedTranslations[projectToLoad.currentLanguage]
                      ? projectToLoad.currentLanguage
                      : "ar");

              setCurrentLanguage(activeLang);

              if (activeLang !== "ar" && loadedTranslations[activeLang]) {
                const tr = loadedTranslations[activeLang];
                setHtmlCode(tr.htmlCode);
                setVideoTitle(tr.title);
                let loadedAudio = tr.audioTrack || null;
                if (!loadedAudio && typeof window !== "undefined") {
                  try {
                    const cached = localStorage.getItem(`motion_audio_${projectToLoad.id}_${activeLang}`);
                    if (cached) {
                      loadedAudio = JSON.parse(cached);
                      tr.audioTrack = loadedAudio;
                      // Sync back to database
                      fetch(`/api/projects/${projectToLoad.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          currentLanguage: activeLang,
                          audioTrack: loadedAudio,
                        }),
                      }).catch(() => {});
                    }
                  } catch (_) {}
                }
                setAudioTrack(loadedAudio);
              } else {
                let masterAudio = projectToLoad.audioTrack || null;
                if (!masterAudio && typeof window !== "undefined") {
                  try {
                    const cached = localStorage.getItem(`motion_audio_${projectToLoad.id}_ar`);
                    if (cached) {
                      masterAudio = JSON.parse(cached);
                      fetch(`/api/projects/${projectToLoad.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          currentLanguage: "ar",
                          audioTrack: masterAudio,
                        }),
                      }).catch(() => {});
                    }
                  } catch (_) {}
                }
                setAudioTrack(masterAudio);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to restore recent project:", e);
      }
    }

    loadSettings();
    loadDefaultStyle();
    loadRecentProject();
  }, []);


  async function handleGenerate(data: {
    prompt: string;
    duration: number;
    brandStyle?: string;
    styleId?: string;
    mode?: "pipeline" | "legacy" | "agentic";
    model?: string;
  }) {
    if (data.prompt) setCurrentPrompt(data.prompt);
    const chosenModel = data.model || currentModel;
    if (data.model) setCurrentModel(data.model);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        model: chosenModel,
        styleId: data.styleId || currentStyleId,
        mode: data.mode || "legacy",
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "فشل توليد الفيديو");
    }

    if (result.html) {
      setHtmlCode(result.html);
      setDurationSeconds(result.durationSeconds || data.duration);
      if (result.title) setVideoTitle(result.title);
      if (result.modelUsed) setCurrentModel(result.modelUsed);
      if (result.projectId) {
        setCurrentProjectId(result.projectId);
        if (typeof window !== "undefined") {
          localStorage.setItem("motion_last_active_project_id", result.projectId);
        }
      }
    }
  }

  function handleDownloadHtml() {
    const blob = new Blob([htmlCode], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (videoTitle || "motion-film").replace(/[\/\\?%*:|"<>]/g, "-");
    link.href = url;
    link.download = `${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleSelectProject(proj: LibraryProject) {
    setHtmlCode(proj.htmlCode);
    setDurationSeconds(proj.durationSeconds);
    setVideoTitle(proj.title);
    setCurrentProjectId(proj.id);
    if (proj.prompt) setCurrentPrompt(proj.prompt);
    if (proj.modelUsed) setCurrentModel(proj.modelUsed);

    const projAny = proj as any;
    const loadedTranslations: Record<string, ProjectTranslation> = {};
    if (projAny.translations) {
      if (Array.isArray(projAny.translations)) {
        projAny.translations.forEach((tr: any) => {
          if (tr && tr.language) loadedTranslations[tr.language] = tr;
        });
      } else if (typeof projAny.translations === "object") {
        Object.assign(loadedTranslations, projAny.translations);
      }
    }
    setTranslations(loadedTranslations);

    setMasterProjectData({
      htmlCode: proj.htmlCode,
      title: proj.title,
      prompt: proj.prompt || "",
      audioTrack: projAny.audioTrack || null,
    });

    const savedLang =
      typeof window !== "undefined"
        ? localStorage.getItem(`motion_active_lang_${proj.id}`) || projAny.currentLanguage
        : projAny.currentLanguage;

    const activeLang =
      savedLang && savedLang !== "ar" && loadedTranslations[savedLang]
        ? savedLang
        : (projAny.currentLanguage && projAny.currentLanguage !== "ar" && loadedTranslations[projAny.currentLanguage]
            ? projAny.currentLanguage
            : "ar");

    setCurrentLanguage(activeLang);

    if (activeLang !== "ar" && loadedTranslations[activeLang]) {
      const tr = loadedTranslations[activeLang];
      setHtmlCode(tr.htmlCode);
      setVideoTitle(tr.title);
      let loadedAudio = tr.audioTrack || null;
      if (!loadedAudio && typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`motion_audio_${proj.id}_${activeLang}`);
          if (cached) {
            loadedAudio = JSON.parse(cached);
            tr.audioTrack = loadedAudio;
            fetch(`/api/projects/${proj.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                currentLanguage: activeLang,
                audioTrack: loadedAudio,
              }),
            }).catch(() => {});
          }
        } catch (_) {}
      }
      setAudioTrack(loadedAudio);
    } else {
      let masterAudio = projAny.audioTrack || null;
      if (!masterAudio && typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`motion_audio_${proj.id}_ar`);
          if (cached) {
            masterAudio = JSON.parse(cached);
            fetch(`/api/projects/${proj.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                currentLanguage: "ar",
                audioTrack: masterAudio,
              }),
            }).catch(() => {});
          }
        } catch (_) {}
      }
      setAudioTrack(masterAudio);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("motion_last_active_project_id", proj.id);
      localStorage.setItem(`motion_active_lang_${proj.id}`, activeLang);
    }
  }

  function handleSelectLanguage(langCode: string) {
    if (typeof window !== "undefined" && currentProjectId) {
      localStorage.setItem(`motion_active_lang_${currentProjectId}`, langCode);
      localStorage.setItem("motion_last_active_project_id", currentProjectId);
    }

    if (currentProjectId) {
      fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentLanguage: langCode }),
      }).catch((e) => console.error("Failed to persist language:", e));
    }

    if (langCode === "master" || (!translations[langCode] && langCode === "ar")) {
      // Restore original master film
      if (masterProjectData) {
        setHtmlCode(masterProjectData.htmlCode);
        setVideoTitle(masterProjectData.title);
        if (masterProjectData.prompt) setCurrentPrompt(masterProjectData.prompt);
        let masterAudio = masterProjectData.audioTrack || null;
        if (!masterAudio && typeof window !== "undefined" && currentProjectId) {
          try {
            const cached = localStorage.getItem(`motion_audio_${currentProjectId}_ar`);
            if (cached) masterAudio = JSON.parse(cached);
          } catch (_) {}
        }
        setAudioTrack(masterAudio);
      }
      setCurrentLanguage("ar");
      return;
    }

    const tr = translations[langCode];
    if (tr) {
      setHtmlCode(tr.htmlCode);
      setVideoTitle(tr.title);
      setCurrentLanguage(tr.language);
      let loadedAudio = tr.audioTrack || null;
      if (!loadedAudio && typeof window !== "undefined" && currentProjectId) {
        try {
          const cached = localStorage.getItem(`motion_audio_${currentProjectId}_${langCode}`);
          if (cached) {
            loadedAudio = JSON.parse(cached);
            tr.audioTrack = loadedAudio;
          }
        } catch (_) {}
      }
      setAudioTrack(loadedAudio as any);
    }
  }

  function handleTranslationComplete(tr: ProjectTranslation) {
    const updatedTranslations = {
      ...translations,
      [tr.language]: tr,
    };
    setTranslations(updatedTranslations);

    // Automatically switch active player to new translation!
    setHtmlCode(tr.htmlCode);
    setVideoTitle(tr.title);
    setCurrentLanguage(tr.language);
    setAudioTrack((tr.audioTrack as any) || null);

    if (typeof window !== "undefined" && currentProjectId) {
      localStorage.setItem("motion_last_active_project_id", currentProjectId);
      localStorage.setItem(`motion_active_lang_${currentProjectId}`, tr.language);
      if (tr.audioTrack) {
        try {
          localStorage.setItem(`motion_audio_${currentProjectId}_${tr.language}`, JSON.stringify(tr.audioTrack));
        } catch (_) {}
      }
    }

    // Persist to backend database
    if (currentProjectId) {
      fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentLanguage: tr.language,
          translations: updatedTranslations,
          audioTrack: tr.audioTrack,
        }),
      }).catch((e) => console.error("Failed to persist translation:", e));
    }
  }

  function handleUpdateAudioTrack(track: AudioTrack | null) {
    setAudioTrack(track);

    if (typeof window !== "undefined" && currentProjectId) {
      localStorage.setItem("motion_last_active_project_id", currentProjectId);
      try {
        if (track) {
          localStorage.setItem(`motion_audio_${currentProjectId}_${currentLanguage}`, JSON.stringify(track));
        } else {
          localStorage.removeItem(`motion_audio_${currentProjectId}_${currentLanguage}`);
        }
      } catch (_) {}
    }

    if (currentLanguage !== "ar") {
      const currentTr = translations[currentLanguage] || {
        language: currentLanguage,
        languageName: currentLanguage,
        title: videoTitle,
        htmlCode: htmlCode,
        audioTrack: track || null,
        translatedAt: new Date().toISOString(),
      };
      const updatedTr: ProjectTranslation = {
        ...currentTr,
        audioTrack: track || null,
      };
      const updatedTranslations: Record<string, ProjectTranslation> = {
        ...translations,
        [currentLanguage]: updatedTr,
      };
      setTranslations(updatedTranslations);

      if (currentProjectId) {
        fetch(`/api/projects/${currentProjectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentLanguage,
            audioTrack: track,
            translations: updatedTranslations,
          }),
        }).catch((e) => console.error("Failed to persist audio track:", e));
      }
    } else {
      if (masterProjectData) {
        setMasterProjectData((prev) => (prev ? { ...prev, audioTrack: track } : prev));
      }
      if (currentProjectId) {
        fetch(`/api/projects/${currentProjectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentLanguage: "ar",
            audioTrack: track,
          }),
        }).catch((e) => console.error("Failed to persist master audio track:", e));
      }
    }
  }

  function handleStyleSelected(style: MotionStyle) {
    setCurrentStyleId(style.id);
    setCurrentStyleName(style.name);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        apiKeyConfigured={apiKeyConfigured}
        currentModel={currentModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCode={() => setIsCodeOpen(true)}
        onOpenGenerator={() => setIsPromptOpen(true)}
        onDownloadHtml={handleDownloadHtml}
        onOpenExportVideo={() => setIsExportVideoOpen(true)}
        onOpenCritique={() => setIsCritiqueOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenStyles={() => setIsStylesOpen(true)}
        selectedStyleName={currentStyleName}
        onResetDefault={() => {
          setHtmlCode(DEFAULT_MOTION_FILM);
          setDurationSeconds(60);
          setVideoTitle("فيلم مصنع أرتيك للعطور (النموذج الأصلي)");
          setCurrentPrompt("فيلم سينمائي احترافي لمصنع عطور أرتيك - 6 مشاهد، 60 ثانية، هوية بصرية فاخرة");
          setCurrentProjectId("artek-perfumes-default");
          setCurrentLanguage("ar");
          setTranslations({});
          setMasterProjectData(null);
          setAudioTrack(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("motion_last_active_project_id");
          }
        }}
      />

      <PlayerView
        projectId={currentProjectId}
        htmlCode={htmlCode}
        durationSeconds={durationSeconds}
        videoTitle={videoTitle}
        videoPrompt={currentPrompt}
        currentLanguage={currentLanguage}
        translations={translations}
        onSelectLanguage={handleSelectLanguage}
        onTranslationComplete={handleTranslationComplete}
        onOpenGenerator={() => setIsPromptOpen(true)}
        audioTrack={audioTrack}
        onUpdateAudioTrack={handleUpdateAudioTrack}
      />


      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKeyConfigured={apiKeyConfigured}
        currentModel={currentModel}
        onSettingsSaved={(settings) => {
          setApiKeyConfigured(settings.apiKeyConfigured);
          setCurrentModel(settings.model);
        }}
      />

      <CodeModal
        isOpen={isCodeOpen}
        onClose={() => setIsCodeOpen(false)}
        code={htmlCode}
        onApplyCode={(newCode) => setHtmlCode(newCode)}
        onDownload={handleDownloadHtml}
      />

      <PromptModal
        isOpen={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        onGenerate={handleGenerate}
        apiKeyConfigured={apiKeyConfigured}
        onOpenSettings={() => {
          setIsPromptOpen(false);
          setIsSettingsOpen(true);
        }}
        currentModel={currentModel}
        selectedStyleId={currentStyleId}
        onSelectStyleId={(id) => setCurrentStyleId(id)}
      />

      <ExportVideoModal
        isOpen={isExportVideoOpen}
        onClose={() => setIsExportVideoOpen(false)}
        videoTitle={videoTitle}
        durationSeconds={durationSeconds}
        htmlCode={htmlCode}
        projectId={currentProjectId}
        audioTrack={audioTrack}
        onUpdateAudioTrack={setAudioTrack}
      />

      <VisualCritiqueModal
        isOpen={isCritiqueOpen}
        onClose={() => setIsCritiqueOpen(false)}
        htmlCode={htmlCode}
        durationSeconds={durationSeconds}
        currentModel={currentModel}
        onApplyHealedCode={(newHtml) => {
          setHtmlCode(newHtml);
        }}
      />

      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectProject={handleSelectProject}
        currentProjectId={currentProjectId}
      />

      <StyleCatalogModal
        isOpen={isStylesOpen}
        onClose={() => setIsStylesOpen(false)}
        selectedStyleId={currentStyleId}
        onSelectStyle={handleStyleSelected}
        onApplyToStudio={(newCode, newTitle) => {
          setHtmlCode(newCode);
          setVideoTitle(newTitle);
        }}
      />
    </main>
  );
}
