"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Cpu, ExternalLink, Check, Sparkles, ShieldCheck } from "lucide-react";
import { RECOMMENDED_MODELS, OpenRouterSettings } from "@/lib/openrouter/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeyConfigured: boolean;
  currentModel: string;
  onSettingsSaved: (settings: { apiKeyConfigured: boolean; model: string }) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  apiKeyConfigured,
  currentModel,
  onSettingsSaved,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(currentModel);
  const [customModel, setCustomModel] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    setSelectedModel(currentModel);
    const isPredefined = RECOMMENDED_MODELS.some((m) => m.id === currentModel);
    if (!isPredefined && currentModel) {
      setIsCustom(true);
      setCustomModel(currentModel);
    } else {
      setIsCustom(false);
      setCustomModel("");
    }
  }, [currentModel, isOpen]);

  if (!isOpen) return null;

  async function handleSave() {
    setSaving(true);
    setToastMessage("");
    try {
      const finalModel = isCustom && customModel.trim() ? customModel.trim() : selectedModel;
      const res = await fetch("/api/settings/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim() || undefined,
          model: finalModel,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        onSettingsSaved({
          apiKeyConfigured: apiKey.trim() ? true : apiKeyConfigured,
          model: finalModel,
        });
        setToastMessage("تم حفظ الإعدادات بنجاح!");
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        alert(data.message || "حدث خطأ أثناء الحفظ");
      }
    } catch (e: any) {
      alert("تعذر الاتصال بالخادم: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
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
          maxWidth: 640,
          borderRadius: "var(--radius-lg)",
          background: "#0d0f0f",
          border: "1px solid rgba(217, 182, 109, 0.3)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(217, 182, 109, 0.15)",
                display: "grid",
                placeItems: "center",
                color: "var(--gold)",
              }}
            >
              <Cpu size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>إعدادات مزود الذكاء الاصطناعي (OpenRouter)</h2>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                اختر النموذج المفضل لديك وأدخل مفتاح API للتحكم في التوليد
              </p>
            </div>
          </div>

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

        {/* Modal Body */}
        <div style={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}>
          {/* API Key Section */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <label style={{ fontSize: 13, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                <Key size={15} color="var(--gold)" />
                <span>مفتاح OpenRouter API Key</span>
              </label>

              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 11,
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  textDecoration: "none",
                }}
              >
                <span>الحصول على مفتاح من OpenRouter</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div style={{ position: "relative" }}>
              <input
                type={showKey ? "text" : "password"}
                placeholder={
                  apiKeyConfigured
                    ? "المفتاح محفوظ ومفعّل بالفعل (أدخل مفتاحاً جديداً للاستبدال)"
                    : "sk-or-v1-..."
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 13,
                  direction: "ltr",
                  fontFamily: "monospace",
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  color: "#aaa",
                  fontSize: 11,
                  padding: "4px 8px",
                }}
              >
                {showKey ? "إخفاء" : "إظهار"}
              </button>
            </div>

            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
              {apiKeyConfigured ? (
                <span style={{ fontSize: 11, color: "var(--emerald)", display: "flex", alignItems: "center", gap: 4 }}>
                  <ShieldCheck size={14} />
                  <span>المفتاح مربوط في النظام ومحفوظ بأمان.</span>
                </span>
              ) : (
                <span style={{ fontSize: 11, color: "#f59e0b" }}>
                  ⚠️ لم يتم إدخال مفتاح بعد. تحتاج مفتاح لتوليد فيديوهات جديدة.
                </span>
              )}
            </div>
          </div>

          {/* Model Selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#fff", display: "block", marginBottom: 12 }}>
              اختيار نموذج التوليد المفضل:
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RECOMMENDED_MODELS.map((model) => {
                const isSelected = !isCustom && selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedModel(model.id);
                    }}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "var(--radius-md)",
                      border: isSelected
                        ? "1px solid var(--gold)"
                        : "1px solid var(--border-subtle)",
                      background: isSelected
                        ? "rgba(217, 182, 109, 0.08)"
                        : "rgba(255, 255, 255, 0.02)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      transition: "0.2s",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "var(--pale-gold)" : "#fff" }}>
                          {model.name}
                        </span>
                        {model.recommended && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(82, 213, 137, 0.2)",
                              color: "var(--emerald)",
                              fontWeight: 700,
                            }}
                          >
                            موصى به
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        {model.description}
                      </p>
                      <span style={{ fontSize: 10, color: "#666", direction: "ltr", display: "block", marginTop: 2, fontFamily: "monospace" }}>
                        {model.id}
                      </span>
                    </div>

                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: isSelected ? "5px solid var(--gold)" : "2px solid #555",
                        marginTop: 4,
                      }}
                    />
                  </div>
                );
              })}

              {/* Custom Model Option */}
              <div
                onClick={() => setIsCustom(true)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  border: isCustom
                    ? "1px solid var(--gold)"
                    : "1px solid var(--border-subtle)",
                  background: isCustom
                    ? "rgba(217, 182, 109, 0.08)"
                    : "rgba(255, 255, 255, 0.02)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isCustom ? "var(--pale-gold)" : "#fff" }}>
                    كتابة اسم نموذج مخصص (Custom Model)
                  </span>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: isCustom ? "5px solid var(--gold)" : "2px solid #555",
                    }}
                  />
                </div>

                {isCustom && (
                  <div style={{ marginTop: 10 }}>
                    <input
                      type="text"
                      placeholder="e.g. anthropic/claude-3.7-sonnet:thinking أو openai/gpt-4o"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: 12,
                        direction: "ltr",
                        fontFamily: "monospace",
                      }}
                    />
                    <div style={{ marginTop: 8, fontSize: 11, color: "#fca5a5", display: "flex", alignItems: "center", gap: 4 }}>
                      ⚠️ تجنب استخدام نماذج (DeepSeek V4/R1) لأنها تقطع الكود، ونماذج (Qwen) لأنها تفشل برمجياً في بناء الرسوميات.
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
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
          {toastMessage ? (
            <span style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 600 }}>
              {toastMessage}
            </span>
          ) : (
            <div />
          )}

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
              إلغاء
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "8px 20px",
                borderRadius: "var(--radius-md)",
                background: "var(--gold)",
                color: "#18130c",
                fontSize: 13,
                fontWeight: 700,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
