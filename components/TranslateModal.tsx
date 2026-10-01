"use client";

import React, { useState } from "react";
import {
  Globe,
  X,
  Sparkles,
  Check,
  CheckCircle2,
  AlertCircle,
  Volume2,
  FileText,
  Layers,
  ArrowRight,
  Search,
} from "lucide-react";
import { SUPPORTED_LANGUAGES, LanguageOption, resolveLanguageInput } from "@/lib/constants/languages";
import { ProjectTranslation } from "@/lib/db/projects";

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  htmlCode: string;
  filmTitle?: string;
  durationSeconds?: number;
  existingTranslations?: Record<string, ProjectTranslation>;
  currentLanguage?: string;
  sourceVoiceoverScript?: any[];
  onTranslationComplete: (translation: ProjectTranslation) => void;
}

export function TranslateModal({
  isOpen,
  onClose,
  projectId,
  htmlCode,
  filmTitle = "مشروع موشن جرافيك",
  durationSeconds = 30,
  existingTranslations = {},
  currentLanguage = "ar",
  sourceVoiceoverScript,
  onTranslationComplete,
}: TranslateModalProps) {
  // Default target: If currentLanguage is Arabic, default input to "English", otherwise "العربية"
  const defaultTargetName = currentLanguage === "ar" ? "English" : "العربية";
  const [languageInput, setLanguageInput] = useState(defaultTargetName);
  const [customCode, setCustomCode] = useState("");
  const [customDir, setCustomDir] = useState<"ltr" | "rtl" | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [translateVisuals, setTranslateVisuals] = useState(true);
  const [translateVoiceover, setTranslateVoiceover] = useState(true);
  const [synthesizeAudio, setSynthesizeAudio] = useState(true);

  const [isTranslating, setIsTranslating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0); // 0: idle, 1: HTML, 2: Script, 3: Audio, 4: Done
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-resolve language name to ISO code, text direction, and flag
  const resolved = resolveLanguageInput(languageInput);
  const effectiveCode = (customCode.trim() || resolved.code).toLowerCase();
  const effectiveDir = customDir || resolved.dir;
  const effectiveFlag = resolved.flag || "🌐";

  function handleInputChange(val: string) {
    setLanguageInput(val);
    const res = resolveLanguageInput(val);
    setCustomCode(res.code);
    setCustomDir(res.dir);
  }

  function handleSelectQuickLang(lang: LanguageOption) {
    setLanguageInput(lang.nativeName);
    setCustomCode(lang.code);
    setCustomDir(lang.dir);
  }

  async function handleStartTranslation() {
    if (!languageInput.trim()) {
      setErrorMsg("يرجى إدخال اسم اللغة المراد الترجمة إليها.");
      return;
    }

    setErrorMsg(null);
    setIsTranslating(true);
    setStepIndex(1); // 1. Translating visual HTML

    const targetCode = effectiveCode;
    const targetName = languageInput.trim();
    const targetDir = effectiveDir;

    try {
      // Step simulator for UI feedback
      const timer1 = setTimeout(() => {
        if (translateVoiceover) setStepIndex(2); // 2. Generating voiceover script
      }, 7000);

      const timer2 = setTimeout(() => {
        if (synthesizeAudio) setStepIndex(3); // 3. Synthesizing Fish Audio
      }, 15000);

      const res = await fetch("/api/translate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          htmlCode,
          targetLanguage: targetCode,
          targetLanguageName: targetName,
          targetDirection: targetDir,
          translateVoiceover,
          synthesizeAudio,
          sourceVoiceoverScript,
          totalDuration: durationSeconds,
          filmTitle,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشلت عملية ترجمة الفيديو.");
      }

      setStepIndex(4); // 4. Done!

      setTimeout(() => {
        onTranslationComplete(data.translation);
        onClose();
        setIsTranslating(false);
        setStepIndex(0);
      }, 1200);
    } catch (err: any) {
      console.error("[TranslateModal] Error:", err);
      setErrorMsg(err.message || "حدث خطأ غير متوقع أثناء الترجمة.");
      setIsTranslating(false);
      setStepIndex(0);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        direction: "rtl",
      }}
      onClick={(e) => {
        if (!isTranslating && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: 680,
          background: "#0c0e10",
          border: "1px solid rgba(217, 182, 109, 0.4)",
          borderRadius: 20,
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.95)",
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "rgba(217, 182, 109, 0.15)",
                border: "1px solid var(--gold)",
                display: "grid",
                placeItems: "center",
                color: "var(--gold)",
              }}
            >
              <Globe size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>
                ترجمة وتوطين الفيديو إلى لغة جديدة
              </h2>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                ترجمة نصوص المشاهد وإعادة تسجيل التعليق الصوتي وحفظ النسخة تلقائياً
              </span>
            </div>
          </div>

          {!isTranslating && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#888",
                cursor: "pointer",
                padding: 6,
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18, maxHeight: "75vh", overflowY: "auto" }}>
          {errorMsg && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                color: "#fca5a5",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Active Translating Indicator */}
          {isTranslating ? (
            <div
              style={{
                padding: "36px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "3px solid rgba(217, 182, 109, 0.2)",
                  borderTopColor: "var(--gold)",
                  animation: "spin 1s linear infinite",
                }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 440 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>
                  جاري ترجمة وتوطين الفيديو إلى {languageInput.trim()} ({effectiveCode})...
                </h3>
                <p style={{ fontSize: 13, color: "var(--pale-gold)", lineHeight: 1.6 }}>
                  {stepIndex === 1 && "1/3: جاري ترجمة نصوص المشاهد وتكييف اتجاهات وتصميم الفيديو (HTML/CSS)..."}
                  {stepIndex === 2 && "2/3: جاري صياغة نص تعليق صوتي متزامن مع أزمنة المشاهد..."}
                  {stepIndex === 3 && "3/3: جاري تسجيل التعليق الصوتي بنموذج Fish Audio ودمجه في التايم لاين..."}
                  {stepIndex === 4 && "✓ اكتملت الترجمة بنجاح! جاري تحميل النسخة الجديدة..."}
                </p>
              </div>

              {/* Progress Steps Indicators */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                {[
                  { label: "نصوص المشاهد", idx: 1 },
                  { label: "سكريبت التعليق", idx: 2 },
                  { label: "تسجيل الصوت", idx: 3 },
                ].map((s) => {
                  const isDone = stepIndex > s.idx || stepIndex === 4;
                  const isCurrent = stepIndex === s.idx;
                  return (
                    <div
                      key={s.idx}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: isDone
                          ? "rgba(82, 213, 137, 0.15)"
                          : isCurrent
                          ? "rgba(217, 182, 109, 0.2)"
                          : "rgba(255, 255, 255, 0.04)",
                        border: isDone
                          ? "1px solid var(--emerald)"
                          : isCurrent
                          ? "1px solid var(--gold)"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                        color: isDone ? "var(--emerald)" : isCurrent ? "var(--pale-gold)" : "#888",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {isDone ? <Check size={12} /> : null}
                      <span>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Manual Language Input & Quick Suggestions */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 8,
                  }}
                >
                  اسم اللغة المراد ترجمة وتوطين الفيديو إليها (أدخل أي لغة في العالم):
                </label>

                {/* Primary Manual Language Input */}
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      position: "absolute",
                      right: 14,
                      fontSize: 18,
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {effectiveFlag}
                  </span>
                  <input
                    type="text"
                    value={languageInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="اكتب اسم أي لغة يدوياً (مثال: العربية، English، الفرنسية، Deutsch، Türkçe، Русский...)"
                    style={{
                      width: "100%",
                      padding: "12px 42px 12px 60px",
                      borderRadius: 12,
                      background: "#050608",
                      border: "1px solid rgba(217, 182, 109, 0.4)",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 600,
                      outline: "none",
                      boxShadow: "0 0 15px rgba(217, 182, 109, 0.1)",
                    }}
                  />
                  {languageInput && (
                    <button
                      type="button"
                      onClick={() => handleInputChange("")}
                      style={{
                        position: "absolute",
                        left: 12,
                        background: "none",
                        border: "none",
                        color: "#888",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      مسح
                    </button>
                  )}
                </div>

                {/* Smart Detection & Info Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "#ccc" }}>
                    <span>
                      رمز اللغة:{" "}
                      <b style={{ color: "var(--gold-bright)", direction: "ltr", display: "inline-block" }}>
                        {effectiveCode || "تلقائي"}
                      </b>
                    </span>
                    <span>
                      الاتجاه:{" "}
                      <b style={{ color: effectiveDir === "rtl" ? "var(--emerald)" : "var(--cyan)" }}>
                        {effectiveDir === "rtl" ? "من اليمين لليسار (RTL)" : "من اليسار لليمين (LTR)"}
                      </b>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--gold)",
                      fontSize: 11,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      textDecoration: "underline",
                    }}
                  >
                    <span>{showAdvanced ? "إخفاء التعديل اليدوي" : "تعديل الرمز والاتجاه يدوياً"}</span>
                  </button>
                </div>

                {/* Advanced Override Drawer */}
                {showAdvanced && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      borderRadius: 10,
                      background: "rgba(217, 182, 109, 0.08)",
                      border: "1px solid rgba(217, 182, 109, 0.25)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 11, color: "#bbb", marginBottom: 4 }}>
                        رمز اللغة (ISO Code):
                      </label>
                      <input
                        type="text"
                        placeholder="مثل: ar, en, sv"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: 6,
                          background: "#000",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          color: "#fff",
                          fontSize: 12,
                          direction: "ltr",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "#bbb", marginBottom: 4 }}>
                        اتجاه النصوص:
                      </label>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setCustomDir("rtl")}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            background: effectiveDir === "rtl" ? "var(--gold)" : "rgba(255, 255, 255, 0.06)",
                            color: effectiveDir === "rtl" ? "#000" : "#fff",
                            border: "none",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          RTL (يمين)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomDir("ltr")}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            background: effectiveDir === "ltr" ? "var(--gold)" : "rgba(255, 255, 255, 0.06)",
                            color: effectiveDir === "ltr" ? "#000" : "#fff",
                            border: "none",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          LTR (يسار)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Selection Shortcuts (Arabic first!) */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8 }}>
                    أو اضغط لاختيار لغة شائعة بضغطة واحدة:
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      maxHeight: 140,
                      overflowY: "auto",
                      padding: 2,
                    }}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected =
                        effectiveCode === lang.code ||
                        languageInput.trim().toLowerCase() === lang.nativeName.toLowerCase() ||
                        languageInput.trim().toLowerCase() === lang.name.toLowerCase();
                      const alreadyTranslated = !!existingTranslations[lang.code];

                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleSelectQuickLang(lang)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 11px",
                            borderRadius: 20,
                            background: isSelected
                              ? "rgba(217, 182, 109, 0.25)"
                              : "rgba(255, 255, 255, 0.04)",
                            border: isSelected
                              ? "1px solid var(--gold)"
                              : "1px solid rgba(255, 255, 255, 0.1)",
                            color: isSelected ? "var(--pale-gold)" : "#ddd",
                            fontSize: 12,
                            fontWeight: isSelected ? 700 : 500,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                          {alreadyTranslated && (
                            <span
                              title="تمت ترجمتها مسبقاً (يمكن إعادة توليدها)"
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "var(--emerald)",
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 2: Translation Scope & Options */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  خيارات التوطين والترجمة:
                </span>

                {/* Option 1: Visual HTML */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#ddd",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={translateVisuals}
                    onChange={(e) => setTranslateVisuals(e.target.checked)}
                    style={{ accentColor: "var(--gold)", width: 16, height: 16 }}
                  />
                  <Layers size={16} color="var(--gold)" />
                  <span>ترجمة نصوص المشاهد البصرية (العناوين، النصوص، وتكييف اتجاه الحركة LTR/RTL)</span>
                </label>

                {/* Option 2: Voiceover Script */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#ddd",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={translateVoiceover}
                    onChange={(e) => {
                      setTranslateVoiceover(e.target.checked);
                      if (!e.target.checked) setSynthesizeAudio(false);
                    }}
                    style={{ accentColor: "var(--gold)", width: 16, height: 16 }}
                  />
                  <FileText size={16} color="var(--gold)" />
                  <span>صياغة سكريبت تعليق صوتي سينمائي بلغة الوجهة مع ضبط دقيق لسرعة النطق والتوقيت</span>
                </label>

                {/* Option 3: TTS Synthesis */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: translateVoiceover ? "pointer" : "not-allowed",
                    fontSize: 13,
                    color: translateVoiceover ? "#ddd" : "#666",
                    marginRight: 26,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={synthesizeAudio}
                    disabled={!translateVoiceover}
                    onChange={(e) => setSynthesizeAudio(e.target.checked)}
                    style={{ accentColor: "var(--gold)", width: 16, height: 16 }}
                  />
                  <Volume2 size={16} color="var(--gold)" />
                  <span>توليد وتسجيل الصوت آلياً بنموذج Fish Audio ودمجه في المشغل فوراً</span>
                </label>
              </div>

              {/* Notice */}
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  lineHeight: 1.6,
                  background: "rgba(0, 0, 0, 0.3)",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                🔒 <strong>حفظ متعدد اللغات دون فقدان:</strong> النسخة الأصلية للفيلم وجميع اللغات المترجمة تُحفظ في قاعدة بيانات المشروع بشكل دائم، ويمكنك التبديل بين أي لغة بضغطة زر وتصديرها كفيديو مستقل.
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isTranslating && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(0, 0, 0, 0.4)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ccc",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleStartTranslation}
              disabled={!languageInput.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 22px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #d9b66d, #b59247)",
                color: "#0c0e10",
                fontSize: 13,
                fontWeight: 700,
                cursor: !languageInput.trim() ? "not-allowed" : "pointer",
                opacity: !languageInput.trim() ? 0.5 : 1,
                border: "none",
                boxShadow: "0 0 20px rgba(217, 182, 109, 0.3)",
              }}
            >
              <Sparkles size={16} />
              <span>
                بدء الترجمة وتوليد نسخة ({languageInput.trim() || "اللغة المحددة"})
              </span>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
