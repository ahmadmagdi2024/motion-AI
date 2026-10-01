"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FolderOpen,
  Play,
  Download,
  Trash2,
  Video,
  Clock,
  Sparkles,
  Calendar,
  Check,
  RefreshCw,
  Search,
} from "lucide-react";

export interface LibraryProject {
  id: string;
  title: string;
  durationSeconds: number;
  modelUsed?: string;
  prompt?: string;
  htmlCode: string;
  renderedVideoUrl?: string;
  translations?: Record<string, any>;
  currentLanguage?: string;
  audioTrack?: any;
  createdAt: string;
  updatedAt: string;
}


interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: LibraryProject) => void;
  currentProjectId?: string;
}

export function LibraryModal({
  isOpen,
  onClose,
  onSelectProject,
  currentProjectId,
}: LibraryModalProps) {
  const [projects, setProjects] = useState<LibraryProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error("[LibraryModal] Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("هل أنت متأكد من حذف هذا المشروع من المكتبة نهائياً؟")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || "تعذر حذف المشروع");
      }
    } catch (err) {
      alert("حدث خطأ أثناء محاولة الحذف");
    } finally {
      setDeletingId(null);
    }
  }

  function handleDownloadHtml(project: LibraryProject, e: React.MouseEvent) {
    e.stopPropagation();
    const blob = new Blob([project.htmlCode], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (project.title || "motion-film").replace(/[\/\\?%*:|"<>]/g, "-");
    link.href = url;
    link.download = `${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleDownloadMp4(project: LibraryProject, e: React.MouseEvent) {
    e.stopPropagation();
    if (!project.renderedVideoUrl) return;
    const link = document.createElement("a");
    const safeTitle = (project.title || "motion-film").replace(/[\/\\?%*:|"<>]/g, "-");
    link.href = project.renderedVideoUrl;
    link.download = `${safeTitle}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function formatDate(iso: string) {
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat("ar-EG", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (e) {
      return iso;
    }
  }

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(query) ||
      (p.prompt && p.prompt.toLowerCase().includes(query)) ||
      (p.modelUsed && p.modelUsed.toLowerCase().includes(query))
    );
  });

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
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(217, 182, 109, 0.15)",
                border: "1px solid var(--gold)",
                display: "grid",
                placeItems: "center",
                color: "var(--gold)",
              }}
            >
              <FolderOpen size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>
                  مكتبة المشاريع والفيديوهات المحفوظة
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: "rgba(217, 182, 109, 0.15)",
                    color: "var(--pale-gold)",
                    fontWeight: 700,
                  }}
                >
                  {projects.length} مشاريع
                </span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                جميع الفيديوهات المولدة تُحفظ تلقائياً في قاعدة البيانات ولا تُفقد أبداً
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={loadProjects}
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
              title="تحديث القائمة"
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} />
              <span>تحديث</span>
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

        {/* Search Bar */}
        <div
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            background: "rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="بحث بالاسم أو المحتوى أو النموذج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 13,
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{ background: "none", border: "none", color: "#888", fontSize: 11 }}
            >
              مسح
            </button>
          )}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "2px solid var(--gold)",
                  borderTopColor: "transparent",
                  margin: "0 auto 16px auto",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                جاري استرجاع المشاريع المحفوظة من قاعدة البيانات...
              </span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "70px 20px" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(217, 182, 109, 0.1)",
                  border: "1px solid rgba(217, 182, 109, 0.3)",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 16px auto",
                  color: "var(--gold)",
                }}
              >
                <FolderOpen size={26} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                {searchTerm ? "لم يتم العثور على نتائج للبحث" : "لا توجد مشاريع محفوظة حتى الآن"}
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto" }}>
                كل فيديو تقوم بتوليده أو تعديله بالذكاء الاصطناعي سيُحفظ هنا تلقائياً في قاعدة البيانات مع كوده الكامل وريندر الـ MP4.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {filteredProjects.map((proj) => {
                const isCurrent = currentProjectId === proj.id;
                const hasMp4 = !!proj.renderedVideoUrl;

                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj);
                      onClose();
                    }}
                    style={{
                      borderRadius: "var(--radius-md)",
                      background: isCurrent ? "rgba(217, 182, 109, 0.08)" : "rgba(255, 255, 255, 0.03)",
                      border: isCurrent
                        ? "1px solid var(--gold)"
                        : "1px solid var(--border-subtle)",
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 14,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.borderColor = "rgba(217, 182, 109, 0.4)";
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.borderColor = "var(--border-subtle)";
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                      }
                    }}
                  >
                    {/* Top Row: Meta Badges */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "rgba(217, 182, 109, 0.15)",
                              color: "var(--pale-gold)",
                              fontWeight: 700,
                            }}
                          >
                            {proj.durationSeconds}s
                          </span>

                          {proj.modelUsed && (
                            <span
                              style={{
                                fontSize: 9,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "rgba(255, 255, 255, 0.06)",
                                color: "#aaa",
                                direction: "ltr",
                              }}
                            >
                              {proj.modelUsed.split("/").pop()}
                            </span>
                          )}

                          {proj.translations && Object.keys(proj.translations).length > 0 && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "rgba(217, 182, 109, 0.15)",
                                color: "var(--pale-gold)",
                                border: "1px solid rgba(217, 182, 109, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                              title={`يحتوي على ${Object.keys(proj.translations).length + 1} لغات متوفرة`}
                            >
                              <span>🌐</span>
                              <span>{Object.keys(proj.translations).length + 1} لغات</span>
                            </span>
                          )}
                        </div>


                        {isCurrent && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--emerald)",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontWeight: 600,
                            }}
                          >
                            <Check size={12} />
                            نشط الآن
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#fff",
                          marginBottom: 6,
                          lineHeight: 1.4,
                        }}
                      >
                        {proj.title}
                      </h4>

                      {/* Prompt preview */}
                      {proj.prompt && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            lineHeight: 1.5,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            marginBottom: 8,
                          }}
                        >
                          {proj.prompt}
                        </p>
                      )}

                      {/* MP4 status pill */}
                      {hasMp4 ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 10,
                            color: "var(--emerald)",
                            background: "rgba(82, 213, 137, 0.1)",
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: "1px solid rgba(82, 213, 137, 0.3)",
                          }}
                        >
                          <Video size={11} />
                          <span>فيديو MP4 جاهز</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, color: "#888" }}>
                          كود HTML جاهز للريندر
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Actions */}
                    <div
                      style={{
                        paddingTop: 12,
                        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Calendar size={11} />
                        {formatDate(proj.updatedAt || proj.createdAt)}
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {hasMp4 && (
                          <button
                            onClick={(e) => handleDownloadMp4(proj, e)}
                            style={{
                              padding: "5px 9px",
                              borderRadius: "var(--radius-sm)",
                              background: "rgba(82, 213, 137, 0.15)",
                              border: "1px solid rgba(82, 213, 137, 0.4)",
                              color: "var(--emerald)",
                              fontSize: 11,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="تحميل ملف MP4 المستخرج"
                          >
                            <Video size={12} />
                            <span>MP4</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDownloadHtml(proj, e)}
                          style={{
                            padding: "5px 8px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid var(--border-subtle)",
                            color: "#ccc",
                            fontSize: 11,
                          }}
                          title="تحميل كود HTML التفاعلي"
                        >
                          <Download size={12} />
                        </button>

                        <button
                          onClick={(e) => handleDelete(proj.id, e)}
                          disabled={deletingId === proj.id}
                          style={{
                            padding: "5px 8px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#fca5a5",
                            fontSize: 11,
                          }}
                          title="حذف من المكتبة"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
            💡 انقر على أي مشروع لفتحه وتشغيله فوراً داخل الاستوديو
          </span>

          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
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
