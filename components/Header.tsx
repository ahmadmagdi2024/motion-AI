"use client";

import React from "react";
import { Sparkles, Code2, Download, Settings, Video, Cpu, RotateCcw, FolderOpen, Palette } from "lucide-react";

interface HeaderProps {
  apiKeyConfigured: boolean;
  currentModel: string;
  onOpenSettings: () => void;
  onOpenCode: () => void;
  onOpenGenerator: () => void;
  onDownloadHtml: () => void;
  onOpenExportVideo: () => void;
  onResetDefault: () => void;
  onOpenLibrary: () => void;
  onOpenStyles: () => void;
  selectedStyleName?: string;
}

export function Header({
  apiKeyConfigured,
  currentModel,
  onOpenSettings,
  onOpenCode,
  onOpenGenerator,
  onDownloadHtml,
  onOpenExportVideo,
  onResetDefault,
  onOpenLibrary,
  onOpenStyles,
  selectedStyleName,
}: HeaderProps) {
  const modelShortName = currentModel.split("/").pop() || currentModel;

  return (
    <header
      style={{
        height: 70,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(10, 12, 14, 0.98)",
        backdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        gap: 16,
      }}
    >
      {/* Brand Identity - Never Shrink or Collide */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #2e2617 0%, #151817 100%)",
            border: "1px solid var(--gold)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 0 18px rgba(217, 182, 109, 0.3)",
            color: "var(--gold-bright)",
            fontWeight: 900,
            fontSize: 19,
            fontFamily: "Montserrat",
            flexShrink: 0,
          }}
        >
          M3
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", color: "#ffffff" }}>
              MOTION AI <span style={{ color: "var(--gold-bright)" }}>v3</span>
            </strong>
            <span
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 6,
                background: "rgba(217, 182, 109, 0.18)",
                color: "var(--pale-gold)",
                fontWeight: 700,
                border: "1px solid rgba(217, 182, 109, 0.4)",
                letterSpacing: "0.04em",
              }}
            >
              CINEMATIC ENGINE
            </span>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
            استوديو الموشن جرافيك السينمائي بمستوى After Effects
          </span>
        </div>
      </div>

      {/* Action Buttons & Badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "nowrap",
          overflowX: "auto",
          padding: "4px 0",
        }}
      >
        {/* Model status pill */}
        <button
          type="button"
          onClick={onOpenSettings}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          title="تغيير النموذج أو مفتاح OpenRouter"
        >
          <Cpu size={14} color="var(--gold-bright)" />
          <span style={{ direction: "ltr", fontFamily: "Montserrat", fontSize: 11, fontWeight: 700 }}>
            {modelShortName}
          </span>
          {apiKeyConfigured ? (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--emerald)",
                boxShadow: "0 0 8px var(--emerald)",
              }}
              title="مفتاح API نشط ومربوط"
            />
          ) : (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#f59e0b",
                boxShadow: "0 0 8px #f59e0b",
              }}
              title="أدخل مفتاح OpenRouter لتفعيل التوليد"
            />
          )}
        </button>

        {/* Reset Default */}
        <button
          type="button"
          onClick={onResetDefault}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            color: "#e2e8f0",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          title="استعادة فيلم العطور النموذجي"
        >
          <RotateCcw size={14} />
          <span>استعادة الأصلي</span>
        </button>

        {/* Visual Styles Button */}
        <button
          type="button"
          onClick={onOpenStyles}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 13px",
            borderRadius: "var(--radius-md)",
            background: "rgba(217, 182, 109, 0.12)",
            border: "1px solid rgba(217, 182, 109, 0.4)",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          title="اختيار نمط وأسلوب ألوان الرسم والفيديو (سينمائي / فلات صلب)"
        >
          <Palette size={15} color="var(--gold-bright)" />
          <span>النمط: <strong style={{ color: "var(--pale-gold)" }}>{selectedStyleName || "سينمائي"}</strong></span>
        </button>

        {/* Projects Library Button */}
        <button
          type="button"
          onClick={onOpenLibrary}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 14px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          title="مكتبة الفيديوهات والمشاريع المحفوظة"
        >
          <FolderOpen size={15} color="var(--gold-bright)" />
          <span>مكتبة المشاريع</span>
        </button>

        {/* Export Video (MP4) Button - PROMINENT */}
        <button
          type="button"
          onClick={onOpenExportVideo}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 16px",
            borderRadius: "var(--radius-md)",
            background: "rgba(74, 222, 128, 0.12)",
            border: "1px solid rgba(74, 222, 128, 0.45)",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 0 14px rgba(74, 222, 128, 0.2)",
            whiteSpace: "nowrap",
          }}
        >
          <Video size={15} color="var(--emerald)" />
          <span>تصدير فيديو (MP4)</span>
        </button>

        {/* Export HTML */}
        <button
          type="button"
          onClick={onDownloadHtml}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            color: "#e2e8f0",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          title="تحميل كود HTML التفاعلي الكامل"
        >
          <Download size={14} color="var(--gold-bright)" />
          <span>تصدير HTML</span>
        </button>

        {/* Code Editor */}
        <button
          type="button"
          onClick={onOpenCode}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            color: "#e2e8f0",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Code2 size={14} color="var(--gold-bright)" />
          <span>محرر الكود</span>
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          style={{
            width: 38,
            height: 38,
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            display: "grid",
            placeItems: "center",
            color: "#ffffff",
            cursor: "pointer",
            flexShrink: 0,
          }}
          title="الإعدادات ومزود الخدمة"
        >
          <Settings size={17} />
        </button>

        {/* Generate Button - HIGH CONTRAST */}
        <button
          type="button"
          onClick={onOpenGenerator}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 20px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
            color: "#0a0b0d",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            border: "none",
            boxShadow: "0 0 20px rgba(251, 191, 36, 0.4)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <Sparkles size={16} fill="#0a0b0d" />
          <span>توليد بالذكاء الاصطناعي</span>
        </button>
      </div>
    </header>
  );
}
