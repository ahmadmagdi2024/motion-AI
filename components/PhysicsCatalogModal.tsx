"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Activity,
  Play,
  RotateCcw,
  Copy,
  ExternalLink,
  Code2,
  Check,
  RefreshCw,
  Folder,
  Layers,
} from "lucide-react";

export interface PhysicsMotion {
  id: string;
  filename: string;
  title: string;
  description: string;
  mathFunctions: string[];
  scriptSummary: string;
  mtime: number;
}

interface PhysicsCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToStudio?: (htmlCode: string, title: string) => void;
}

export function PhysicsCatalogModal({
  isOpen,
  onClose,
  onApplyToStudio,
}: PhysicsCatalogModalProps) {
  const [items, setItems] = useState<PhysicsMotion[]>([]);
  const [selectedItem, setSelectedItem] = useState<PhysicsMotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [directory, setDirectory] = useState("");
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLibrary();
    }
  }, [isOpen]);

  async function loadLibrary() {
    setLoading(true);
    try {
      const res = await fetch("/api/physics-library", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
        setDirectory(data.directory || "");
        if (data.items.length > 0 && !selectedItem) {
          setSelectedItem(data.items[0]);
        }
      }
    } catch (err) {
      console.error("[PhysicsCatalog] Failed to load library:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCode() {
    if (!selectedItem) return;
    try {
      const res = await fetch(`/api/physics-library/preview?file=${encodeURIComponent(selectedItem.filename)}`);
      const code = await res.text();
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("فشل نسخ الكود");
    }
  }

  async function handleApplyToStudio() {
    if (!selectedItem || !onApplyToStudio) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/physics-library/preview?file=${encodeURIComponent(selectedItem.filename)}`);
      const code = await res.text();
      onApplyToStudio(code, selectedItem.title);
      onClose();
    } catch {
      alert("فشل تحميل الحركة إلى الاستوديو");
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
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: 1180,
          height: "88vh",
          borderRadius: "var(--radius-lg)",
          background: "#0a0c0e",
          border: "1px solid rgba(217, 182, 109, 0.35)",
          boxShadow: "0 30px 90px rgba(0, 0, 0, 0.95)",
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
            background: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))",
                border: "1px solid rgba(6, 182, 212, 0.5)",
                display: "grid",
                placeItems: "center",
                color: "#06b6d4",
              }}
            >
              <Activity size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
                  مكتبة الحركات الفيزيائية المرجعية
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: "rgba(6, 182, 212, 0.15)",
                    border: "1px solid rgba(6, 182, 212, 0.3)",
                    color: "#06b6d4",
                    fontWeight: 700,
                  }}
                >
                  {items.length} محاكاة متطورة
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: "rgba(82, 213, 137, 0.15)",
                    color: "var(--emerald)",
                    fontWeight: 600,
                  }}
                >
                  ⚡ قراءة ديناميكية فورية
                </span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <Folder size={12} />
                <span>المسار: {directory || "مجلد الحركات الفيزيائية"}</span>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={loadLibrary}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                color: "#ccc",
                padding: "6px 12px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
              }}
              title="إعادة فحص المجلد الآن لالتقاط أي ملفات جديدة"
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} />
              <span>إعادة فحص المجلد</span>
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

        {/* Content Body: Split View */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "380px 1fr", overflow: "hidden" }}>
          {/* Left Column: Motions List */}
          <div
            style={{
              borderLeft: "1px solid var(--border-subtle)",
              background: "rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                المحاكيات المكتشفة تلقائياً (تتحدث مع أي ملف جديد تضيفه):
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 16px" }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "2px solid var(--gold)",
                    borderTopColor: "transparent",
                    margin: "0 auto 12px auto",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>جاري فحص مجلد الحركات...</span>
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
                لم يتم العثور على ملفات HTML في المسار المحدد
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 12 }}>
                {items.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "var(--radius-md)",
                        background: isSelected ? "rgba(6, 182, 212, 0.12)" : "rgba(255, 255, 255, 0.03)",
                        border: isSelected
                          ? "1px solid rgba(6, 182, 212, 0.5)"
                          : "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: isSelected ? "#38bdf8" : "#fff",
                          marginBottom: 4,
                          lineHeight: 1.4,
                        }}
                      >
                        {item.title}
                      </h4>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          lineHeight: 1.4,
                          marginBottom: 8,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.description}
                      </p>

                      {/* Math functions tags */}
                      {item.mathFunctions.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {item.mathFunctions.slice(0, 4).map((fn, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: 9,
                                padding: "1px 5px",
                                borderRadius: 3,
                                background: "rgba(255, 255, 255, 0.06)",
                                color: "#aaa",
                                fontFamily: "monospace",
                                direction: "ltr",
                              }}
                            >
                              {fn}()
                            </span>
                          ))}
                          {item.mathFunctions.length > 4 && (
                            <span style={{ fontSize: 9, color: "#666" }}>+{item.mathFunctions.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Live Simulation Preview & Actions */}
          <div style={{ display: "flex", flexDirection: "column", background: "#050607" }}>
            {selectedItem ? (
              <>
                {/* Simulation Control Bar */}
                <div
                  style={{
                    padding: "10px 20px",
                    borderBottom: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(0, 0, 0, 0.4)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 13, color: "#fff" }}>{selectedItem.title}</strong>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({selectedItem.filename})</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={handleCopyCode}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-subtle)",
                        color: copied ? "var(--emerald)" : "#ccc",
                        fontSize: 11,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copied ? "تم النسخ!" : "نسخ الكود"}</span>
                    </button>

                    <a
                      href={`/api/physics-library/preview?file=${encodeURIComponent(selectedItem.filename)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 10px",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-subtle)",
                        color: "#ccc",
                        fontSize: 11,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        textDecoration: "none",
                      }}
                      title="فتح المحاكاة في نافذة مستقلة كاملة الشاشة"
                    >
                      <ExternalLink size={12} />
                      <span>نافذة جديدة</span>
                    </a>

                    {onApplyToStudio && (
                      <button
                        onClick={handleApplyToStudio}
                        disabled={applying}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "var(--radius-sm)",
                          background: "linear-gradient(135deg, #d9b66d, #b59247)",
                          color: "#18130c",
                          fontWeight: 700,
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Play size={12} />
                        <span>تشغيل هذه المحاكاة في الاستوديو</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Embedded Live Iframe */}
                <div style={{ flex: 1, position: "relative", background: "#0e1013" }}>
                  <iframe
                    key={selectedItem.filename}
                    src={`/api/physics-library/preview?file=${encodeURIComponent(selectedItem.filename)}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      background: "transparent",
                    }}
                    title={selectedItem.title}
                  />
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
                اختر حركة فيزيائية من القائمة لمعاينتها فورياً
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.6)",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            💡 أي ملف HTML جديد تقوم بوضعه داخل مجلد الحركات المرجعية يُقرأ تلقائياً في التوليد القادم ويظهر هنا فوراً.
          </span>

          <button
            onClick={onClose}
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#ccc",
              fontSize: 12,
            }}
          >
            إغلاق
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}
