"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Globe,
  Music,
  Volume2,
  VolumeX,
  X,
  Mic,
  Sparkles,
  FileText,
  Copy,
  Check,
  ChevronDown,
  Plus,
} from "lucide-react";
import { AudioPickerModal, type AudioTrack } from "./AudioPickerModal";
import { VoiceoverModal } from "./VoiceoverModal";
import { TranslateModal } from "./TranslateModal";
import { getLanguageByCode } from "@/lib/constants/languages";
import { ProjectTranslation } from "@/lib/db/projects";

interface PlayerViewProps {
  projectId?: string;
  htmlCode: string;
  durationSeconds?: number;
  videoTitle?: string;
  videoPrompt?: string;
  currentLanguage?: string;
  translations?: Record<string, ProjectTranslation>;
  onSelectLanguage?: (langCode: string) => void;
  onTranslationComplete?: (translation: ProjectTranslation) => void;
  onOpenGenerator: () => void;
  audioTrack?: AudioTrack | null;
  onUpdateAudioTrack?: (track: AudioTrack | null) => void;
}

export function PlayerView({
  projectId,
  htmlCode,
  durationSeconds = 60,
  videoTitle,
  videoPrompt,
  currentLanguage = "ar",
  translations = {},
  onSelectLanguage,
  onTranslationComplete,
  onOpenGenerator,
  audioTrack = null,
  onUpdateAudioTrack,
}: PlayerViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Audio, Prompt & Translation states
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [isVoiceoverModalOpen, setIsVoiceoverModalOpen] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Format time as mm:ss.ms
  function formatTime(t: number) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  }

  // Periodic state sync with iframe & audio
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const win = iframeRef.current?.contentWindow as any;
        if (win && win.__studioAPI) {
          const t = win.__studioAPI.getTime();
          if (typeof t === "number") {
            setCurrentTime(t);

            // Sync audio playback time
            if (audioRef.current && !audioRef.current.paused) {
              const diff = Math.abs(audioRef.current.currentTime - t);
              if (diff > 0.25) {
                audioRef.current.currentTime = t;
              }
            }
          }

          const p = win.__studioAPI.isPlaying();
          if (typeof p === "boolean") {
            setIsPlaying(p);

            // Sync audio play/pause
            if (audioRef.current) {
              if (p && audioRef.current.paused) {
                audioRef.current.play().catch(() => {});
              } else if (!p && !audioRef.current.paused) {
                audioRef.current.pause();
              }
            }
          }
        }
      } catch (e) {}
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Update volume on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  function handleTogglePlay() {
    try {
      const win = iframeRef.current?.contentWindow as any;
      if (win && win.__studioAPI) {
        win.__studioAPI.toggle();
        const nextPlaying = !isPlaying;
        setIsPlaying(nextPlaying);

        if (audioRef.current) {
          if (nextPlaying) {
            audioRef.current.currentTime = currentTime;
            audioRef.current.play().catch(() => {});
          } else {
            audioRef.current.pause();
          }
        }
      }
    } catch (e) {}
  }

  function handleRestart() {
    try {
      const win = iframeRef.current?.contentWindow as any;
      if (win && win.__studioAPI) {
        win.__studioAPI.renderAtTime(0);
        setCurrentTime(0);

        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          if (isPlaying) {
            audioRef.current.play().catch(() => {});
          }
        }
      }
    } catch (e) {}
  }

  function handleScrub(timeVal: number) {
    try {
      const win = iframeRef.current?.contentWindow as any;
      if (win && win.__studioAPI) {
        win.__studioAPI.stop();
        win.__studioAPI.renderAtTime(timeVal);
        setCurrentTime(timeVal);
        setIsPlaying(false);

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = timeVal;
        }
      }
    } catch (e) {}
  }



  function handleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        height: "calc(100vh - 68px)",
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(circle at 50% 30%, #151817 0%, #070808 60%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hidden Audio Element synced with video */}
      {audioTrack?.url && (
        <audio
          ref={audioRef}
          src={audioTrack.url}
          preload="auto"
          onEnded={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
            }
          }}
        />
      )}

      {/* Top Floating Mini-Bar */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 20,
          right: 20,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {/* Multilingual Selector Pill & Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="glass"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(217, 182, 109, 0.5)",
                background: "rgba(14, 18, 22, 0.92)",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
              }}
              title="تبديل لغة عرض وتشغيل الفيديو"
            >
              <Globe size={14} color="var(--gold-bright)" />
              <span style={{ fontSize: 14 }}>
                {getLanguageByCode(currentLanguage)?.flag || (currentLanguage === "ar" ? "🇸🇦" : "🌐")}
              </span>
              <span>
                {getLanguageByCode(currentLanguage)?.nativeName ||
                  (currentLanguage === "ar" ? "العربية" : currentLanguage)}
              </span>
              {Object.keys(translations || {}).length > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 8,
                    background: "rgba(217, 182, 109, 0.25)",
                    color: "var(--pale-gold)",
                    fontWeight: 800,
                    border: "1px solid rgba(217, 182, 109, 0.4)",
                  }}
                >
                  {Object.keys(translations || {}).length + 1}
                </span>
              )}
              <ChevronDown size={14} color="var(--gold-bright)" />
            </button>

            {/* Dropdown Menu */}
            {isLangDropdownOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 998 }}
                  onClick={() => setIsLangDropdownOpen(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    zIndex: 999,
                    minWidth: 240,
                    background: "#111418",
                    border: "1px solid rgba(217, 182, 109, 0.45)",
                    borderRadius: 12,
                    padding: "8px",
                    boxShadow: "0 20px 45px rgba(0, 0, 0, 0.95)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    direction: "rtl",
                  }}
                >
                  <div style={{ padding: "6px 10px", fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>
                    لغات هذا الفيديو المتوفرة:
                  </div>

                  {/* Master Arabic Option */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectLanguage) onSelectLanguage("ar");
                      setIsLangDropdownOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 12px",
                      borderRadius: 8,
                      background: currentLanguage === "ar" ? "rgba(217, 182, 109, 0.2)" : "rgba(255, 255, 255, 0.03)",
                      color: currentLanguage === "ar" ? "var(--pale-gold)" : "#ffffff",
                      border: currentLanguage === "ar" ? "1px solid rgba(217, 182, 109, 0.4)" : "1px solid transparent",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: "right",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>🇸🇦</span>
                      <span>العربية (النسخة الأصلية)</span>
                    </div>
                    {currentLanguage === "ar" && <Check size={15} color="var(--gold-bright)" />}
                  </button>

                  {/* Other Translated Variants */}
                  {Object.keys(translations || {}).map((k) => {
                    const tr = translations[k];
                    const langObj = getLanguageByCode(k);
                    const isAct = currentLanguage === k;

                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          if (onSelectLanguage) onSelectLanguage(k);
                          setIsLangDropdownOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 12px",
                          borderRadius: 8,
                          background: isAct ? "rgba(217, 182, 109, 0.2)" : "rgba(255, 255, 255, 0.03)",
                          color: isAct ? "var(--pale-gold)" : "#ffffff",
                          border: isAct ? "1px solid rgba(217, 182, 109, 0.4)" : "1px solid transparent",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                          textAlign: "right",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 15 }}>{langObj?.flag || "🌐"}</span>
                          <span>{tr.languageName || langObj?.nativeName || k}</span>
                          {tr.audioTrack && (
                            <span
                              style={{
                                fontSize: 9,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "rgba(74, 222, 128, 0.2)",
                                color: "var(--emerald)",
                                border: "1px solid rgba(74, 222, 128, 0.4)",
                                fontWeight: 800,
                              }}
                            >
                              صوت
                            </span>
                          )}
                        </div>
                        {isAct && <Check size={15} color="var(--gold-bright)" />}
                      </button>
                    );
                  })}

                  <div style={{ height: 1, background: "rgba(255, 255, 255, 0.12)", margin: "4px 0" }} />

                  {/* Action: Translate to New Language */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLangDropdownOpen(false);
                      setIsTranslateModalOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 12px",
                      borderRadius: 8,
                      background: "rgba(217, 182, 109, 0.15)",
                      color: "var(--pale-gold)",
                      border: "1px solid rgba(217, 182, 109, 0.4)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <Plus size={15} />
                    <span>ترجمة إلى لغة جديدة...</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Film Title Badge */}
          {videoTitle && (
            <div
              className="glass"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                background: "rgba(14, 18, 22, 0.92)",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 800,
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
              }}
            >
              <span>{videoTitle}</span>
            </div>
          )}

          {/* View Prompt Button */}
          {videoPrompt && (
            <button
              type="button"
              onClick={() => setShowPromptModal(true)}
              className="glass"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(217, 182, 109, 0.45)",
                background: "rgba(217, 182, 109, 0.15)",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
              }}
              title="عرض ونسخ البرومبت الذي تم إنشاء هذا الفيديو به"
            >
              <FileText size={14} color="var(--gold-bright)" />
              <span>عرض البرومبت</span>
            </button>
          )}

          {/* Attached Audio Pill in Top Bar */}
          {audioTrack && (
            <div
              className="glass"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(74, 222, 128, 0.45)",
                background: "rgba(74, 222, 128, 0.12)",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
              }}
            >
              <Music size={14} color="var(--emerald)" />
              <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {audioTrack.name}
              </span>
            </div>
          )}
        </div>

        <div style={{ pointerEvents: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={handleFullscreen}
            className="glass"
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              background: "rgba(14, 18, 22, 0.92)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
            }}
            title={isFullscreen ? "الخروج من ملء الشاشة" : "عرض بملء الشاشة"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFullscreen ? "تصغير" : "ملء الشاشة"}</span>
          </button>

        </div>
      </div>

      {/* Center Video Frame */}
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          padding: "16px 20px 8px",
          minHeight: 0,
        }}
      >
        <div
          style={{
            height: "min(78vh, 800px)",
            aspectRatio: "9 / 16",
            width: "auto",
            position: "relative",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)",
            background: "#000",
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={htmlCode}
            title="Motion Film Live Preview"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* Bottom Timeline Control Bar */}
      <div
        style={{
          height: 72,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "rgba(10, 12, 14, 0.98)",
          borderTop: "1px solid var(--border-subtle)",
          backdropFilter: "blur(16px)",
          zIndex: 30,
        }}
      >
        {/* Play/Pause & Restart */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={handleRestart}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
            title="إعادة من البداية"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
              color: "#0a0b0d",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 0 18px rgba(251, 191, 36, 0.45)",
              cursor: "pointer",
              border: "none",
            }}
            title={isPlaying ? "إيقاف مؤقت" : "تشغيل الفيلم"}
          >
            {isPlaying ? (
              <Pause size={18} fill="#0a0b0d" />
            ) : (
              <Play size={18} fill="#0a0b0d" style={{ marginLeft: 2 }} />
            )}
          </button>
        </div>

        {/* Timecode */}
        <div
          style={{
            fontFamily: "Montserrat",
            fontSize: 13,
            minWidth: 140,
            direction: "ltr",
          }}
        >
          <strong style={{ color: "#ffffff", fontWeight: 800 }}>{formatTime(currentTime)}</strong>
          <span style={{ color: "var(--text-muted)", margin: "0 6px" }}>/</span>
          <span style={{ color: "var(--pale-gold)", fontWeight: 700 }}>{formatTime(durationSeconds)}</span>
        </div>

        {/* Scrubber Slider */}
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
          <input
            type="range"
            min={0}
            max={durationSeconds}
            step={0.01}
            value={currentTime}
            onChange={(e) => handleScrub(parseFloat(e.target.value))}
            style={{
              width: "100%",
              accentColor: "var(--gold-bright)",
              cursor: "pointer",
              height: 6,
              background: "rgba(255, 255, 255, 0.16)",
              borderRadius: 3,
            }}
          />
        </div>

        {/* Audio & Action Widgets */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {audioTrack ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: "var(--radius-md)",
                background: "rgba(74, 222, 128, 0.12)",
                border: "1px solid rgba(74, 222, 128, 0.45)",
              }}
            >
              {/* Music Icon */}
              <div
                style={{
                  color: "var(--emerald)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Music size={15} />
              </div>

              {/* Track Name */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#ffffff",
                  maxWidth: 140,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={audioTrack.name}
              >
                {audioTrack.name}
              </span>

              {/* Volume / Mute Button */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                style={{
                  background: "none",
                  border: "none",
                  color: isMuted ? "#ef4444" : "var(--gold-bright)",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  padding: 2,
                }}
                title={isMuted ? "إلغاء الكتم" : "كتم الصوت"}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              {/* Change track button */}
              <button
                type="button"
                onClick={() => setIsAudioPickerOpen(true)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 9px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
                title="تغيير المقطع الصوتي"
              >
                تغيير
              </button>

              {/* Translate Video Button */}
              <button
                type="button"
                onClick={() => setIsTranslateModalOpen(true)}
                style={{
                  background: "rgba(59, 130, 246, 0.18)",
                  border: "1px solid rgba(96, 165, 250, 0.45)",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 9px",
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
                title="ترجمة وتوطين الفيديو"
              >
                <Globe size={12} color="#60a5fa" />
                <span>ترجمة</span>
              </button>

              {/* Remove audio button */}
              <button
                type="button"
                onClick={() => onUpdateAudioTrack && onUpdateAudioTrack(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#f87171",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  padding: 2,
                }}
                title="إزالة المقطع الصوتي"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* AI Voiceover Generator Button */}
              <button
                type="button"
                onClick={() => setIsVoiceoverModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 15px",
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, rgba(217, 182, 109, 0.3) 0%, rgba(180, 130, 40, 0.18) 100%)",
                  border: "1px solid rgba(251, 191, 36, 0.55)",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
                  whiteSpace: "nowrap",
                }}
                title="توليد تعليق صوتي ذكي للمشاهد بالذكاء الاصطناعي (Fish Audio)"
              >
                <Mic size={15} color="var(--gold-bright)" />
                <span>توليد تعليق صوتي للمشاهد</span>
              </button>

              {/* Translate Video Button */}
              <button
                type="button"
                onClick={() => setIsTranslateModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(59, 130, 246, 0.16)",
                  border: "1px solid rgba(96, 165, 250, 0.5)",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
                  whiteSpace: "nowrap",
                }}
                title="ترجمة وتوطين نصوص الفيديو والتعليق الصوتي إلى لغات العالم"
              >
                <Globe size={15} color="#60a5fa" />
                <span>ترجمة الفيديو</span>
              </button>

              {/* Manual Audio Picker Button */}
              <button
                type="button"
                onClick={() => setIsAudioPickerOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 13px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                title="اختيار أو رفع ملف صوتي جاهز من جهازك"
              >
                <Music size={14} color="#ffffff" />
                <span>رفع ملف صوتي</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Voiceover Modal */}
      <VoiceoverModal
        isOpen={isVoiceoverModalOpen}
        onClose={() => setIsVoiceoverModalOpen(false)}
        htmlCode={htmlCode}
        durationSeconds={durationSeconds}
        videoTitle={videoTitle || "فيلم موشن جرافيك"}
        onApplyVoiceover={(track) => {
          if (onUpdateAudioTrack) onUpdateAudioTrack(track);
          setIsVoiceoverModalOpen(false);
        }}
      />

      {/* Translate Video Modal */}
      <TranslateModal
        isOpen={isTranslateModalOpen}
        onClose={() => setIsTranslateModalOpen(false)}
        projectId={projectId}
        htmlCode={htmlCode}
        filmTitle={videoTitle}
        durationSeconds={durationSeconds}
        currentLanguage={currentLanguage}
        existingTranslations={translations}
        onTranslationComplete={(tr) => {
          if (onTranslationComplete) {
            onTranslationComplete(tr);
          }
        }}
      />

      {/* Audio Picker Modal */}
      <AudioPickerModal
        isOpen={isAudioPickerOpen}
        onClose={() => setIsAudioPickerOpen(false)}
        onSelectAudio={(track) => onUpdateAudioTrack && onUpdateAudioTrack(track)}
        currentAudioTrack={audioTrack}
      />


      {/* Prompt Details Modal */}
      {showPromptModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            direction: "rtl",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowPromptModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 650,
              background: "#121417",
              border: "1px solid rgba(217, 182, 109, 0.35)",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(217, 182, 109, 0.15)",
                    border: "1px solid rgba(217, 182, 109, 0.3)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--gold)",
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
                    برومبت توليد هذا الفيديو
                  </h3>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{videoTitle}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 10,
                padding: "16px",
                fontSize: 13,
                lineHeight: 1.7,
                color: "#e5e7eb",
                maxHeight: "350px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
              }}
            >
              {videoPrompt}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => {
                  if (videoPrompt) {
                    navigator.clipboard.writeText(videoPrompt);
                    setCopiedPrompt(true);
                    setTimeout(() => setCopiedPrompt(false), 2000);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "rgba(217, 182, 109, 0.15)",
                  border: "1px solid rgba(217, 182, 109, 0.35)",
                  color: "var(--pale-gold)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copiedPrompt ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                <span>{copiedPrompt ? "تم النسخ للحافظة!" : "نسخ البرومبت"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
