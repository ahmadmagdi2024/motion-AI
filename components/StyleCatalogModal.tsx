"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Palette,
  Check,
  Play,
  Sparkles,
} from "lucide-react";

export interface MotionStyle {
  id: string;
  filename: string;
  name: string;
  title: string;
  promptDirectives: string;
  mtime: number;
}

interface StyleCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStyleId: string;
  onSelectStyle: (style: MotionStyle) => void;
  onApplyToStudio?: (htmlCode: string, title: string) => void;
}

export function StyleCatalogModal({
  isOpen,
  onClose,
  selectedStyleId,
  onSelectStyle,
  onApplyToStudio,
}: StyleCatalogModalProps) {
  const [styles, setStyles] = useState<MotionStyle[]>([]);
  const [activePreviewStyle, setActivePreviewStyle] = useState<MotionStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStyles();
    }
  }, [isOpen]);

  async function loadStyles() {
    setLoading(true);
    try {
      const res = await fetch("/api/styles", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.styles)) {
        setStyles(data.styles);
        const current = data.styles.find((s: MotionStyle) => s.id === selectedStyleId) || data.styles[0];
        setActivePreviewStyle(current || null);
      }
    } catch (err) {
      console.error("[StyleCatalog] Failed to load styles:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyToStudio() {
    if (!activePreviewStyle || !onApplyToStudio) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/styles/preview?file=${encodeURIComponent(activePreviewStyle.filename)}`);
      const code = await res.text();
      onApplyToStudio(code, activePreviewStyle.name);
      onSelectStyle(activePreviewStyle);
      onClose();
    } catch {
      alert("فشل تحميل النمط إلى الاستوديو");
    } finally {
      setApplying(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(12px)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          height: "85vh",
          borderRadius: 16,
          background: "#0c0e11",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.9)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Simple Clean Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Palette size={20} color="var(--gold)" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
              أنماط وأساليب الرسم
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#888",
              cursor: "pointer",
              padding: 6,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body: Clean Two Columns */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "300px 1fr", overflow: "hidden" }}>
          {/* Left Column: Style Names Only */}
          <div
            style={{
              borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
              padding: 16,
              gap: 8,
              overflowY: "auto",
            }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 12 }}>
                جاري التحميل...
              </div>
            ) : (
              styles.map((style) => {
                const isSelectedForGen = selectedStyleId === style.id;
                const isCurrentPreview = activePreviewStyle?.id === style.id;

                return (
                  <button
                    key={style.id}
                    onClick={() => {
                      setActivePreviewStyle(style);
                      onSelectStyle(style);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "right",
                      padding: "14px 16px",
                      borderRadius: 10,
                      background: isCurrentPreview
                        ? "rgba(217, 182, 109, 0.15)"
                        : "rgba(255, 255, 255, 0.03)",
                      border: isCurrentPreview
                        ? "1px solid var(--gold)"
                        : "1px solid rgba(255, 255, 255, 0.06)",
                      color: isCurrentPreview ? "var(--pale-gold)" : "#ddd",
                      fontSize: 14,
                      fontWeight: isCurrentPreview ? 700 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{style.name}</span>
                    {isSelectedForGen && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "rgba(82, 213, 137, 0.2)",
                          color: "var(--emerald)",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Check size={12} />
                        المعتمد
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Video Preview Only */}
          <div style={{ display: "flex", flexDirection: "column", background: "#050608", position: "relative" }}>
            {activePreviewStyle ? (
              <>
                {/* Clean Top Bar */}
                <div
                  style={{
                    padding: "10px 20px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {activePreviewStyle.name}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {selectedStyleId !== activePreviewStyle.id && (
                      <button
                        onClick={() => onSelectStyle(activePreviewStyle)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          background: "rgba(217, 182, 109, 0.15)",
                          border: "1px solid var(--gold)",
                          color: "var(--pale-gold)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Sparkles size={13} />
                        <span>اعتماد هذا النمط</span>
                      </button>
                    )}

                    {onApplyToStudio && (
                      <button
                        onClick={handleApplyToStudio}
                        disabled={applying}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          background: "linear-gradient(135deg, #d9b66d, #b59247)",
                          border: "none",
                          color: "#18130c",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Play size={13} />
                        <span>فتح في الاستوديو</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Video / Motion Preview Frame */}
                <div style={{ flex: 1, position: "relative" }}>
                  <iframe
                    key={activePreviewStyle.filename}
                    src={`/api/styles/preview?file=${encodeURIComponent(activePreviewStyle.filename)}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      background: "transparent",
                    }}
                    title={activePreviewStyle.name}
                  />
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
                اختر نمطاً لعرض الفيديو الخاص به
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
