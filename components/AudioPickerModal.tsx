"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Music,
  UploadCloud,
  Play,
  Pause,
  Check,
  Clock,
  Sparkles,
  AlertCircle,
  Volume2,
} from "lucide-react";

export interface AudioTrack {
  url: string;
  name: string;
  duration?: number;
  size?: number;
}

interface AudioPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAudio: (track: AudioTrack) => void;
  currentAudioTrack?: AudioTrack | null;
}

export function AudioPickerModal({
  isOpen,
  onClose,
  onSelectAudio,
  currentAudioTrack,
}: AudioPickerModalProps) {
  const [recentTracks, setRecentTracks] = useState<AudioTrack[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [playingTrackUrl, setPlayingTrackUrl] = useState<string | null>(null);

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch available recent audio tracks on open
  useEffect(() => {
    if (isOpen) {
      setLoadingList(true);
      fetch("/api/audio/upload")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.audioFiles)) {
            setRecentTracks(data.audioFiles);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingList(false));
    } else {
      // Stop preview audio if closing
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setPlayingTrackUrl(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function formatDuration(sec?: number) {
    if (!sec || isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function formatSize(bytes?: number) {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  function handleTogglePreview(url: string) {
    if (playingTrackUrl === url) {
      audioPreviewRef.current?.pause();
      setPlayingTrackUrl(null);
    } else {
      setPlayingTrackUrl(url);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = url;
        audioPreviewRef.current.play().catch(() => {});
      }
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/audio/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل رفع الملف الصوتي");
      }

      const newTrack: AudioTrack = {
        url: data.url,
        name: data.name,
        duration: data.duration,
        size: data.size,
      };

      onSelectAudio(newTrack);
      onClose();
    } catch (err: any) {
      setUploadError(err.message || "حدث خطأ أثناء رفع الملف");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handlePickRecent(track: AudioTrack) {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setPlayingTrackUrl(null);
    onSelectAudio(track);
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (!isUploading && e.target === e.currentTarget) onClose();
      }}
    >
      {/* Hidden audio element for preview */}
      <audio
        ref={audioPreviewRef}
        onEnded={() => setPlayingTrackUrl(null)}
        style={{ display: "none" }}
      />

      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "88vh",
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(180deg, #0e1112 0%, #060808 100%)",
          border: "1px solid rgba(217, 182, 109, 0.4)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.85), 0 0 35px rgba(217, 182, 109, 0.1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(217, 182, 109, 0.25), rgba(217, 182, 109, 0.05))",
                border: "1px solid var(--gold)",
                display: "grid",
                placeItems: "center",
                color: "var(--gold)",
              }}
            >
              <Music size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
                إضافة مقطع صوتي / تعليق صوتي للفيلم
              </h2>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                يدعم صيغ MP3, WAV, M4A, AAC ويتزامن بدقة مع التايم لاين وتصدير MP4
              </span>
            </div>
          </div>

          {!isUploading && (
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                color: "#888",
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                border: "none",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Upload Zone */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--pale-gold)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <UploadCloud size={14} color="var(--gold)" />
              <span>رفع ملف صوتي جديد من جهازك:</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />

            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              style={{
                padding: "24px 20px",
                borderRadius: "var(--radius-md)",
                border: "2px dashed rgba(217, 182, 109, 0.35)",
                background: "rgba(217, 182, 109, 0.04)",
                textAlign: "center",
                cursor: isUploading ? "wait" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isUploading) e.currentTarget.style.borderColor = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                if (!isUploading) e.currentTarget.style.borderColor = "rgba(217, 182, 109, 0.35)";
              }}
            >
              {isUploading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: "2px solid var(--gold)",
                      borderTopColor: "transparent",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span style={{ fontSize: 13, color: "var(--pale-gold)", fontWeight: 600 }}>
                    جاري رفع وتحليل المقطع الصوتي...
                  </span>
                </div>
              ) : (
                <div>
                  <UploadCloud size={28} color="var(--gold)" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                    انقر لاختيار ملف صوتي أو تعليق صوتي (Voiceover)
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    MP3, WAV, M4A, AAC حتى 50 ميجابايت
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <AlertCircle size={14} />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Recent / Available Tracks */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--pale-gold)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Sparkles size={14} color="var(--gold)" />
              <span>المقاطع والتعليقات الصوتية الجاهزة:</span>
            </label>

            {loadingList ? (
              <div style={{ padding: 20, textAlign: "center", color: "#888", fontSize: 12 }}>
                جاري فحص المقاطع الصوتية...
              </div>
            ) : recentTracks.length === 0 ? (
              <div style={{ padding: "16px", borderRadius: 8, background: "rgba(255,255,255,0.02)", textAlign: "center", color: "#777", fontSize: 11 }}>
                لا توجد مقاطع سابقة. ارفع ملفك الصوتي من الأعلى.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentTracks.map((track, idx) => {
                  const isCurrent = currentAudioTrack?.url === track.url;
                  const isPlaying = playingTrackUrl === track.url;

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--radius-md)",
                        background: isCurrent ? "rgba(217, 182, 109, 0.12)" : "rgba(255, 255, 255, 0.03)",
                        border: isCurrent ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      {/* Left Play preview button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePreview(track.url)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: isPlaying ? "var(--gold)" : "rgba(255, 255, 255, 0.08)",
                          color: isPlaying ? "#18130c" : "#fff",
                          border: "none",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                        title={isPlaying ? "إيقاف المعاينة" : "استماع للمقطع"}
                      >
                        {isPlaying ? <Pause size={14} fill={isPlaying ? "#18130c" : "#fff"} /> : <Play size={14} fill={isPlaying ? "#18130c" : "#fff"} style={{ marginLeft: 2 }} />}
                      </button>

                      {/* Middle track info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {track.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                          {track.duration ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <Clock size={11} /> {formatDuration(track.duration)}
                            </span>
                          ) : null}
                          {track.size ? <span>• {formatSize(track.size)}</span> : null}
                          {isCurrent ? <span style={{ color: "var(--pale-gold)", fontWeight: 600 }}>• محدد حالياً</span> : null}
                        </div>
                      </div>

                      {/* Right: Select button */}
                      <button
                        type="button"
                        onClick={() => handlePickRecent(track)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          background: isCurrent ? "rgba(82, 213, 137, 0.2)" : "rgba(217, 182, 109, 0.15)",
                          border: isCurrent ? "1px solid var(--emerald)" : "1px solid rgba(217, 182, 109, 0.3)",
                          color: isCurrent ? "var(--emerald)" : "var(--pale-gold)",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        {isCurrent ? (
                          <>
                            <Check size={13} />
                            <span>مُعتمد</span>
                          </>
                        ) : (
                          <span>استخدام</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            background: "rgba(0, 0, 0, 0.4)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 255, 255, 0.06)",
              color: "#ccc",
              fontSize: 12,
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
            }}
          >
            إغلاق
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
