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
        height: 68,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(10, 12, 12, 0.95)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "linear-gradient(135deg, #2b2518, #111312)",
            border: "1px solid var(--gold)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 0 16px rgba(217, 182, 109, 0.25)",
            color: "var(--gold)",
            fontWeight: 800,
            fontSize: 18,
            fontFamily: "Montserrat",
          }}
        >
          M3
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ fontSize: 16, letterSpacing: "-0.01em", color: "#fff" }}>
              MOTION AI <span style={{ color: "var(--gold)" }}>v3</span>
            </strong>
            <span
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 6,
                background: "rgba(217, 182, 109, 0.15)",
                color: "var(--pale-gold)",
                fontWeight: 600,
                border: "1px solid rgba(217, 182, 109, 0.3)",
              }}
            >
              CINEMATIC ENGINE
            </span>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            استوديو الموشن جرافيك السينمائي بمستوى After Effects
          </span>
        </div>
      </div>

      {/* Action Buttons & Badges */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Model status pill */}
        <button
          onClick={onOpenSettings}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-subtle)",
            color: "#ccc",
            fontSize: 12,
          }}
          title="تغيير النموذج أو مفتاح OpenRouter"
        >
          <Cpu size={14} color="var(--gold)" />
          <span style={{ direction: "ltr", fontFamily: "Montserrat", fontSize: 11 }}>
            {modelShortName}
          </span>
          {apiKeyConfigured ? (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--emerald)",
                boxShadow: "0 0 8px var(--emerald)",
              }}
              title="مفتاح API نشط ومربوط"
            />
          ) : (
            <span
              style={{
                width: 7,
                height: 7,
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
          onClick={onResetDefault}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-subtle)",
            color: "#aaa",
            fontSize: 12,
            fontWeight: 500,
          }}
          title="استعادة فيلم العطور النموذجي"
        >
          <RotateCcw size={14} />
          <span>استعادة الأصلي</span>
        </button>

        {/* Visual Styles Button */}
        <button
          onClick={onOpenStyles}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 14px",
            borderRadius: "var(--radius-md)",
            background: "rgba(217, 182, 109, 0.08)",
            border: "1px solid rgba(217, 182, 109, 0.35)",
            color: "var(--pale-gold)",
            fontSize: 12,
            fontWeight: 600,
          }}
          title="اختيار نمط وأسلوب ألوان الرسم والفيديو (سينمائي / فلات صلب)"
        >
          <Palette size={15} color="var(--gold)" />
          <span>أنماط الرسم: {selectedStyleName || "سينمائي"}</span>
        </button>

        {/* Projects Library Button */}
        <button
          onClick={onOpenLibrary}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 14px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-subtle)",
            color: "#eee",
            fontSize: 12,
            fontWeight: 600,
          }}
          title="مكتبة الفيديوهات والمشاريع المحفوظة"
        >
          <FolderOpen size={15} color="var(--pale-gold)" />
          <span>مكتبة المشاريع</span>
        </button>

        {/* Export Video (MP4) Button - PROMINENT */}
        <button
          onClick={onOpenExportVideo}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            background: "rgba(217, 182, 109, 0.15)",
            border: "1px solid var(--gold)",
            color: "var(--pale-gold)",
            fontSize: 12,
            fontWeight: 700,
            boxShadow: "0 0 14px rgba(217, 182, 109, 0.2)",
          }}
        >
          <Video size={16} color="var(--gold)" />
          <span>تصدير فيديو (MP4)</span>
        </button>

        {/* Export HTML */}
        <button
          onClick={onDownloadHtml}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 13px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-subtle)",
            color: "#ddd",
            fontSize: 12,
            fontWeight: 500,
          }}
          title="تحميل كود HTML التفاعلي الكامل"
        >
          <Download size={14} color="var(--pale-gold)" />
          <span>تصدير HTML</span>
        </button>

        {/* Code Editor */}
        <button
          onClick={onOpenCode}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 13px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-subtle)",
            color: "#ddd",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <Code2 size={14} color="var(--pale-gold)" />
          <span>محرر الكود</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          style={{
            width: 38,
            height: 38,
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-subtle)",
            display: "grid",
            placeItems: "center",
            color: "#ccc",
          }}
          title="الإعدادات ومزود الخدمة"
        >
          <Settings size={17} />
        </button>

        {/* Generate Button */}
        <button
          onClick={onOpenGenerator}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 18px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #d9b66d, #b59247)",
            color: "#14110b",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 0 20px rgba(217, 182, 109, 0.35)",
          }}
        >
          <Sparkles size={16} />
          <span>توليد بالذكاء الاصطناعي</span>
        </button>
      </div>
    </header>
  );
}
