"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Video,
  Download,
  Check,
  AlertCircle,
  Film,
  RotateCcw,
  Music,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AudioPickerModal, type AudioTrack } from "./AudioPickerModal";

interface ExportVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  durationSeconds: number;
  htmlCode: string;
  projectId?: string;
  onVideoRendered?: (downloadUrl: string) => void;
  audioTrack?: AudioTrack | null;
  onUpdateAudioTrack?: (track: AudioTrack | null) => void;
}

export function ExportVideoModal({
  isOpen,
  onClose,
  videoTitle,
  durationSeconds,
  htmlCode,
  projectId,
  onVideoRendered,
  audioTrack = null,
  onUpdateAudioTrack,
}: ExportVideoModalProps) {
  const [rendering, setRendering] = useState(false);
  const [finished, setFinished] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [fps, setFps] = useState<number>(30);
  const [motionBlur, setMotionBlur] = useState<boolean>(false);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [hasRenderedWithAudio, setHasRenderedWithAudio] = useState(false);
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const renderedHtmlRef = useRef<string>("");

  // Whenever modal opens or htmlCode changes:
  useEffect(() => {
    if (isOpen) {
      if (renderedHtmlRef.current !== htmlCode) {
        setFinished(false);
        setDownloadUrl(null);
        setFilename("");
        setErrorMessage(null);
        setRendering(false);
        setHasRenderedWithAudio(false);
      }
    }
  }, [isOpen, htmlCode]);

  if (!isOpen) return null;

  function formatDuration(sec?: number) {
    if (!sec || isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  async function handleStartRender() {
    setRendering(true);
    setErrorMessage(null);
    setFinished(false);

    try {
      const activeAudioUrl = includeAudio && audioTrack?.url ? audioTrack.url : undefined;

      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: htmlCode,
          duration: durationSeconds,
          title: videoTitle,
          fps,
          projectId,
          audioUrl: activeAudioUrl,
          motionBlur,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "فشل ريندر الفيديو");
      }

      renderedHtmlRef.current = htmlCode;
      setDownloadUrl(data.downloadUrl);
      setFilename(data.filename);
      setHasRenderedWithAudio(!!data.hasAudio);
      setFinished(true);

      if (onVideoRendered && data.downloadUrl) {
        onVideoRendered(data.downloadUrl);
      }

      // Auto trigger download
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error("[ExportVideoModal] Render failed:", err);
      setErrorMessage(err.message || "حدث خطأ أثناء الريندر والتصدير");
    } finally {
      setRendering(false);
    }
  }

  function handleResetForNewRender() {
    setFinished(false);
    setDownloadUrl(null);
    setFilename("");
    setErrorMessage(null);
    setHasRenderedWithAudio(false);
    renderedHtmlRef.current = "";
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(10px)",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (!rendering && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: 600,
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(180deg, #0e1112 0%, #060808 100%)",
          border: "1px solid rgba(217, 182, 109, 0.4)",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.9)",
          overflow: "hidden",
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
              <Video size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
                تصدير الفيديو السينمائي (MP4 مع الصوت)
              </h2>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                محرك ريندر إطاري دقيق 1080×1920 Full HD مع دمج المسار الصوتي
              </span>
            </div>
          </div>

          {!rendering && (
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
        <div style={{ padding: "22px 24px" }}>
          {/* Film Specs Card */}
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-subtle)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>
                أبعاد الفيديو
              </span>
              <strong style={{ fontSize: 13, color: "var(--pale-gold)" }}>
                1080 × 1920 (9:16)
              </strong>
            </div>

            <div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>
                مدة الفيديو
              </span>
              <strong style={{ fontSize: 13, color: "#fff" }}>
                {durationSeconds} ثانية
              </strong>
            </div>

            <div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>
                عنوان الملف
              </span>
              <strong
                style={{
                  fontSize: 12,
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block",
                }}
                title={videoTitle}
              >
                {videoTitle}
              </strong>
            </div>
          </div>

          {/* Audio Integration Section */}
          {!rendering && !finished && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--pale-gold)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Music size={14} color="var(--gold)" />
                <span>المسار الصوتي المصاحب للفيديو (Audio Track):</span>
              </label>

              {audioTrack ? (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    background: includeAudio ? "rgba(82, 213, 137, 0.08)" : "rgba(255, 255, 255, 0.02)",
                    border: includeAudio ? "1px solid rgba(82, 213, 137, 0.35)" : "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: includeAudio ? "rgba(82, 213, 137, 0.2)" : "rgba(255, 255, 255, 0.06)",
                        color: includeAudio ? "var(--emerald)" : "#888",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Volume2 size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {audioTrack.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        المدة: {formatDuration(audioTrack.duration)} {includeAudio ? "• سيتم دمجه تلقائياً مع الفيديو" : "• تم استثناؤه"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#ddd", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={includeAudio}
                        onChange={(e) => setIncludeAudio(e.target.checked)}
                        style={{ accentColor: "var(--gold)", cursor: "pointer", width: 15, height: 15 }}
                      />
                      <span>تضمين</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsAudioPickerOpen(true)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid var(--border-subtle)",
                        color: "#ccc",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      تغيير
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateAudioTrack && onUpdateAudioTrack(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#888",
                        cursor: "pointer",
                        padding: 4,
                      }}
                      title="إلغاء الصوت"
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px dashed rgba(217, 182, 109, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#bbb", fontSize: 12 }}>
                    <Music size={16} color="var(--gold)" />
                    <span>لا يوجد مقطع صوتي مدمج بعد. يمكنك إضافة تعليق صوتي قبل التصدير.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAudioPickerOpen(true)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      background: "rgba(217, 182, 109, 0.15)",
                      border: "1px solid var(--gold)",
                      color: "var(--pale-gold)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    + إضافة مقطع صوتي
                  </button>
                </div>
              )}
            </div>
          )}

          {/* FPS Selector (when not rendering and not finished) */}
          {!rendering && !finished && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                معدل الإطارات (Frame Rate):
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div
                  onClick={() => setFps(30)}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    border: fps === 30 ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
                    background: fps === 30 ? "rgba(217, 182, 109, 0.1)" : "rgba(255, 255, 255, 0.02)",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <strong style={{ fontSize: 13, color: fps === 30 ? "var(--pale-gold)" : "#fff", display: "block" }}>
                    30 FPS (سريع ومتوازن)
                  </strong>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>تصدير سريع وجودة عالية</span>
                </div>

                <div
                  onClick={() => setFps(60)}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    border: fps === 60 ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
                    background: fps === 60 ? "rgba(217, 182, 109, 0.1)" : "rgba(255, 255, 255, 0.02)",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <strong style={{ fontSize: 13, color: fps === 60 ? "var(--pale-gold)" : "#fff", display: "block" }}>
                    60 FPS (فائق السلاسة)
                  </strong>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>حركة فيزيائية فائقة النعومة</span>
                </div>
              </div>
            </div>
          )}

          {/* Motion Blur (Subframe Blending via FFmpeg tmix) */}
          {!rendering && !finished && (
            <div
              onClick={() => setMotionBlur(!motionBlur)}
              style={{
                marginBottom: 18,
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                background: motionBlur ? "rgba(217, 182, 109, 0.12)" : "rgba(255, 255, 255, 0.02)",
                border: motionBlur ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: motionBlur ? "rgba(217, 182, 109, 0.25)" : "rgba(255, 255, 255, 0.05)",
                    color: motionBlur ? "var(--gold-bright)" : "#888",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Film size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: motionBlur ? "var(--pale-gold)" : "#fff" }}>
                    بلور الحركة السينمائي (Subframe Motion Blur)
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    دمج 4 إطارات فرعية لكل لقطة عبر FFmpeg لإنتاج انسيابية ضبابية واقعية للأجسام السريعة
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: motionBlur ? "2px solid var(--gold)" : "2px solid #555",
                  background: motionBlur ? "var(--gold)" : "transparent",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {motionBlur && <Check size={14} color="#000" strokeWidth={3} />}
              </div>
            </div>
          )}

          {/* Rendering Progress Indicator */}
          {rendering && (
            <div
              style={{
                padding: "24px 20px",
                borderRadius: "var(--radius-md)",
                background: "rgba(217, 182, 109, 0.08)",
                border: "1px solid rgba(217, 182, 109, 0.4)",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: "2px solid var(--gold)",
                    borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <strong style={{ fontSize: 15, color: "var(--pale-gold)" }}>
                  {includeAudio && audioTrack
                    ? "جاري التقاط الإطارات ودمج المقطع الصوتي عبر FFmpeg..."
                    : "جاري تشغيل محرك الريندر واستخراج الإطارات..."}
                </strong>
              </div>

              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                يقوم الخادم بفتح الكود بالمتصفح الخفي بدقة 1080×1920 وتمرير الإطارات والمسار الصوتي مباشرة إلى FFmpeg لتشفير ملف MP4 عالي الجودة.
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#fca5a5",
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Finished State */}
          {finished && downloadUrl && (
            <div
              style={{
                padding: "20px",
                borderRadius: "var(--radius-md)",
                background: "rgba(82, 213, 137, 0.1)",
                border: "1px solid rgba(82, 213, 137, 0.4)",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                <Check size={20} color="var(--emerald)" />
                <strong style={{ fontSize: 15, color: "var(--emerald)" }}>
                  تم ريندر وتصدير الفيديو بنجاح!
                </strong>
              </div>
              <p style={{ fontSize: 12, color: "#ccc", marginBottom: 14 }}>
                {hasRenderedWithAudio
                  ? "تم إنشاء ملف MP4 مدمج بالصوت والصورة بدقة 1080×1920 وبدأ تحميله تلقائياً."
                  : "تم إنشاء ملف MP4 بدقة 1080×1920 وبدأ تحميله تلقائياً."}
              </p>

              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <a
                  href={downloadUrl}
                  download={filename}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 20px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--gold)",
                    color: "#18130c",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <Download size={15} />
                  <span>تحميل ملف MP4 مجدداً</span>
                </a>

                <button
                  type="button"
                  onClick={handleResetForNewRender}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid var(--border-subtle)",
                    color: "#ddd",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                  title="إعادة الريندر بإعدادات جديدة"
                >
                  <RotateCcw size={14} />
                  <span>إعادة ريندر الفيديو</span>
                </button>
              </div>
            </div>
          )}

          {/* Explanation when idle */}
          {!rendering && !finished && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}>
              💡 <strong>ريندر خادم حقيقي (Server Headless Render):</strong>
              <p style={{ margin: 0 }}>
                لا حاجة لمشاركة الشاشة. يقوم الخادم برسم كل إطار بدقة 1080×1920 ودمج الصوت مباشرة عبر FFmpeg في ملف MP4 متكامل جاهز للنشر في تيك توك، ريلز، وشورتس.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.4)",
          }}
        >
          <div>
            {finished && (
              <button
                type="button"
                onClick={handleResetForNewRender}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  color: "var(--pale-gold)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={13} />
                <span>ريندر هذا الفيديو من جديد</span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              disabled={rendering}
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: "var(--radius-md)",
                background: "rgba(255, 255, 255, 0.06)",
                color: "#ccc",
                fontSize: 13,
                cursor: "pointer",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {finished ? "إغلاق" : "إلغاء"}
            </button>

            {!finished && !rendering && (
              <button
                type="button"
                onClick={handleStartRender}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 24px",
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, #d9b66d, #b59247)",
                  color: "#18130c",
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: "0 0 20px rgba(217, 182, 109, 0.35)",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                <Film size={16} />
                <span>بدء ريندر وتصدير MP4</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Audio Picker Modal */}
      <AudioPickerModal
        isOpen={isAudioPickerOpen}
        onClose={() => setIsAudioPickerOpen(false)}
        onSelectAudio={(track) => {
          if (onUpdateAudioTrack) onUpdateAudioTrack(track);
          setIncludeAudio(true);
        }}
        currentAudioTrack={audioTrack}
      />

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
