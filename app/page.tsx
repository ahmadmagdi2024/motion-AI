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

export default function StudioPage() {
  const [htmlCode, setHtmlCode] = useState<string>(DEFAULT_MOTION_FILM);
  const [videoTitle, setVideoTitle] = useState<string>("فيلم مصنع أرتيك للعطور (النموذج الأصلي)");
  const [durationSeconds, setDurationSeconds] = useState<number>(60);
  const [currentModel, setCurrentModel] = useState<string>("anthropic/claude-3.7-sonnet");
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>("artek-perfumes-default");

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

  // Load initial settings and default style on mount
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

    loadSettings();
    loadDefaultStyle();
  }, []);

  async function handleGenerate(data: {
    prompt: string;
    duration: number;
    brandStyle?: string;
    styleId?: string;
    mode?: "pipeline" | "legacy";
  }) {
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
      if (result.projectId) setCurrentProjectId(result.projectId);
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
    if (proj.modelUsed) setCurrentModel(proj.modelUsed);
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
          setCurrentProjectId("artek-perfumes-default");
        }}
      />

      <PlayerView
        htmlCode={htmlCode}
        durationSeconds={durationSeconds}
        videoTitle={videoTitle}
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
