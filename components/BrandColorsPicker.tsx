'use client';
import React from 'react';

export interface BrandColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export const BRAND_PRESETS: {
  name: string;
  nameEn: string;
  colors: BrandColors;
}[] = [
  {
    name: 'ذهبي ملكي',
    nameEn: 'Royal Gold',
    colors: {
      primaryColor: '#d4af37',
      secondaryColor: '#1e293b',
      accentColor: '#f59e0b'
    }
  },
  {
    name: 'أزرق تقني',
    nameEn: 'Cyber Blue',
    colors: {
      primaryColor: '#3b82f6',
      secondaryColor: '#1d4ed8',
      accentColor: '#06b6d4'
    }
  },
  {
    name: 'بنفسجي إبداعي',
    nameEn: 'Modern Violet',
    colors: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#6d28d9',
      accentColor: '#ec4899'
    }
  },
  {
    name: 'أخضر نمو',
    nameEn: 'Emerald Growth',
    colors: {
      primaryColor: '#10b981',
      secondaryColor: '#047857',
      accentColor: '#34d399'
    }
  },
  {
    name: 'برتقالي حيوي',
    nameEn: 'Vibrant Sunset',
    colors: {
      primaryColor: '#f97316',
      secondaryColor: '#c2410c',
      accentColor: '#fbbf24'
    }
  },
  {
    name: 'أحمر نخبوي',
    nameEn: 'Crimson Bold',
    colors: {
      primaryColor: '#ef4444',
      secondaryColor: '#991b1b',
      accentColor: '#f87171'
    }
  },
  {
    name: 'أبيض وأسود فخم',
    nameEn: 'Minimal Monochrome',
    colors: {
      primaryColor: '#f8fafc',
      secondaryColor: '#64748b',
      accentColor: '#38bdf8'
    }
  }
];

interface Props {
  colors: BrandColors;
  onChange: (colors: BrandColors) => void;
}

export const BrandColorsPicker: React.FC<Props> = ({ colors, onChange }) => {
  const updateColor = (key: keyof BrandColors, value: string) => {
    onChange({
      ...colors,
      [key]: value
    });
  };

  return (
    <div className="brand-picker-card">
      <div className="brand-picker-header">
        <div>
          <span className="brand-picker-title">🎨 ألوان هوية الشركة</span>
          <small className="brand-picker-subtitle">
            حدد درجات هوية شركتك، والذكاء الاصطناعي يهندس الخلفيات والنصوص والأيقونات ديناميكياً
          </small>
        </div>
        <div
          className="brand-preview-pill"
          style={{
            background: `linear-gradient(90deg, ${colors.primaryColor}, ${colors.secondaryColor}, ${colors.accentColor})`
          }}
          title="تدرج ألوان الهوية"
        />
      </div>

      {/* Presets Chips */}
      <div className="brand-presets-row">
        {BRAND_PRESETS.map((p) => {
          const isSelected =
            colors.primaryColor.toLowerCase() === p.colors.primaryColor.toLowerCase() &&
            colors.secondaryColor.toLowerCase() === p.colors.secondaryColor.toLowerCase();

          return (
            <button
              key={p.name}
              type="button"
              className={`preset-chip ${isSelected ? 'active' : ''}`}
              onClick={() => onChange(p.colors)}
              title={p.nameEn}
            >
              <span
                className="chip-dot"
                style={{
                  background: `linear-gradient(135deg, ${p.colors.primaryColor}, ${p.colors.accentColor})`
                }}
              />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3 Identity Color Inputs */}
      <div className="color-inputs-grid-3">
        <div className="color-input-item">
          <label>اللون الأساسي</label>
          <div className="color-picker-box">
            <input
              type="color"
              value={colors.primaryColor}
              onChange={(e) => updateColor('primaryColor', e.target.value)}
            />
            <input
              type="text"
              value={colors.primaryColor}
              onChange={(e) => updateColor('primaryColor', e.target.value)}
              className="hex-input"
            />
          </div>
        </div>

        <div className="color-input-item">
          <label>اللون الثانوي</label>
          <div className="color-picker-box">
            <input
              type="color"
              value={colors.secondaryColor}
              onChange={(e) => updateColor('secondaryColor', e.target.value)}
            />
            <input
              type="text"
              value={colors.secondaryColor}
              onChange={(e) => updateColor('secondaryColor', e.target.value)}
              className="hex-input"
            />
          </div>
        </div>

        <div className="color-input-item">
          <label>لون التمييز (Accent)</label>
          <div className="color-picker-box">
            <input
              type="color"
              value={colors.accentColor}
              onChange={(e) => updateColor('accentColor', e.target.value)}
            />
            <input
              type="text"
              value={colors.accentColor}
              onChange={(e) => updateColor('accentColor', e.target.value)}
              className="hex-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
