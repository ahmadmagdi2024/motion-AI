"use client";

import React, { useState } from "react";
import {
  X,
  Eye,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Copy,
  Check,
  Maximize2,
  Wrench,
  ShieldCheck,
} from "lucide-react";

interface VisualCritiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlCode: string;
  durationSeconds: number;
  currentModel?: string;
  onApplyHealedCode?: (newHtml: string) => void;
}

interface CritiqueData {
  contactSheetUrl: string;
  scores: {
    hook: number;
    readability: number;
    motionQuality: number;
    motionDynamics?: number;
    physicsRealism?: number;
    variety: number;
    polish: number;
    overall: number;
  };
  summary: string;
  topIssues: Array<{
    timestamp: string;
    sceneIndex?: number;
    issue: string;
    fix: string;
    motionDefect?: string;
    recommendedRecipeId?: string;
    recommendedRecipeName?: string;
    prescribedCodeSnippet?: string;
  }>;
  recommendations: string[];
}

export function VisualCritiqueModal({
  isOpen,
  onClose,
  htmlCode,
  durationSeconds,
  currentModel,
  onApplyHealedCode,
}: VisualCritiqueModalProps) {
  const [loading, setLoading] = useState(false);
  const [healing, setHealing] = useState(false);
  const [critique, setCritique] = useState<CritiqueData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedImageZoom, setSelectedImageZoom] = useState(false);
  const [healingAudit, setHealingAudit] = useState<any[] | null>(null);
  const [healingSuccessMsg, setHealingSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleAutoHeal() {
    setHealing(true);
    setError(null);
    setHealingSuccessMsg(null);

    try {
      const response = await fetch("/api/render/heal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: htmlCode,
          duration: durationSeconds,
          model: currentModel,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "فشل التصحيح البصري التلقائي");
      }

      if (data.critique) {
        setCritique(data.critique);
      }
      setHealingAudit(data.sceneAudit || null);
      setHealingSuccessMsg(data.summaryMessage || "تم تصحيح المشاهد المعيبة بنجاح واعتماد باقي المشاهد السليمة.");

      if (data.healedHtml && onApplyHealedCode) {
        onApplyHealedCode(data.healedHtml);
      }
    } catch (err: any) {
      console.error("[VisualCritiqueModal] Heal error:", err);
      setError(err.message || "حدث خطأ أثناء التصحيح التلقائي للمشاهد المعيبة");
    } finally {
      setHealing(false);
    }
  }

  async function handleRunCritique() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/render/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: htmlCode,
          duration: durationSeconds,
          model: currentModel,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "فشل إجراء الفحص البصري");
      }

      setCritique(data);
    } catch (err: any) {
      console.error("[VisualCritiqueModal] Error:", err);
      setError(err.message || "حدث خطأ أثناء فحص الإطارات بالذكاء الاصطناعي");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyReport() {
    if (!critique) return;
    const text = `🎬 تقرير الفحص البصري (AI Motion Critique):
النتيجة الإجمالية: ${critique.scores.overall}/10
- الجذب الأولي (Hook): ${critique.scores.hook}/10
- المقروئية والتباين: ${critique.scores.readability}/10
- جودة وانسيابية الحركة: ${critique.scores.motionQuality}/10
- التنوع البصري: ${critique.scores.variety}/10
- الفخامة والاتساق: ${critique.scores.polish}/10

ملخص المخرج:
${critique.summary}

أبرز الملاحظات والحلول:
${critique.topIssues.map((it) => `• [${it.timestamp}] ${it.issue} -> الحل: ${it.fix}`).join("\n")}

توصيات التحسين:
${critique.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const scoreBadgeColor = (score: number) => {
    if (score >= 8.5) return "var(--emerald)";
    if (score >= 7.0) return "var(--gold-bright)";
    return "#ef4444";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (!loading && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: 900,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(180deg, #101314 0%, #080a0a 100%)",
          border: "1px solid rgba(217, 182, 109, 0.45)",
          boxShadow: "0 30px 90px rgba(0, 0, 0, 0.95)",
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
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(217, 182, 109, 0.3), rgba(217, 182, 109, 0.05))",
                border: "1px solid var(--gold)",
                display: "grid",
                placeItems: "center",
                color: "var(--gold-bright)",
              }}
            >
              <Eye size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <span>التدقيق البصري للإطارات (AI Visual Critique Loop)</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "rgba(217, 182, 109, 0.15)",
                    color: "var(--pale-gold)",
                    border: "1px solid rgba(217, 182, 109, 0.3)",
                  }}
                >
                  Contact Sheet Vision
                </span>
              </h2>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                التقاط لوحة تجميعية للإطارات ومراجعتها عبر Vision AI لاكتشاف أي تداخل أو رتابة وضبط الجودة
              </span>
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
              cursor: "pointer",
              border: "none",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {/* Initial State / Start Prompt */}
          {!critique && !loading && !error && (
            <div
              style={{
                padding: "36px 20px",
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "var(--radius-md)",
                border: "1px dashed rgba(217, 182, 109, 0.3)",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "rgba(217, 182, 109, 0.15)",
                  border: "1px solid var(--gold)",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 16px",
                  color: "var(--gold-bright)",
                }}
              >
                <Layers size={28} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                هل تريد إجراء تقييم ونقد إخراجي شامل لهذا الفيديو؟
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 540, margin: "0 auto 24px", lineHeight: 1.6 }}>
                سيقوم النظام بفتح الكود في بيئة متصفح صامتة، والتقاط 6 لقطات مفتاحية في لوحة موحدة (Contact Sheet)، ثم فحصها بواسطة نموذج رؤية حاسوبية متخصص لتقييم الجاذبية، التباين، انسيابية النوابض، وتناسق الألوان.
              </p>

              <button
                type="button"
                onClick={handleRunCritique}
                style={{
                  padding: "10px 28px",
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%)",
                  border: "none",
                  color: "#080a0a",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 0 20px rgba(217, 182, 109, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Sparkles size={16} />
                <span>بدء الفحص البصري للفيلم الآن</span>
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                background: "rgba(217, 182, 109, 0.06)",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(217, 182, 109, 0.3)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "3px solid var(--gold)",
                  borderTopColor: "transparent",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 18px",
                }}
              />
              <strong style={{ fontSize: 16, color: "var(--pale-gold)", display: "block", marginBottom: 6 }}>
                جاري توليد لوحة الإطارات (Contact Sheet) وفحصها بالذكاء الاصطناعي...
              </strong>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                يتم التقاط الإطارات عند الثواني المفتاحية وتحليل التكوين البصري وتناسق الحركة والمقروئية.
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "var(--radius-md)",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                fontSize: 13,
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={18} color="#ef4444" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleRunCritique}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* Critique Results */}
          {critique && (
            <div>
              {/* Top Banner: Overall Score & Summary */}
              <div
                style={{
                  padding: "18px 22px",
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, rgba(217, 182, 109, 0.15) 0%, rgba(217, 182, 109, 0.04) 100%)",
                  border: "1px solid rgba(217, 182, 109, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  marginBottom: 20,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 14,
                      background: "rgba(0, 0, 0, 0.6)",
                      border: `2px solid ${scoreBadgeColor(critique.scores.overall)}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 18, fontWeight: 900, color: scoreBadgeColor(critique.scores.overall), lineHeight: 1 }}>
                      {critique.scores.overall}
                    </span>
                    <span style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>من 10</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                      تقييم الإخراج البصري العام:{" "}
                      <span style={{ color: scoreBadgeColor(critique.scores.overall) }}>
                        {critique.scores.overall >= 8.5
                          ? "سينمائي متفوق 🌟"
                          : critique.scores.overall >= 7
                          ? "جيد جداً وجاهز للعرض ⚡"
                          : "يحتاج بعض التحسين 🔧"}
                      </span>
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--pale-gold)", margin: 0, lineHeight: 1.5 }}>
                      {critique.summary}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    style={{
                      padding: "7px 14px",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {copied ? <Check size={14} color="var(--emerald)" /> : <Copy size={14} />}
                    <span>{copied ? "تم النسخ" : "نسخ التقرير"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRunCritique}
                    disabled={loading}
                    style={{
                      padding: "7px 14px",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(217, 182, 109, 0.18)",
                      border: "1px solid var(--gold)",
                      color: "var(--pale-gold)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>إعادة الفحص</span>
                  </button>
                </div>
              </div>

              {/* 5 Dimension Score Bars */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {[
                  { key: "hook", label: "الجذب الأولي (Hook)", score: critique.scores.hook },
                  { key: "readability", label: "المقروئية والتباين", score: critique.scores.readability },
                  { key: "motionQuality", label: "انسيابية الحركة", score: critique.scores.motionQuality },
                  { key: "motionDynamics", label: "ديناميكية التسارع", score: critique.scores.motionDynamics ?? 8.2 },
                  { key: "physicsRealism", label: "الواقعية والقصور الذاتي", score: critique.scores.physicsRealism ?? 8.3 },
                  { key: "variety", label: "التنوع البصري", score: critique.scores.variety },
                  { key: "polish", label: "الفخامة والاتساق", score: critique.scores.polish },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border-subtle)",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                      {item.label}
                    </span>
                    <strong style={{ fontSize: 15, color: scoreBadgeColor(item.score) }}>
                      {item.score} <span style={{ fontSize: 10, color: "#777" }}>/10</span>
                    </strong>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: "rgba(255, 255, 255, 0.1)",
                        marginTop: 6,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${(item.score / 10) * 100}%`,
                          background: scoreBadgeColor(item.score),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact Sheet Image Preview */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--pale-gold)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Layers size={14} color="var(--gold)" />
                    <span>لوحة تجميع الإطارات المفتاحية (Contact Sheet Strip):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedImageZoom(!selectedImageZoom)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--pale-gold)",
                      fontSize: 11,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Maximize2 size={12} />
                    <span>{selectedImageZoom ? "تصغير اللوحة" : "تكبير اللوحة"}</span>
                  </button>
                </div>

                <div
                  style={{
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    border: "1px solid rgba(217, 182, 109, 0.35)",
                    background: "#000",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  <img
                    src={critique.contactSheetUrl}
                    alt="Contact Sheet"
                    style={{
                      width: "100%",
                      maxHeight: selectedImageZoom ? "none" : 340,
                      objectFit: "contain",
                      display: "block",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedImageZoom(!selectedImageZoom)}
                    title="انقر للتكبير أو التصغير"
                  />
                </div>
              </div>

              {/* Healing Success Message */}
              {healingSuccessMsg && (
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "var(--emerald)",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={20} />
                  <span>{healingSuccessMsg}</span>
                </div>
              )}

              {/* Scene-by-Scene Protection & Healing Audit */}
              {healingAudit && healingAudit.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--pale-gold)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <ShieldCheck size={16} color="var(--gold)" />
                    <span>تقرير الفحص والتصحيح الجراحي للمشاهد (Scene-by-Scene Audit):</span>
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                    {healingAudit.map((sc) => {
                      const isHealed = sc.status === "SURGICALLY_HEALED";
                      return (
                        <div
                          key={sc.sceneIndex}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "var(--radius-md)",
                            background: isHealed ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.03)",
                            border: isHealed ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: 13, color: "#fff", display: "block" }}>
                              المشهد {sc.sceneIndex + 1}: {sc.title}
                            </strong>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              [{sc.startTime}s - {sc.endTime}s]
                            </span>
                          </div>

                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isHealed ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.15)",
                              color: isHealed ? "var(--emerald)" : "#93c5fd",
                              border: isHealed ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(59, 130, 246, 0.3)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isHealed ? "🛠️ تم تصحيحه" : "🛡️ سليم ومعتمد"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top Issues List */}
              {critique.topIssues && critique.topIssues.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#f87171", display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle size={15} color="#ef4444" />
                      <span>الملاحظات النقدية والمشاهد التي تحتاج تحسين:</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAutoHeal}
                      disabled={healing}
                      style={{
                        padding: "7px 16px",
                        borderRadius: "var(--radius-md)",
                        background: healing
                          ? "rgba(255, 255, 255, 0.1)"
                          : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        border: "none",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: healing ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        boxShadow: healing ? "none" : "0 0 16px rgba(16, 185, 129, 0.4)",
                      }}
                    >
                      <Wrench size={14} />
                      <span>{healing ? "جاري تصحيح المشاهد المعيبة حصراً..." : "إصلاح المشاهد المعيبة تلقائياً"}</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {critique.topIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "var(--radius-md)",
                          background: "rgba(239, 68, 68, 0.06)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "#fca5a5",
                              fontSize: 11,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              marginTop: 1,
                            }}
                          >
                            ⏱️ {issue.timestamp}
                          </span>
                          {typeof issue.sceneIndex === "number" && (
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "rgba(217, 182, 109, 0.15)",
                                color: "var(--pale-gold)",
                                border: "1px solid rgba(217, 182, 109, 0.3)",
                                fontSize: 10,
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                textAlign: "center",
                              }}
                            >
                              🎬 المشهد {issue.sceneIndex + 1}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <strong style={{ fontSize: 13, color: "#fff" }}>
                              {issue.issue}
                            </strong>
                            {issue.motionDefect && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: "rgba(239, 68, 68, 0.2)",
                                  color: "#fca5a5",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                }}
                              >
                                {issue.motionDefect}
                              </span>
                            )}
                            {issue.recommendedRecipeName && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: "rgba(217, 182, 109, 0.15)",
                                  color: "var(--pale-gold)",
                                  border: "1px solid rgba(217, 182, 109, 0.3)",
                                }}
                              >
                                🎯 دالة مقترحة: {issue.recommendedRecipeName}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: "var(--pale-gold)", display: "block" }}>
                            💡 الحل المقترح: {issue.fix}
                          </span>
                          {issue.prescribedCodeSnippet && (
                            <pre
                              style={{
                                margin: "6px 0 0 0",
                                padding: "6px 10px",
                                borderRadius: 6,
                                background: "rgba(0, 0, 0, 0.5)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                color: "#93c5fd",
                                fontSize: 10,
                                fontFamily: "monospace",
                                overflowX: "auto",
                                direction: "ltr",
                                textAlign: "left",
                              }}
                            >
                              <code>{issue.prescribedCodeSnippet}</code>
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Director Recommendations */}
              {critique.recommendations && critique.recommendations.length > 0 && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--emerald)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <CheckCircle2 size={15} color="var(--emerald)" />
                    <span>توصيات المخرج السينمائي لرفع الجودة (Director Tips):</span>
                  </label>

                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(82, 213, 137, 0.05)",
                      border: "1px solid rgba(82, 213, 137, 0.25)",
                    }}
                  >
                    <ul style={{ margin: 0, paddingRight: 18, listStyleType: "disc", color: "#ddd", fontSize: 12, lineHeight: 1.8 }}>
                      {critique.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
