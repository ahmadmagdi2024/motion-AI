"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Download, Play, Code2 } from "lucide-react";

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onApplyCode: (newCode: string) => void;
  onDownload: () => void;
}

export function CodeModal({
  isOpen,
  onClose,
  code,
  onApplyCode,
  onDownload,
}: CodeModalProps) {
  const [editedCode, setEditedCode] = useState(code);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    setEditedCode(code);
  }, [code, isOpen]);

  if (!isOpen) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(editedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert("تعذر النسخ إلى الحافظة");
    }
  }

  function handleApply() {
    onApplyCode(editedCode);
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 500);
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
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: 960,
          height: "85vh",
          borderRadius: "var(--radius-lg)",
          background: "#0c0e0e",
          border: "1px solid rgba(217, 182, 109, 0.35)",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.9)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "rgba(217, 182, 109, 0.15)",
                display: "grid",
                placeItems: "center",
                color: "var(--gold)",
              }}
            >
              <Code2 size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>محرر كود الموشن جرافيك (HTML / CSS / JS)</h2>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                يمكنك معاينة الكود أو تعديل النصوص والـ CSS فوراً وتطبيقه على العرض
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: "var(--radius-md)",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                color: "#ddd",
                fontSize: 12,
              }}
            >
              {copied ? <Check size={14} color="var(--emerald)" /> : <Copy size={14} />}
              <span>{copied ? "تم النسخ" : "نسخ الكود"}</span>
            </button>

            <button
              onClick={onDownload}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: "var(--radius-md)",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                color: "#ddd",
                fontSize: 12,
              }}
            >
              <Download size={14} />
              <span>تحميل HTML</span>
            </button>

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
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Code Editor Body */}
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%",
              height: "100%",
              padding: 20,
              fontSize: 13,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              lineHeight: 1.6,
              background: "#08090a",
              color: "#e2e8f0",
              border: "none",
              resize: "none",
              direction: "ltr",
              whiteSpace: "pre",
              overflowWrap: "normal",
              overflowX: "auto",
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            عدد الأسطر: {editedCode.split("\n").length} سطر · حجم الملف: {(editedCode.length / 1024).toFixed(1)} KB
          </span>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                background: "rgba(255, 255, 255, 0.06)",
                color: "#ccc",
                fontSize: 13,
              }}
            >
              إغلاق
            </button>

            <button
              onClick={handleApply}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 20px",
                borderRadius: "var(--radius-md)",
                background: "var(--gold)",
                color: "#18130c",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Play size={14} fill="#18130c" />
              <span>{applied ? "تم التطبيق بنجاح!" : "تطبيق التعديلات الحية"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
