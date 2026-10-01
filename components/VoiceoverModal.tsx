"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  Sparkles,
  Volume2,
  Check,
  AlertCircle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  X,
  FileText,
  Layers,
  Wand2,
} from "lucide-react";

interface SceneItem {
  sceneIndex: number;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  headline: string;
  narration: string;
  wordCount: number;
  audioUrl?: string;
}

interface VoiceoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlCode: string;
  durationSeconds: number;
  videoTitle: string;
  onApplyVoiceover: (audioTrack: {
    url: string;
    duration: number;
    name: string;
  }) => void;
}

export const VoiceoverModal: React.FC<VoiceoverModalProps> = ({
  isOpen,
  onClose,
  htmlCode,
  durationSeconds,
  videoTitle,
  onApplyVoiceover,
}) => {
  const [scenes, setScenes] = useState<SceneItem[]>([]);
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedVoiceModel, setSelectedVoiceModel] = useState("fish-audio/s2.1-pro-free:free");
  const [masterAudioUrl, setMasterAudioUrl] = useState<string | null>(null);

  // Auto-generate or fetch script when modal opens
  useEffect(() => {
    if (isOpen && htmlCode && scenes.length === 0) {
      handleGenerateScript();
    }
  }, [isOpen, htmlCode]);

  // Clean up audio on unmount or close
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.src = "";
      }
    };
  }, [previewAudio]);

  async function handleGenerateScript() {
    setIsScriptLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/audio/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlCode,
          totalDuration: durationSeconds || 30,
          filmTitle: videoTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل استخراج وتوليد السيناريو الصوتي.");
      }

      setScenes(data.narrations || []);
    } catch (err: any) {
      console.error("[VoiceoverModal] Script generation error:", err);
      setError(err?.message || "حدث خطأ أثناء إعداد نصوص التعليق الصوتي.");
    } finally {
      setIsScriptLoading(false);
    }
  }

  function handleUpdateNarration(index: number, newText: string) {
    const updated = [...scenes];
    const wordCount = newText.trim().split(/\s+/).filter(Boolean).length;
    updated[index] = {
      ...updated[index],
      narration: newText,
      wordCount,
    };
    setScenes(updated);
  }

  async function handleGenerateSpeech() {
    if (scenes.length === 0) return;
    setIsGeneratingTts(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/audio/tts/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: scenes.map((s) => ({
            sceneIndex: s.sceneIndex,
            narration: s.narration,
            startTime: s.startTime,
            durationSeconds: s.durationSeconds,
          })),
          totalDuration: durationSeconds,
          model: selectedVoiceModel,
          stitchMasterTrack: true,
          filmTitle: videoTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل توليد الأصوات عبر Fish Audio.");
      }

      // Update scenes with generated audio urls
      if (Array.isArray(data.scenes)) {
        const merged = scenes.map((s) => {
          const match = data.scenes.find((d: any) => d.sceneIndex === s.sceneIndex);
          return match ? { ...s, audioUrl: match.audioUrl } : s;
        });
        setScenes(merged);
      }

      if (data.masterTrack?.url) {
        setMasterAudioUrl(data.masterTrack.url);
        setSuccessMsg("تم توليد ودمج التعليق الصوتي بنجاح عبر Fish Audio!");

        // Auto apply to player
        onApplyVoiceover({
          url: data.masterTrack.url,
          duration: data.masterTrack.duration || durationSeconds,
          name: `تعليق صوتي ذكي (${videoTitle || "الفيلم"})`,
        });
      }
    } catch (err: any) {
      console.error("[VoiceoverModal] TTS error:", err);
      setError(err?.message || "فشل توليد الصوت.");
    } finally {
      setIsGeneratingTts(false);
    }
  }

  function handlePlayAudioPreview(index: number, url: string) {
    if (previewAudio) {
      previewAudio.pause();
    }

    if (playingAudioIndex === index) {
      setPlayingAudioIndex(null);
      return;
    }

    const audio = new Audio(url);
    setPreviewAudio(audio);
    setPlayingAudioIndex(index);

    audio.play().catch(() => setPlayingAudioIndex(null));
    audio.onended = () => setPlayingAudioIndex(null);
  }

  if (!isOpen) return null;

  return (
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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 820,
          maxHeight: "90vh",
          background: "linear-gradient(180deg, #131518 0%, #0c0d0e 100%)",
          border: "1px solid rgba(217, 182, 109, 0.35)",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(217, 182, 109, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(217, 182, 109, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(217, 182, 109, 0.15)",
                border: "1px solid rgba(217, 182, 109, 0.3)",
                display: "grid",
                placeItems: "center",
                color: "var(--gold)",
              }}
            >
              <Mic size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
                  توليد التعليق الصوتي الذكي لكل مشهد
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "rgba(34, 197, 94, 0.15)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    color: "#4ade80",
                    fontWeight: 600,
                  }}
                >
                  Fish Audio S2.1
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
                استخلاص مشاهد الفيلم وكتابة وتوليد تعليق صوتي سينمائي مدمج إطاراً بإطار
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status / Alert Messages */}
        {error && (
          <div
            style={{
              margin: "14px 24px 0",
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              margin: "14px 24px 0",
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#86efac",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {isScriptLoading ? (
            <div
              style={{
                padding: "60px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "3px solid rgba(217, 182, 109, 0.2)",
                  borderTopColor: "var(--gold)",
                  animation: "spin 1s linear infinite",
                }}
              />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>
                  جاري استخلاص المشاهد وكتابة سيناريو التعليق الصوتي...
                </p>
                <p style={{ fontSize: 13, color: "#9ca3af", margin: "6px 0 0" }}>
                  الذكاء الاصطناعي يطابق كل جملة تعليق مع زمن المشهد لضمان التزامن الكامل.
                </p>
              </div>
            </div>
          ) : scenes.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#9ca3af",
              }}
            >
              <p>لم يتم العثور على مشاهد جاهزة في هذا الفيلم.</p>
              <button
                type="button"
                onClick={handleGenerateScript}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "var(--gold)",
                  color: "#000",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  marginTop: 10,
                }}
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "#9ca3af",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Layers size={15} style={{ color: "var(--gold)" }} />
                  <span>
                    تم استخلاص <b>{scenes.length}</b> مشاهد (المدة الكلية: {durationSeconds} ثانية)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateScript}
                  disabled={isScriptLoading || isGeneratingTts}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--pale-gold)",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={12} />
                  <span>إعادة صياغة السيناريو</span>
                </button>
              </div>

              {/* Scene Cards List */}
              {scenes.map((scene, idx) => (
                <div
                  key={scene.sceneIndex}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: 12,
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Top Bar of Scene */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "rgba(217, 182, 109, 0.2)",
                          color: "var(--pale-gold)",
                        }}
                      >
                        المشهد {idx + 1}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {scene.headline}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Clock size={12} />
                        {scene.startTime}s - {scene.endTime}s ({scene.durationSeconds}ث)
                      </span>

                      {/* Scene Audio Preview Button */}
                      {scene.audioUrl && (
                        <button
                          type="button"
                          onClick={() => handlePlayAudioPreview(idx, scene.audioUrl!)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "rgba(34, 197, 94, 0.15)",
                            border: "1px solid rgba(34, 197, 94, 0.3)",
                            color: "#4ade80",
                            fontSize: 11,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {playingAudioIndex === idx ? <Pause size={11} /> : <Play size={11} />}
                          <span>{playingAudioIndex === idx ? "إيقاف" : "استماع"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Editable Narration Textarea */}
                  <div style={{ position: "relative" }}>
                    <textarea
                      value={scene.narration}
                      onChange={(e) => handleUpdateNarration(idx, e.target.value)}
                      disabled={isGeneratingTts}
                      placeholder="اكتب نص التعليق الصوتي لهذا المشهد..."
                      rows={2}
                      style={{
                        width: "100%",
                        background: "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: 8,
                        padding: "10px 12px",
                        color: "#fff",
                        fontSize: 14,
                        lineHeight: 1.6,
                        fontFamily: "inherit",
                        resize: "vertical",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.12)")}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 4,
                        fontSize: 11,
                        color: scene.wordCount > 16 ? "#ef4444" : "#9ca3af",
                      }}
                    >
                      <span>عدد الكلمات: {scene.wordCount}</span>
                      {scene.wordCount > 16 && (
                        <span>(يُفضل تقليل الكلمات لعدم تجاوز مدة المشهد)</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>نموذج الصوت:</span>
            <span
              style={{
                fontSize: 12,
                color: "var(--pale-gold)",
                fontWeight: 600,
                background: "rgba(217, 182, 109, 0.1)",
                padding: "3px 8px",
                borderRadius: 6,
                border: "1px solid rgba(217, 182, 109, 0.2)",
              }}
            >
              fish-audio/s2.1-pro-free:free
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isGeneratingTts}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#ddd",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleGenerateSpeech}
              disabled={isScriptLoading || isGeneratingTts || scenes.length === 0}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                background:
                  isGeneratingTts || isScriptLoading || scenes.length === 0
                    ? "rgba(217, 182, 109, 0.3)"
                    : "linear-gradient(135deg, #d9b66d 0%, #b89345 100%)",
                border: "none",
                color: "#050606",
                fontSize: 13,
                fontWeight: 700,
                cursor:
                  isGeneratingTts || isScriptLoading || scenes.length === 0
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(217, 182, 109, 0.3)",
              }}
            >
              {isGeneratingTts ? (
                <>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "2px solid #000",
                      borderTopColor: "transparent",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <span>جاري تسجيل الصوت ودمجه...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>توليد ودمج الصوت بالذكاء الاصطناعي</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
