"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Wand2,
  Clock,
  Layers,
  Palette,
  AlertCircle,
  Check,
  Film,
  Eye,
  Info,
} from "lucide-react";

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: {
    prompt: string;
    duration: number;
    brandStyle?: string;
    styleId?: string;
    mode?: "pipeline" | "legacy";
  }) => Promise<void>;
  apiKeyConfigured: boolean;
  onOpenSettings: () => void;
  currentModel: string;
  selectedStyleId?: string;
  onSelectStyleId?: (id: string) => void;
}

const PRESET_IDEAS = [
  {
    title: "سوشيالورا (إدارة السوشيال ميديا بالذكاء الاصطناعي)",
    prompt:
      "فيديو موشن جرافيك إعلاني لمنصة سوشيالورا: الأداة الذكية الأولى لإدارة وجدولة وتحليل وتوليد محتوى السوشيال ميديا للمؤثرين والشركات بالذكاء الاصطناعي، يركز على توفير الوقت ومضاعفة التفاعل وخدمة العملاء الآلية.",
    duration: 60,
  },
  {
    title: "عطور أرتيك الفاخرة",
    prompt:
      "فيديو سينمائي تعريفي بمصنع أرتيك للعطور: منتقى من أفضل الزيوت العطرية، مختبرات جودة متقدمة، خطوط تعبئة آلية، وشهادات عالمية.",
    duration: 60,
  },
  {
    title: "حذاء رياضي ذكي",
    prompt:
      "إعلان حركي لحذاء رياضي مبتكر بتقنية امتصاص الصدمات الهوائية وخفة وزن فائقة وسعر منافس للجري والتمارين اليومية.",
    duration: 45,
  },
  {
    title: "تطبيق بنكي إلكتروني",
    prompt:
      "إعلان تطبيق مصرفي يتيح تحويل الأموال بلحظة، بطاقات رقمية فورية، بدون رسوم خفية، وأمان مصرفي مشفر.",
    duration: 30,
  },
];

export function PromptModal({
  isOpen,
  onClose,
  onGenerate,
  apiKeyConfigured,
  onOpenSettings,
  currentModel,
  selectedStyleId = "flat",
  onSelectStyleId,
}: PromptModalProps) {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(60);
  const [brandStyle, setBrandStyle] = useState("");
  const [activeStyleId, setActiveStyleId] = useState(selectedStyleId);
  const [availableStyles, setAvailableStyles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [generationMode, setGenerationMode] = useState<"pipeline" | "legacy">("legacy");

  // Sync selected style and fetch available styles
  useEffect(() => {
    setActiveStyleId(selectedStyleId);
  }, [selectedStyleId]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/styles")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.styles)) {
            setAvailableStyles(d.styles);
            if (!activeStyleId && d.styles.length > 0) {
              setActiveStyleId(d.styles[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedStyle =
    availableStyles.find((s) => s.id === activeStyleId) ||
    availableStyles[0] ||
    null;

  function handleSelectPreset(preset: (typeof PRESET_IDEAS)[0]) {
    setPrompt(preset.prompt);
    setDuration(preset.duration);
  }

  function handleStylePick(id: string) {
    setActiveStyleId(id);
    if (onSelectStyleId) onSelectStyleId(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    const isPipeline = generationMode === "pipeline";
    setStepMessage(
      isPipeline
        ? "المرحلة 1 من 3: تخطيط المشاهد وتقسيم السيناريو..."
        : "جاري إرسال المتطلبات والأنماط البصرية إلى الذكاء الاصطناعي..."
    );

    try {
      await onGenerate({
        prompt: prompt.trim(),
        duration,
        brandStyle: brandStyle.trim() || undefined,
        styleId: activeStyleId,
        mode: generationMode,
      });
      onClose();
    } catch (err) {
      // Keep modal open to show error
    } finally {
      setLoading(false);
      setStepMessage("");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        display: "grid",
        placeItems: "center",
        padding: "16px 20px",
      }}
      onClick={(e) => {
        if (!loading && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass prompt-modal-container"
        style={{
          width: "95vw",
          maxWidth: 1260,
          height: "90vh",
          maxHeight: 900,
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(180deg, #0d1012 0%, #060809 100%)",
          border: "1px solid rgba(217, 182, 109, 0.35)",
          boxShadow: "0 30px 90px rgba(0, 0, 0, 0.9), 0 0 40px rgba(217, 182, 109, 0.08)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.4)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(217, 182, 109, 0.25), rgba(217, 182, 109, 0.05))",
                border: "1px solid var(--gold)",
                display: "grid",
                placeItems: "center",
                color: "var(--gold)",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                إنشاء فيديو موشن جرافيك سينمائي ذكي
              </h2>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                النموذج النشط: <strong style={{ color: "var(--pale-gold)" }}>{currentModel}</strong>
              </span>
            </div>
          </div>

          {!loading && (
            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                color: "#aaa",
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                border: "1px solid var(--border-subtle)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* 2-Column Responsive Body */}
        <div
          className="prompt-modal-body"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) 390px",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Right Column: Main Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {/* Scrollable Form Content */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {/* API Key Warning */}
              {!apiKeyConfigured && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f59e0b", fontSize: 12 }}>
                    <AlertCircle size={16} />
                    <span>لم يتم ربط مفتاح OpenRouter بعد في صفحة الإعدادات</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: "#f59e0b",
                      color: "#18130c",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    إدخال المفتاح الآن
                  </button>
                </div>
              )}

              {/* Visual Style Selector */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--pale-gold)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Palette size={15} color="var(--gold)" />
                    <span>نمط الرسم والهوية البصرية للفيديو:</span>
                  </label>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Eye size={12} color="var(--gold)" />
                    <span>انقر على النمط لمعاينته مباشرة ◂</span>
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {availableStyles.map((style) => {
                    const isPicked = activeStyleId === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handleStylePick(style.id)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: isPicked ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
                          background: isPicked
                            ? "linear-gradient(135deg, rgba(217, 182, 109, 0.22), rgba(217, 182, 109, 0.08))"
                            : "rgba(255, 255, 255, 0.03)",
                          color: isPicked ? "#ffffff" : "#bbb",
                          fontSize: 12,
                          fontWeight: isPicked ? 700 : 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          boxShadow: isPicked ? "0 0 16px rgba(217, 182, 109, 0.2)" : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>{style.name}</span>
                        {isPicked && <Check size={14} color="var(--gold)" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prompt presets */}
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                  أفكار ومشاريع جاهزة للإلهام:
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {PRESET_IDEAS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid var(--border-subtle)",
                        color: "#ccc",
                        fontSize: 11,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                    >
                      <Wand2 size={12} color="var(--gold)" />
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt input */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "block", marginBottom: 8 }}>
                  فكرة الفيديو والرسالة التسويقية:
                </label>
                <textarea
                  required
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="مثلاً: أريد فيديو ترويجي لمنصة سوشيالورا بالذكاء الاصطناعي، يركز على توفير الوقت ومضاعفة التفاعل وخدمة العملاء الآلية مع انتقال سلس بين فوضى التسويق والحل الذكي..."
                  style={{
                    width: "100%",
                    padding: "14px",
                    fontSize: 13,
                    lineHeight: 1.6,
                    resize: "vertical",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(0, 0, 0, 0.5)",
                    border: "1px solid var(--border-subtle)",
                    color: "#fff",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Duration & Mode Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Duration selector */}
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Clock size={14} color="var(--gold)" />
                    <span>مدة الفيديو:</span>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                    {[15, 30, 45, 60].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDuration(dur)}
                        style={{
                          padding: "10px 0",
                          borderRadius: "var(--radius-md)",
                          border: duration === dur ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
                          background: duration === dur ? "rgba(217, 182, 109, 0.2)" : "rgba(255, 255, 255, 0.03)",
                          color: duration === dur ? "var(--pale-gold)" : "#bbb",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {dur} ثانية
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generation Mode */}
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Layers size={14} color="var(--gold)" />
                    <span>وضع التوليد:</span>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setGenerationMode("legacy")}
                      style={{
                        padding: "8px 6px",
                        borderRadius: "var(--radius-md)",
                        border: generationMode === "legacy" ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
                        background: generationMode === "legacy" ? "rgba(217, 182, 109, 0.2)" : "rgba(255, 255, 255, 0.03)",
                        color: generationMode === "legacy" ? "var(--pale-gold)" : "#888",
                        fontSize: 11,
                        fontWeight: 700,
                        textAlign: "center",
                        cursor: "pointer",
                      }}
                    >
                      ⚡ الدفعة الواحدة (موصى به ✨)
                      <div style={{ fontSize: 9, color: generationMode === "legacy" ? "rgba(255,255,255,0.7)" : "#666", marginTop: 2, fontWeight: 400 }}>
                        أشكال وعناصر ونمط الألوان
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenerationMode("pipeline")}
                      style={{
                        padding: "8px 6px",
                        borderRadius: "var(--radius-md)",
                        border: generationMode === "pipeline" ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
                        background: generationMode === "pipeline" ? "rgba(217, 182, 109, 0.2)" : "rgba(255, 255, 255, 0.03)",
                        color: generationMode === "pipeline" ? "var(--pale-gold)" : "#888",
                        fontSize: 11,
                        fontWeight: 700,
                        textAlign: "center",
                        cursor: "pointer",
                      }}
                    >
                      🧪 تجريبي (مشهد بمشهد)
                      <div style={{ fontSize: 9, color: "#666", marginTop: 2, fontWeight: 400 }}>
                        توليد تدريجي مقسم
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Brand Style custom note */}
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Palette size={14} color="var(--gold)" />
                  <span>ملاحظات إضافية للألوان والهوية (اختياري):</span>
                </label>
                <input
                  type="text"
                  value={brandStyle}
                  onChange={(e) => setBrandStyle(e.target.value)}
                  placeholder="مثلاً: إضافة شعار أو درجات لونية محددة مثل أزرق داكن مع ذهبي أو كلمات مفتاحية معينة..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 12,
                    borderRadius: "var(--radius-md)",
                    background: "rgba(0, 0, 0, 0.5)",
                    border: "1px solid var(--border-subtle)",
                    color: "#fff",
                  }}
                />
              </div>

              {/* Color Diversity & 40% Dark Ceiling Rule Badge */}
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(96, 165, 250, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  color: "#93c5fd",
                }}
              >
                <Sparkles size={14} color="#60a5fa" style={{ flexShrink: 0 }} />
                <span>
                  <strong>قانون التنوع اللوني مفعل:</strong> 60%+ على الأقل من المشاهد بخلفيات فاتحة ومشرقة، والخلفيات الداكنة بحد أقصى 40% لتجنب القتامة.
                </span>
              </div>

              {/* Progress message while loading */}
              {loading && (
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(217, 182, 109, 0.1)",
                    border: "1px solid rgba(217, 182, 109, 0.35)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "2px solid var(--gold)",
                        borderTopColor: "transparent",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--pale-gold)" }}>
                      {stepMessage}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                    يقوم الذكاء الاصطناعي برسم الرسوم المتجهة وكتابة معادلات الحركة المتزامنة... يستغرق ذلك عادة 20-40 ثانية.
                  </p>
                </div>
              )}
            </div>

            {/* Sticky Form Footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 12,
                background: "rgba(0, 0, 0, 0.5)",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                style={{
                  padding: "9px 20px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "#ccc",
                  fontSize: 13,
                  cursor: "pointer",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 28px",
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, #d9b66d, #b59247)",
                  color: "#18130c",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !prompt.trim() ? 0.6 : 1,
                  boxShadow: "0 0 24px rgba(217, 182, 109, 0.35)",
                  border: "none",
                }}
              >
                <Sparkles size={16} />
                <span>{loading ? "جاري الإنتاج..." : "بدء الإنتاج السينمائي"}</span>
              </button>
            </div>
          </form>

          {/* Left Column: Live Style Viewer (عارض النمط المختار) */}
          <div
            className="prompt-modal-preview"
            style={{
              borderRight: "1px solid var(--border-subtle)",
              background: "linear-gradient(180deg, rgba(8, 10, 12, 0.95), rgba(4, 5, 6, 0.98))",
              padding: "18px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              overflowY: "auto",
              gap: 14,
            }}
          >
            {/* Viewer Header */}
            <div style={{ width: "100%", textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: "rgba(217, 182, 109, 0.12)",
                  border: "1px solid rgba(217, 182, 109, 0.3)",
                  color: "var(--pale-gold)",
                  fontSize: 11,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                <Eye size={12} color="var(--gold)" />
                <span>عارض النمط المختار</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 350 }}>
                {selectedStyle?.name || "جاري التحميل..."}
              </div>
            </div>

            {/* 9:16 Video Player Container (Phone Mockup) */}
            <div
              style={{
                width: 260,
                height: 462, // exact 9:16 portrait
                borderRadius: 22,
                overflow: "hidden",
                border: "2px solid rgba(217, 182, 109, 0.35)",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(217, 182, 109, 0.15)",
                background: "#000",
                position: "relative",
                flexShrink: 0,
              }}
            >
              {selectedStyle ? (
                <iframe
                  key={selectedStyle.id}
                  src={`/api/styles/preview?file=${encodeURIComponent(selectedStyle.filename)}`}
                  title={selectedStyle.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    display: "block",
                    background: "#050606",
                  }}
                />
              ) : (
                <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#777", fontSize: 12 }}>
                  جاري تحميل معاينة النمط...
                </div>
              )}
            </div>

            {/* Style Features & Directives */}
            <div
              style={{
                width: "100%",
                maxWidth: 320,
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                fontSize: 11,
                lineHeight: 1.5,
                color: "var(--text-muted)",
                textAlign: "right",
              }}
            >
              <div style={{ color: "var(--pale-gold)", fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <Film size={12} color="var(--gold)" />
                <span>إرشادات الهوية البصرية:</span>
              </div>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                {selectedStyle?.title
                  ? `سيتم توجيه المحرك لإنتاج حركات ورسومات متجهة متناسقة مع روح: "${selectedStyle.title}".`
                  : "يتبنى هذا النمط الهوية الفنية والرسوم المتجهة المستوحاة من هذا العمل المرجعي."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 960px) {
          .prompt-modal-container {
            width: 98vw !important;
            height: auto !important;
            max-height: 94vh !important;
          }
          .prompt-modal-body {
            grid-template-columns: 1fr !important;
          }
          .prompt-modal-preview {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
