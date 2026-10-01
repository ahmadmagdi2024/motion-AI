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
} from "lucide-react";
import { AudioPickerModal, type AudioTrack } from "./AudioPickerModal";

interface PlayerViewProps {
  htmlCode: string;
  durationSeconds?: number;
  onOpenGenerator: () => void;
  audioTrack?: AudioTrack | null;
  onUpdateAudioTrack?: (track: AudioTrack | null) => void;
}

export function PlayerView({
  htmlCode,
  durationSeconds = 60,
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
  const [language, setLanguage] = useState<"ar" | "en">("ar");

  // Audio specific states
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
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

  function handleLanguageToggle() {
    try {
      const nextLang = language === "ar" ? "en" : "ar";
      const win = iframeRef.current?.contentWindow as any;
      if (win && win.__studioAPI) {
        win.__studioAPI.setLanguage(nextLang);
        setLanguage(nextLang);
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
          <button
            onClick={handleLanguageToggle}
            className="glass"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              color: "#eee",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Globe size={14} color="var(--gold)" />
            <span>{language === "ar" ? "English" : "العربية"}</span>
          </button>

          {/* Attached Audio Pill in Top Bar */}
          {audioTrack && (
            <div
              className="glass"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(82, 213, 137, 0.4)",
                background: "rgba(82, 213, 137, 0.1)",
                color: "var(--emerald)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Music size={13} color="var(--emerald)" />
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
              padding: "7px 10px",
              borderRadius: "var(--radius-md)",
              color: "#ccc",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              cursor: "pointer",
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
          background: "rgba(12, 14, 14, 0.95)",
          borderTop: "1px solid var(--border-subtle)",
          backdropFilter: "blur(14px)",
          zIndex: 30,
        }}
      >
        {/* Play/Pause & Restart */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={handleRestart}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--border-subtle)",
              color: "#ccc",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
            title="إعادة من البداية"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={handleTogglePlay}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--gold)",
              color: "#18130c",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 0 16px rgba(217, 182, 109, 0.4)",
              cursor: "pointer",
            }}
            title={isPlaying ? "إيقاف مؤقت" : "تشغيل الفيلم"}
          >
            {isPlaying ? (
              <Pause size={18} fill="#18130c" />
            ) : (
              <Play size={18} fill="#18130c" style={{ marginLeft: 2 }} />
            )}
          </button>
        </div>

        {/* Timecode */}
        <div
          style={{
            fontFamily: "Montserrat",
            fontSize: 13,
            color: "var(--pale-gold)",
            minWidth: 140,
            direction: "ltr",
          }}
        >
          <strong>{formatTime(currentTime)}</strong>
          <span style={{ color: "var(--text-muted)", margin: "0 6px" }}>/</span>
          <span style={{ color: "var(--text-muted)" }}>{formatTime(durationSeconds)}</span>
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
              accentColor: "var(--gold)",
              cursor: "pointer",
              height: 6,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: 3,
            }}
          />
        </div>

        {/* Audio Track Widget */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {audioTrack ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: "var(--radius-md)",
                background: "rgba(217, 182, 109, 0.12)",
                border: "1px solid rgba(217, 182, 109, 0.35)",
              }}
            >
              {/* Music Icon */}
              <div
                style={{
                  color: isPlaying ? "var(--gold)" : "#888",
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
                  fontWeight: 600,
                  color: "#fff",
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
                  color: isMuted ? "#ef4444" : "var(--pale-gold)",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  padding: 2,
                }}
                title={isMuted ? "إلغاء الكتم" : "كتم الصوت"}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>

              {/* Change track button */}
              <button
                type="button"
                onClick={() => setIsAudioPickerOpen(true)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid var(--border-subtle)",
                  color: "#ddd",
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
                title="تغيير المقطع الصوتي"
              >
                تغيير
              </button>

              {/* Remove audio button */}
              <button
                type="button"
                onClick={() => onUpdateAudioTrack && onUpdateAudioTrack(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  padding: 2,
                }}
                title="إزالة المقطع الصوتي"
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAudioPickerOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                background: "rgba(217, 182, 109, 0.12)",
                border: "1px solid rgba(217, 182, 109, 0.35)",
                color: "var(--pale-gold)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(217, 182, 109, 0.22)";
                e.currentTarget.style.borderColor = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(217, 182, 109, 0.12)";
                e.currentTarget.style.borderColor = "rgba(217, 182, 109, 0.35)";
              }}
            >
              <Music size={14} color="var(--gold)" />
              <span>إضافة مقطع صوتي</span>
            </button>
          )}
        </div>
      </div>

      {/* Audio Picker Modal */}
      <AudioPickerModal
        isOpen={isAudioPickerOpen}
        onClose={() => setIsAudioPickerOpen(false)}
        onSelectAudio={(track) => onUpdateAudioTrack && onUpdateAudioTrack(track)}
        currentAudioTrack={audioTrack}
      />
    </div>
  );
}
