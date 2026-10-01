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
import type { AudioTrack } from "@/components/AudioPickerModal";
import { DEFAULT_MOTION_FILM } from "@/lib/motion-engine/master-template";
import { ProjectTranslation } from "@/lib/db/projects";

export default function StudioPage() {
  const [htmlCode, setHtmlCode] = useState<string>(DEFAULT_MOTION_FILM);
  const [videoTitle, setVideoTitle] = useState<string>("فيلم مصنع أرتيك للعطور (النموذج الأصلي)");
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [durationSeconds, setDurationSeconds] = useState<number>(60);
  const [currentModel, setCurrentModel] = useState<string>("anthropic/claude-3.7-sonnet");
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
        const res = await fetch("/api/projects");
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
              if (projectToLoad.translations) setTranslations(projectToLoad.translations);
              setCurrentLanguage(projectToLoad.currentLanguage || "ar");
              setMasterProjectData({
                htmlCode: projectToLoad.htmlCode,
                title: projectToLoad.title,
                prompt: projectToLoad.prompt || "",
                audioTrack: projectToLoad.audioTrack || null,
              });
              if (projectToLoad.audioTrack) setAudioTrack(projectToLoad.audioTrack);
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
    mode?: "pipeline" | "legacy";
  }) {
    if (data.prompt) setCurrentPrompt(data.prompt);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        model: currentModel,
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
    if (projAny.translations) setTranslations(projAny.translations);
    else setTranslations({});
    setCurrentLanguage(projAny.currentLanguage || "ar");
    setMasterProjectData({
      htmlCode: proj.htmlCode,
      title: proj.title,
      prompt: proj.prompt || "",
      audioTrack: projAny.audioTrack || null,
    });
    if (projAny.audioTrack) setAudioTrack(projAny.audioTrack);
    else setAudioTrack(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("motion_last_active_project_id", proj.id);
    }
  }

  function handleSelectLanguage(langCode: string) {
    if (langCode === "ar" || !translations[langCode]) {
      // Restore original master film
      if (masterProjectData) {
        setHtmlCode(masterProjectData.htmlCode);
        setVideoTitle(masterProjectData.title);
        if (masterProjectData.prompt) setCurrentPrompt(masterProjectData.prompt);
        setAudioTrack(masterProjectData.audioTrack);
      }
      setCurrentLanguage("ar");
      return;
    }

    const tr = translations[langCode];
    if (tr) {
      setHtmlCode(tr.htmlCode);
      setVideoTitle(tr.title);
      setCurrentLanguage(tr.language);
      if (tr.audioTrack) {
        setAudioTrack(tr.audioTrack as any);
      } else {
        setAudioTrack(null);
      }
    }
  }

  function handleTranslationComplete(tr: ProjectTranslation) {
    setTranslations((prev) => ({
      ...prev,
      [tr.language]: tr,
    }));
    // Automatically switch active player to new translation!
    setHtmlCode(tr.htmlCode);
    setVideoTitle(tr.title);
    setCurrentLanguage(tr.language);
    if (tr.audioTrack) {
      setAudioTrack(tr.audioTrack as any);
    }
  }

  function handleStyleSelected(style: MotionStyle) {
    setCurrentStyleId(style.id);
    setCurrentStyleName(style.name.includes("فلات") ? "فلات صلب" : "سينمائي فاخر");
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
        onUpdateAudioTrack={setAudioTrack}
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
