'use client';
import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { POPULAR_ICONS, resolveLucideIcon, toPascalCase } from '@/remotion/motion/icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentIcon: string;
  onSelectIcon: (iconNameOrSvg: string) => void;
  accentColor: string;
}

const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'business', label: 'بيزنس ونمو' },
  { id: 'tech', label: 'تقنية وسحاب' },
  { id: 'security', label: 'أمان وثقة' },
  { id: 'social', label: 'تواصل ومجتمع' },
  { id: 'commerce', label: 'تجارة وتسوق' },
  { id: 'media', label: 'وسائط ومحتوى' },
  { id: 'ideas', label: 'أفكار وتخطيط' }
];

export const IconPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentIcon,
  onSelectIcon,
  accentColor
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'custom'>('library');
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [customSvg, setCustomSvg] = useState('');

  // Extract all Lucide icon names list (cached)
  const allLucideNames = useMemo(() => {
    return Object.keys(LucideIcons.icons || {});
  }, []);

  // Filtered icons
  const filteredPopular = useMemo(() => {
    const q = search.trim().toLowerCase();
    return POPULAR_ICONS.filter((item) => {
      const matchCat = selectedCat === 'all' || item.category === selectedCat;
      const matchQuery =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.labelAr.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [search, selectedCat]);

  // If user searched for something not in popular list, search in all 1857 Lucide icons
  const extraSearchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const popularNames = new Set(POPULAR_ICONS.map((p) => p.name.toLowerCase()));
    return allLucideNames
      .filter((name) => name.toLowerCase().includes(q) && !popularNames.has(name.toLowerCase()))
      .slice(0, 80);
  }, [search, allLucideNames]);

  if (!isOpen) return null;

  return (
    <div className="icon-modal-backdrop" onClick={onClose}>
      <div className="icon-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="icon-modal-header">
          <div>
            <h3>🎨 مكتبة الأيقونات الحركية العالمية</h3>
            <small>اختر من بين أكثر من 1,800 أيقونة فيكتور احترافية، أو أدرج كود SVG مخصص</small>
          </div>
          <button className="icon-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="icon-modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            📚 استعراض المكتبة (1800+ أيقونة)
          </button>
          <button
            className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            ⚡ كود SVG مخصص / رابط خارجي
          </button>
        </div>

        {activeTab === 'library' ? (
          <>
            {/* Search & Category Filter */}
            <div className="icon-modal-search-row">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم (مثال: rocket, heart, shield, car, cloud, store...)"
                autoFocus
                className="icon-search-input"
              />
            </div>

            <div className="icon-categories-row">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`cat-pill ${selectedCat === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCat(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Icons Grid */}
            <div className="icon-grid-container">
              {/* Popular / Categorized Icons */}
              {filteredPopular.map((item) => {
                const IconComp = (LucideIcons as any)[item.name] || LucideIcons.Sparkles;
                const isSelected = currentIcon.toLowerCase() === item.id.toLowerCase();
                return (
                  <button
                    key={item.id}
                    className={`icon-grid-cell ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectIcon(item.id);
                      onClose();
                    }}
                    title={item.name}
                  >
                    <div className="icon-symbol" style={{ color: isSelected ? accentColor : '#e2e8f0' }}>
                      <IconComp size={30} strokeWidth={1.8} />
                    </div>
                    <span className="icon-name-ar">{item.labelAr}</span>
                    <span className="icon-name-en">{item.id}</span>
                  </button>
                );
              })}

              {/* Extra Lucide Search Results */}
              {extraSearchResults.map((name) => {
                const IconComp = (LucideIcons.icons as any)[name] || (LucideIcons as any)[name];
                if (!IconComp) return null;
                const isSelected = currentIcon.toLowerCase() === name.toLowerCase();
                return (
                  <button
                    key={name}
                    className={`icon-grid-cell ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectIcon(name);
                      onClose();
                    }}
                    title={name}
                  >
                    <div className="icon-symbol" style={{ color: isSelected ? accentColor : '#e2e8f0' }}>
                      <IconComp size={30} strokeWidth={1.8} />
                    </div>
                    <span className="icon-name-en">{name}</span>
                  </button>
                );
              })}

              {filteredPopular.length === 0 && extraSearchResults.length === 0 && (
                <div className="no-icons-found">
                  لم يتم العثور على أيقونة تطابق بحثك. جرّب كتابة كلمة أخرى بالإنجليزية (مثل: database, wifi, user, file).
                </div>
              )}
            </div>
          </>
        ) : (
          /* Custom SVG Tab */
          <div className="custom-svg-container">
            <p>
              يمكنك نسخ ولصق أي كود <code>&lt;svg&gt;</code> من أي موقع (مثل Flaticon, Iconify, Figma) أو إدخال رابط SVG خارجي، وسيتلون بلون الهوية ويتحرك في المشهد:
            </p>
            <textarea
              rows={8}
              value={customSvg}
              onChange={(e) => setCustomSvg(e.target.value)}
              placeholder="الصق كود <svg ...>...</svg> هنا، أو اكتب رابط أيقونة SVG مثل: https://example.com/icon.svg"
              className="custom-svg-textarea"
            />
            {customSvg.trim().startsWith('<svg') && (
              <div className="custom-svg-preview">
                <span>معاينة كود SVG بلون المشهد الموحد:</span>
                <div
                  dangerouslySetInnerHTML={{ __html: customSvg }}
                  style={{
                    width: 60,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: accentColor,
                    stroke: accentColor,
                    margin: '14px auto'
                  }}
                />
              </div>
            )}
            <button
              className="primary"
              style={{ marginTop: 12 }}
              disabled={!customSvg.trim()}
              onClick={() => {
                onSelectIcon(customSvg.trim());
                onClose();
              }}
            >
              ✓ تطبيق هذا الـ SVG على المشهد
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
