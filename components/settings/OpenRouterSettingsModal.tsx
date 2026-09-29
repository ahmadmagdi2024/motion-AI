"use client";
import React, { useState, useEffect } from "react";

export function OpenRouterSettingsModal({ onClose }: { onClose: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [visionEnabled, setVisionEnabled] = useState(true);
  const [status, setStatus] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    fetch("/api/settings/openrouter")
      .then(r => r.json())
      .then(data => {
        if (data.model) setModel(data.model);
        if (typeof data.visionEnabled === "boolean") setVisionEnabled(data.visionEnabled);
        if (data.apiKeyConfigured) setStatus("مفتاح API محفوظ ومكون.");
      })
      .catch(() => {});
  }, []);

  async function handleTest() {
    setTesting(true);
    setStatus("جاري اختبار الاتصال...");
    try {
      const res = await fetch("/api/settings/openrouter/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, model })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus(`✅ ${data.message} (${data.model})`);
      } else {
        setStatus(`❌ فشل: ${data.message}`);
      }
    } catch (e: any) {
      setStatus(`❌ خطأ في الاتصال: ${e.message}`);
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, model, visionEnabled })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("✅ تم حفظ الإعدادات بنجاح");
        setTimeout(onClose, 1000);
      } else {
        setStatus("❌ فشل الحفظ");
      }
    } catch (e: any) {
      setStatus(`❌ خطأ: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" style={{ background: '#111', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%', border: '1px solid #333' }}>
        <h2 style={{ marginTop: 0, color: '#fff' }}>إعدادات OpenRouter</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#ccc' }}>
            مفتاح API (OpenRouter API Key)
          </label>
          <input 
            type="password" 
            value={apiKey} 
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#000', color: '#fff', boxSizing: 'border-box' }}
          />
          <small style={{ display: 'block', marginTop: '4px', color: '#888' }}>
            سيتم حفظ المفتاح لهذه الجلسة فقط (Session-only). يمكنك تركه فارغاً إذا كنت تستخدم ملف .env.
          </small>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#ccc' }}>
            معرف النموذج (Model ID)
          </label>
          <input 
            type="text" 
            value={model} 
            onChange={e => setModel(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#000', color: '#fff', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#ccc', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={visionEnabled} 
              onChange={e => setVisionEnabled(e.target.checked)}
              style={{ marginRight: '8px', marginLeft: '8px' }}
            />
            تفعيل تحليل الصور (Vision)
          </label>
        </div>

        <div style={{ marginBottom: '16px', fontSize: '12px', color: '#888' }}>
          Base URL: <code>https://openrouter.ai/api/v1</code><br/>
          تنبيه: تكلفة الطلبات تُخصم من حسابك في OpenRouter.
        </div>

        {status && (
          <div style={{ marginBottom: '16px', padding: '10px', background: '#222', borderRadius: '6px', fontSize: '14px', color: '#fff' }}>
            {status}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleTest} 
            disabled={testing}
            style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            {testing ? "جاري الاختبار..." : "اختبار الاتصال"}
          </button>
          <button 
            onClick={onClose} 
            style={{ padding: '8px 16px', background: '#222', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            إلغاء
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{ padding: '8px 16px', background: '#d8b56b', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </div>
    </div>
  );
}
