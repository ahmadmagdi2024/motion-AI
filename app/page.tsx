'use client';
import React, { useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import { VideoComposition } from '@/remotion/VideoComposition';
import { createLocalProject } from '@/lib/local-planner';
import { totalFrames, type Asset, type Scene, type VideoProject } from '@/lib/schema';
import { SettingsButton } from '@/components/settings/SettingsButton';
import { BrandColorsPicker, type BrandColors, BRAND_PRESETS } from '@/components/BrandColorsPicker';
import { ICON_NAMES, MotionIcon, resolveLucideIcon } from '@/remotion/motion/icons';
import { TemplateLibraryModal, SCREEN_TEMPLATES } from '@/components/TemplateLibraryModal';
import { IconPickerModal } from '@/components/IconPickerModal';

const defaultColors: BrandColors = BRAND_PRESETS[0].colors;

const initial = createLocalProject({
  prompt: 'أريد فيديو إعلاني سينمائي فاخر يعرّف بالشركة وخدماتها، ويبرز الخبرة والجودة والمنتج النهائي.',
  language: 'ar',
  duration: 30,
  assets: [],
  brandColors: defaultColors
});

const TEMPLATE_OPTIONS = SCREEN_TEMPLATES.map((t) => ({
  id: t.id,
  labelAr: t.nameAr,
  labelEn: t.nameEn
}));

export default function Home() {
  const [prompt, setPrompt] = useState(
    'أريد فيديو إعلاني سينمائي فاخر يعرّف بشركتنا وخدماتنا المبتكرة، مع إبراز الجودة والسرعة وثقة العملاء.'
  );
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [duration, setDuration] = useState(30);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [brandColors, setBrandColors] = useState<BrandColors>(defaultColors);
  const [project, setProject] = useState<VideoProject>(initial);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);

  const frames = useMemo(() => totalFrames(project), [project]);

  const handleBrandColorsChange = (newColors: BrandColors) => {
    setBrandColors(newColors);
    setProject((prev) => ({
      ...prev,
      brand: {
        ...prev.brand,
        primaryColor: newColors.primaryColor,
        secondaryColor: newColors.secondaryColor,
        accentColor: newColors.accentColor
      },
      scenes: prev.scenes.map((s, i) => ({
        ...s,
        accent: i % 3 === 0 ? newColors.accentColor : i % 3 === 1 ? newColors.primaryColor : newColors.secondaryColor
      }))
    }));
  };

  async function upload(files: FileList | null, forced?: 'logo') {
    if (!files) return;
    setBusy('جاري رفع الملفات...');
    try {
      const next = [...assets];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        if (forced) fd.append('type', forced);
        const r = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        next.push(data);
      }
      setAssets(next);
      setMessage(`تم رفع ${files.length} ملف`);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy('');
    }
  }

  async function generate(forceFallback: boolean = false) {
    if (isGenerating) return;
    setIsGenerating(true);
    setBusy('تحليل الفكرة وتصميم التكوينات والحركات...');
    setMessage('');
    try {
      setBusy('توليد المشاهد وتنسيق ألوان الهوية...');
      const payload: any = {
        prompt,
        language,
        duration,
        assets,
        brandColors,
        forceFallback
      };

      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setBusy('تحليل المشاهد والأيقونات والقوالب...');
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || data.message || 'Generation failed');

      setBusy('تجهيز المعاينة...');
      setProject(data.project);
      setSelected(0);

      let finalMessage = 'تم إنشاء مشاهد الفيديو وتطبيق الهوية والأيقونات بنجاح!';
      if (data.usedFallback) {
        finalMessage += ' ⚠️ تم استخدام المخطط المحلي كبديل لعدم توفر API.';
      }
      setMessage(finalMessage);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy('');
      setIsGenerating(false);
    }
  }

  function updateScene<K extends keyof Scene>(key: K, value: Scene[K]) {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s, i) => (i === selected ? { ...s, [key]: value } : s))
    }));
  }

  const applyTemplateToCurrent = (templateId: Scene['type']) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s, i) => {
        if (i !== selected) return s;
        return {
          ...s,
          type: templateId,
          items: s.items && s.items.length > 0 ? s.items : ['ميزة حصرية أولى', 'أداء متفوق وسرعة فائقة', 'ضمان وجودة معتمدة'],
          statistic: s.statistic || '+150%',
          cta: s.cta || 'ابدأ تجربتك الآن'
        };
      })
    }));
  };

  const addNewScreenWithTemplate = (templateId: Scene['type']) => {
    const tpl = SCREEN_TEMPLATES.find((t) => t.id === templateId);
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      type: templateId,
      eyebrow: tpl?.badgeTag || 'شاشة جديدة',
      title: tpl?.nameAr || 'عنوان الشاشة الجديد',
      subtitle: tpl?.descAr || 'شرح تفصيلي توضيحي لمحتوى هذا المشهد وقيمته للمشاهد',
      accent: brandColors.accentColor,
      iconColor: brandColors.accentColor,
      backgroundColor: project.brand?.backgroundColor || '#07080a',
      textColor: '#ffffff',
      durationInFrames: 90,
      icon: 'sparkles',
      backgroundStyle: 'cinematic',
      items: ['ميزة حصرية أولى', 'أداء متفوق وسرعة فائقة', 'ضمان وجودة معتمدة'],
      statistic: '+150%',
      cta: 'ابدأ تجربتك الآن',
      layout: 'editorial',
      camera: 'push-in',
      textAnimation: 'word-stagger',
      mediaAnimation: 'ken-burns',
      templateStyle: 'modern-minimal',
      intensity: 1,
      focusPoint: { x: 50, y: 50 },
      transition: 'light-sweep'
    };

    setProject((p) => ({
      ...p,
      scenes: [...p.scenes, newScene]
    }));
    setSelected(project.scenes.length);
  };

  const duplicateCurrentScreen = () => {
    const current = project.scenes[selected];
    if (!current) return;
    const copy: Scene = {
      ...current,
      id: `scene-${Date.now()}`,
      title: `${current.title} (نسخة)`
    };
    const newScenes = [...project.scenes];
    newScenes.splice(selected + 1, 0, copy);
    setProject((p) => ({ ...p, scenes: newScenes }));
    setSelected(selected + 1);
  };

  const deleteCurrentScreen = () => {
    if (project.scenes.length <= 1) {
      alert('لا يمكن حذف الشاشة الأخيرة. يجب أن يحتوي الفيديو على شاشة واحدة على الأقل.');
      return;
    }
    const newScenes = project.scenes.filter((_, i) => i !== selected);
    setProject((p) => ({ ...p, scenes: newScenes }));
    setSelected(Math.max(0, selected - 1));
  };

  const moveScreen = (direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? selected - 1 : selected + 1;
    if (targetIndex < 0 || targetIndex >= project.scenes.length) return;
    const newScenes = [...project.scenes];
    const temp = newScenes[selected];
    newScenes[selected] = newScenes[targetIndex];
    newScenes[targetIndex] = temp;
    setProject((p) => ({ ...p, scenes: newScenes }));
    setSelected(targetIndex);
  };

  async function render() {
    if (isRendering) return;
    const invalidAsset = project.assets?.find((asset) => asset.url?.startsWith('blob:'));
    if (invalidAsset) {
      setMessage('يوجد ملف مستخدم كرابط مؤقت. ارفعه إلى السيرفر قبل التصدير.');
      return;
    }
    setIsRendering(true);
    setBusy('جاري تصدير MP4 — لا تغلق الصفحة...');
    setMessage('');
    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        console.error('Render API failed:', result);
        throw new Error(result?.message || `فشل التصدير برمز ${response.status}`);
      }
      if (!result?.outputUrl) {
        throw new Error('لم يرجع السيرفر رابط الفيديو.');
      }
      setMessage(`اكتمل التصدير: ${result.outputUrl}`);
      window.open(result.outputUrl, '_blank');
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setIsRendering(false);
      setBusy('');
    }
  }

  const scene = project.scenes[selected];

  return (
    <main className="editor-layout">
      {/* Left Sidebar: Controls & Brand Identity */}
      <aside className="panel editor-left-sidebar">
        <div className="logoTitle">
          <div>
            <b>AI</b>
            <div>
              <strong>Motion Studio</strong>
              <small>مولد فيديو موشن فائق الذكاء والديناميكية</small>
            </div>
          </div>
          <SettingsButton />
        </div>

        {/* Brand Colors Picker Box */}
        <BrandColorsPicker colors={brandColors} onChange={handleBrandColorsChange} />

        <label>صف فكرة الفيديو المطلوب (الذكاء الاصطناعي يصمم المشاهد والحركات تلقائياً)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="اكتب فكرة إعلانك أو منتجك هنا..."
        />

        {/* Quick Domain Inspiration Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', margin: '4px 0 10px' }}>
          {[
            { label: '🚀 تطبيق توصيل', p: 'إعلان موشن جرافيك حماسي وسريع لتطبيق توصيل طلبات فوري، يبرز السرعة الفائقة والتتبع الحي والدقة في المواعيد.' },
            { label: '⚡ منصة تقنية وSaaS', p: 'فيديو تعريفي لمنصة سحابية ذكية وأتمتة أعمال بالذكاء الاصطناعي، يبرز الكفاءة والسرعة وسهولة الربط.' },
            { label: '💎 عطور ومنتجات فاخرة', p: 'إعلان سينمائي راقٍ وفاخر لتشكيلة عطور ملكية حصرية، أجواء فخامة وأناقة ملكية تناسب النخبة.' },
            { label: '⚖️ خدمات واستشارات', p: 'فيديو مؤسسي لشركة استشارات قانونية ومالية رائدة، يركز على الموثوقية والسرية والخبرة الاستراتيجية.' }
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(chip.p)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '6px',
                padding: '3px 8px',
                color: '#aaa',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="row">
          <div>
            <label>اللغة</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label>المدة</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              <option value="15">15 ثانية</option>
              <option value="30">30 ثانية</option>
              <option value="60">60 ثانية</option>
            </select>
          </div>
        </div>

        <label className="upload">
          رفع صور وفيديوهات وصوت (اختياري)
          <input
            hidden
            multiple
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm"
            onChange={(e) => upload(e.target.files)}
          />
        </label>
        <label className="upload secondary">
          رفع الشعار (اختياري)
          <input
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => upload(e.target.files, 'logo')}
          />
        </label>

        <div className="assets">
          {assets.map((a) => (
            <span key={a.id}>
              {a.type} · {a.name}
            </span>
          ))}
        </div>

        <button className="primary" disabled={!!busy || isGenerating} onClick={() => generate(false)}>
          {busy || '✨ توليد فيديو موشن فائق الذكاء (AI)'}
        </button>
        <button
          className="secondary"
          disabled={!!busy || isGenerating}
          onClick={() => generate(true)}
          style={{ marginTop: '8px', background: '#1c1f26', border: '1px solid #333', color: '#ddd', fontSize: '11px' }}
        >
          ⚡ توليد فوري بالمخطط الذكي المحلي
        </button>

        {message && <div className="message">{message}</div>}
      </aside>

      {/* Center Column: Video Player & Timeline */}
      <section className="editor-center-column">
        <header>
          <div>
            <strong>{project.title}</strong>
            <small>
              {frames} إطار · {project.fps} FPS · {project.scenes.length} شاشات مستقلة
            </small>
          </div>
          <button onClick={render} disabled={!!busy || isRendering}>
            {isRendering ? 'جارٍ تصدير الفيديو...' : 'تصدير MP4'}
          </button>
        </header>

        <div className="editor-preview-viewport">
          <div
            className="editor-player-frame"
            style={{
              aspectRatio: project.width && project.height ? `${project.width} / ${project.height}` : '9 / 16'
            }}
          >
            <Player
              acknowledgeRemotionLicense
              component={VideoComposition}
              inputProps={{ project }}
              durationInFrames={frames}
              compositionWidth={project.width}
              compositionHeight={project.height}
              fps={project.fps}
              controls
              loop
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                backgroundColor: project.brand?.backgroundColor || '#050606'
              }}
            />
          </div>
        </div>

        {/* Modular Screens Management Bar */}
        <div className="timeline-controls-bar">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="timeline-btn primary-btn"
              onClick={() => setIsTemplateModalOpen(true)}
              title="تصفح جميع قوالب الشاشات المستقلة واختيار قالب"
            >
              🏛️ مكتبة قوالب الشاشات ({SCREEN_TEMPLATES.length})
            </button>
            <button
              type="button"
              className="timeline-btn"
              onClick={() => setIsTemplateModalOpen(true)}
              title="إضافة شاشة جديدة من القوالب"
            >
              + إضافة شاشة
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px' }}>
              الشاشة {selected + 1} من {project.scenes.length}
            </span>
            <button
              type="button"
              className="timeline-btn"
              onClick={() => moveScreen('up')}
              disabled={selected === 0}
              title="تقديم الشاشة للخلف"
            >
              ◀ تقديم
            </button>
            <button
              type="button"
              className="timeline-btn"
              onClick={() => moveScreen('down')}
              disabled={selected === project.scenes.length - 1}
              title="تأخير الشاشة للأمام"
            >
              تأخير ▶
            </button>
            <button
              type="button"
              className="timeline-btn"
              onClick={duplicateCurrentScreen}
              title="نسخ الشاشة الحالية وتكرارها"
            >
              📋 تكرار
            </button>
            <button
              type="button"
              className="timeline-btn"
              onClick={deleteCurrentScreen}
              disabled={project.scenes.length <= 1}
              style={{ color: project.scenes.length > 1 ? '#ff7b7b' : '#666' }}
              title="حذف الشاشة الحالية"
            >
              🗑️ حذف
            </button>
          </div>
        </div>

        <div className="editor-timeline">
          {project.scenes.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSelected(i)}
              className={selected === i ? 'active' : ''}
              style={{ flex: s.durationInFrames }}
            >
              <b>{String(i + 1).padStart(2, '0')}</b>
              <span>{s.type}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Right Sidebar: Scene Inspector & Template/Icon Switcher */}
      <aside className="panel editor-right-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>تعديل الشاشة {selected + 1} من {project.scenes.length}</h3>
          <button
            type="button"
            className="timeline-btn primary-btn"
            style={{ fontSize: '11px', padding: '4px 10px' }}
            onClick={() => setIsTemplateModalOpen(true)}
          >
            🏛️ مكتبة القوالب
          </button>
        </div>

        <div className="sceneList">
          {project.scenes.map((s, i) => (
            <button key={s.id} className={i === selected ? 'active' : ''} onClick={() => setSelected(i)}>
              <span className="scene-template-badge">{s.type}</span>
              {i + 1}. {s.title}
            </button>
          ))}
        </div>

        {scene && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <label style={{ margin: 0 }}>قالب الشاشة (Screen Template)</label>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: brandColors.accentColor,
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                تغيير من المكتبة ↗
              </button>
            </div>
            <select
              value={scene.type}
              onChange={(e) => applyTemplateToCurrent(e.target.value as Scene['type'])}
              style={{ borderColor: `${scene.accent}88`, marginTop: '4px' }}
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.labelAr} ({t.id})
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <label style={{ margin: 0 }}>أيقونة SVG الحركية (لون موحد Solid)</label>
              <button
                type="button"
                onClick={() => setIsIconModalOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: brandColors.accentColor,
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                بحث في 1850+ أيقونة ↗
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
              <div
                onClick={() => setIsIconModalOpen(true)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${scene.iconColor || scene.accent}66`,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="انقر لتغيير الأيقونة"
              >
                {(() => {
                  const val = scene.icon || 'sparkles';
                  if (val.trim().startsWith('<svg')) {
                    return (
                      <div
                        style={{ width: 24, height: 24, color: scene.iconColor || scene.accent }}
                        dangerouslySetInnerHTML={{ __html: val }}
                      />
                    );
                  }
                  if (val.startsWith('http') || val.startsWith('data:')) {
                    return (
                      <img src={val} alt="icon" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                    );
                  }
                  const IconComp = resolveLucideIcon(val) as React.ComponentType<any>;
                  return <IconComp size={24} color={scene.iconColor || scene.accent} />;
                })()}
              </div>

              <button
                type="button"
                className="timeline-btn primary-btn"
                style={{ flex: 1, padding: '9px 12px', fontSize: '11px', justifyContent: 'center' }}
                onClick={() => setIsIconModalOpen(true)}
              >
                🔍 استعراض مكتبة الأيقونات (1850+ وSVG مخصص)
              </button>
            </div>

            <select
              value={scene.icon || 'sparkles'}
              onChange={(e) => updateScene('icon', e.target.value)}
              style={{ borderColor: `${scene.accent}88`, marginTop: '6px' }}
            >
              {ICON_NAMES.map((ico) => (
                <option key={ico.id} value={ico.id}>
                  {ico.labelAr} — {ico.id}
                </option>
              ))}
            </select>

            <div className="row" style={{ marginTop: '8px' }}>
              <div>
                <label>لون الأيقونة (Solid Color - لون موحد)</label>
                <div className="color-picker-box">
                  <input
                    type="color"
                    value={scene.iconColor || scene.accent}
                    onChange={(e) => updateScene('iconColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={scene.iconColor || scene.accent}
                    onChange={(e) => updateScene('iconColor', e.target.value)}
                    className="hex-input"
                  />
                </div>
              </div>
              <div>
                <label>لون تمييز المشهد (Accent)</label>
                <div className="color-picker-box">
                  <input
                    type="color"
                    value={scene.accent}
                    onChange={(e) => updateScene('accent', e.target.value)}
                  />
                  <input
                    type="text"
                    value={scene.accent}
                    onChange={(e) => updateScene('accent', e.target.value)}
                    className="hex-input"
                  />
                </div>
              </div>
            </div>

            <div className="row" style={{ marginTop: '8px' }}>
              <div>
                <label>خلفية المشهد (ديناميكي)</label>
                <div className="color-picker-box">
                  <input
                    type="color"
                    value={scene.backgroundColor || '#07080a'}
                    onChange={(e) => updateScene('backgroundColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={scene.backgroundColor || '#07080a'}
                    onChange={(e) => updateScene('backgroundColor', e.target.value)}
                    className="hex-input"
                  />
                </div>
              </div>
              <div>
                <label>نصوص المشهد (ديناميكي)</label>
                <div className="color-picker-box">
                  <input
                    type="color"
                    value={scene.textColor || '#ffffff'}
                    onChange={(e) => updateScene('textColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={scene.textColor || '#ffffff'}
                    onChange={(e) => updateScene('textColor', e.target.value)}
                    className="hex-input"
                  />
                </div>
              </div>
            </div>

            <div className="row" style={{ marginTop: '8px' }}>
              <div>
                <label>نمط الخلفية الحركية</label>
                <select
                  value={scene.backgroundStyle || 'cinematic'}
                  onChange={(e) => updateScene('backgroundStyle', e.target.value as any)}
                >
                  <option value="mesh-gradient">تدرج سائل (Fluid Mesh)</option>
                  <option value="aurora">شفق أورورا المشع (Aurora)</option>
                  <option value="neon-cyber">شبكة سايبر (Cyber Grid)</option>
                  <option value="gradient-grid">شبكة هندسية (Grid)</option>
                  <option value="brand-glow">توهج الهوية (Brand Glow)</option>
                  <option value="bold-duotone">ثنائي اللون (Duo-Tone)</option>
                  <option value="studio-dark">استوديو فاخر (Studio)</option>
                  <option value="cinematic">سينمائي ناعم (Cinematic)</option>
                </select>
              </div>
              <div>
                <label>توزيع وتكوين العناصر</label>
                <select
                  value={scene.layout || 'center'}
                  onChange={(e) => updateScene('layout', e.target.value as any)}
                >
                  <option value="center">مركزي متوهج (Center)</option>
                  <option value="editorial">تحريري عصري (Editorial)</option>
                  <option value="split-left">تقسيم: يسار (Split Left)</option>
                  <option value="split-right">تقسيم: يمين (Split Right)</option>
                </select>
              </div>
            </div>

            <div className="row" style={{ marginTop: '8px' }}>
              <div>
                <label>حركة النصوص (Motion)</label>
                <select
                  value={scene.textAnimation || 'word-stagger'}
                  onChange={(e) => updateScene('textAnimation', e.target.value as any)}
                >
                  <option value="pop-elastic">ارتداد مرن (Elastic Pop)</option>
                  <option value="3d-flip">دوران 3D (3D Flip)</option>
                  <option value="word-stagger">تتابع الكلمات (Stagger)</option>
                  <option value="mask-reveal">كشف القناع (Mask)</option>
                  <option value="scale-blur">تكبير مع صفاء (Scale Blur)</option>
                  <option value="slide">انزلاق جانبي (Slide)</option>
                  <option value="rise">صعود ناعم (Rise)</option>
                </select>
              </div>
              <div>
                <label>حركة الكاميرا</label>
                <select
                  value={scene.camera || 'push-in'}
                  onChange={(e) => updateScene('camera', e.target.value as any)}
                >
                  <option value="push-in">تقريب سينمائي (Push In)</option>
                  <option value="pull-out">ابتعاد (Pull Out)</option>
                  <option value="pan-right">تحرك يمين (Pan Right)</option>
                  <option value="pan-left">تحرك يسار (Pan Left)</option>
                  <option value="drift">انجراف عائم (Drift)</option>
                  <option value="static">ثابت (Static)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <label>الانتقال البصري (Transition)</label>
              <select
                value={scene.transition || 'light-sweep'}
                onChange={(e) => updateScene('transition', e.target.value as any)}
              >
                <option value="light-sweep">مسح ضوئي (Light Sweep)</option>
                <option value="zoom">تكبير انسيابي (Zoom)</option>
                <option value="film-burn">احتراق سينمائي (Film Burn)</option>
                <option value="wipe">مسح شريطي (Color Wipe)</option>
                <option value="fade">تلاشي ناعم (Fade)</option>
              </select>
            </div>

            <label>العنوان الصغير (Eyebrow)</label>
            <input value={scene.eyebrow} onChange={(e) => updateScene('eyebrow', e.target.value)} />

            <label>العنوان الرئيسي (Title)</label>
            <textarea rows={3} value={scene.title} onChange={(e) => updateScene('title', e.target.value)} />

            <label>الوصف / النص التوضيحي (Subtitle)</label>
            <textarea rows={4} value={scene.subtitle} onChange={(e) => updateScene('subtitle', e.target.value)} />

            {['statistic'].includes(scene.type) && (
              <>
                <label>الرقم / النسبة (Statistic)</label>
                <input
                  value={scene.statistic || ''}
                  onChange={(e) => updateScene('statistic', e.target.value)}
                  placeholder="+150% أو 99.8%"
                />
              </>
            )}

            {['call-to-action'].includes(scene.type) && (
              <>
                <label>نص زر الإجراء (Call to Action)</label>
                <input
                  value={scene.cta || ''}
                  onChange={(e) => updateScene('cta', e.target.value)}
                  placeholder="ابدأ تجربتك الآن"
                />
              </>
            )}

            {['feature-cards', 'process', 'comparison'].includes(scene.type) && (
              <>
                <label>عناصر وبطاقات المشهد (سطر لكل عنصر)</label>
                <textarea
                  rows={4}
                  value={(scene.items || []).join('\n')}
                  onChange={(e) =>
                    updateScene(
                      'items',
                      e.target.value.split('\n').filter((x) => x.trim().length > 0)
                    )
                  }
                  placeholder="عنصر 1&#10;عنصر 2&#10;عنصر 3"
                />
              </>
            )}

            <label>مدة المشهد</label>
            <input value={`${(scene.durationInFrames / project.fps).toFixed(1)} ثانية (${scene.durationInFrames} إطار)`} disabled />
          </>
        )}

        <div className="tip">
          💡 كل شاشة هي قالب مستقل بذاته! يمكنك تطبيق أي قالب من مكتبة القوالب أو إضافة وحذف وتكرار الشاشات بحرية تامة.
        </div>
      </aside>

      {/* Screen Template Library Modal */}
      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        currentSceneIndex={selected}
        onApplyTemplate={applyTemplateToCurrent}
        onAddNewScreen={addNewScreenWithTemplate}
        accentColor={scene?.accent || brandColors.accentColor}
      />

      {/* Motion Icon Picker Modal (1850+ Lucide Icons + Custom SVG) */}
      <IconPickerModal
        isOpen={isIconModalOpen}
        onClose={() => setIsIconModalOpen(false)}
        currentIcon={scene?.icon || 'sparkles'}
        onSelectIcon={(iconNameOrSvg) => {
          updateScene('icon', iconNameOrSvg);
        }}
        accentColor={scene?.iconColor || scene?.accent || brandColors.accentColor}
      />
    </main>
  );
}
