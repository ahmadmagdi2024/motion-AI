'use client';
import React, { useState } from 'react';
import type { Scene } from '@/lib/schema';

export interface TemplateDefinition {
  id: Scene['type'];
  nameAr: string;
  nameEn: string;
  category: 'opening' | 'features' | 'metrics' | 'motion';
  descAr: string;
  recommendedUse: string;
  icon: string;
  badgeTag: string;
}

export const SCREEN_TEMPLATES: TemplateDefinition[] = [
  // الافتتاحية والهوية
  {
    id: 'icon-badge',
    nameAr: 'شاشة الأيقونة المجسمة (Hero Badge)',
    nameEn: 'Icon Badge Hero',
    category: 'opening',
    descAr: 'شارة مركزية زجاجية فاخرة تحتضن أيقونة SVG متحركة مع حلقات مدارية دوارة وعناوين قوية.',
    recommendedUse: 'الافتتاح، إبراز الهوية، أو تسليط الضوء على فكرة جوهرية.',
    icon: '✨',
    badgeTag: 'أيقونة مركزية مجسمة'
  },
  {
    id: 'cinematic-opening',
    nameAr: 'افتتاحية سينمائية فاخرة (Cinematic Opening)',
    nameEn: 'Cinematic Opening',
    category: 'opening',
    descAr: 'مشهد خطافي يبدأ به الفيديو، مزود بإطار هندسي حركي، تدرج ضوئي، والشعار أو أيقونة الهوية.',
    recommendedUse: 'المشهد الأول في الفيديو لجذب الانتباه خلال أول 3 ثوانٍ.',
    icon: '🎬',
    badgeTag: 'افتتاحية وهالة سينمائية'
  },
  {
    id: 'logo-reveal',
    nameAr: 'كشف الشعار والهوية (Logo Reveal)',
    nameEn: 'Logo Reveal',
    category: 'opening',
    descAr: 'كشف فخم للشعار أو اسم الشركة مع مسح ضوئي ناعم وحلقات ضوئية دوارة.',
    recommendedUse: 'البداية الرسمية أو قبل المشهد الختامي.',
    icon: '💎',
    badgeTag: 'كشف الهوية والشعار'
  },

  // المميزات والشرح
  {
    id: 'feature-cards',
    nameAr: 'بطاقات المميزات المتعددة (Feature Cards)',
    nameEn: 'Feature Cards Grid',
    category: 'features',
    descAr: 'بطاقات زجاجية تظهر بمرونة متتابعة، كل بطاقة تحتوي على أيقونة SVG خاصة ونص توضيحي.',
    recommendedUse: 'استعراض 3 أو 4 ركائز أو خدمات رئيسية للشركة.',
    icon: '🗂️',
    badgeTag: 'بطاقات متتالية بأيقونات'
  },
  {
    id: 'process',
    nameAr: 'خطوات ومراحل العمل (Step-by-step Process)',
    nameEn: 'Step-by-step Process',
    category: 'features',
    descAr: 'مخطط زمني تفاعلي يستعرض مراحل الخدمة أو آلية العمل خطوة بخطوة مع أرقام وأيقونات.',
    recommendedUse: 'شرح آلية العمل (Concept -> Design -> Motion -> Launch).',
    icon: '🔢',
    badgeTag: 'خطوات رقمية متسلسلة'
  },
  {
    id: 'split-showcase',
    nameAr: 'استعراض مقسم ثنائي (Split Showcase)',
    nameEn: 'Split Showcase',
    category: 'features',
    descAr: 'شاشة منقسمة تستعرض صورة/فيديو/أيقونة على جانب، والنص التحريري على الجانب المقابل.',
    recommendedUse: 'الموازنة بين مادة مرئية ونص تسويقي واضح.',
    icon: '🌓',
    badgeTag: 'شاشة مقسمة بصرياً'
  },
  {
    id: 'product-hero',
    nameAr: 'تسليط الضوء على المنتج (Product Spotlight)',
    nameEn: 'Product Spotlight',
    category: 'features',
    descAr: 'منصة مضيئة دائرية في المنتصف تبرز المنتج أو رمز الخدمة مع مؤثرات إضاءة استوديو.',
    recommendedUse: 'إطلاق تطبيق، منصة برمجية، أو منتج عيني.',
    icon: '🛍️',
    badgeTag: 'منصة إضاءة مركزية'
  },

  // الإقناع والأرقام
  {
    id: 'statistic',
    nameAr: 'إحصائيات وأرقام قياسية (Statistic & Metrics)',
    nameEn: 'Statistic & Metrics',
    category: 'metrics',
    descAr: 'رقم أو نسبة مئوية ضخمة تظهر بأسلوب العداد الحركي مع حلقات متحدة المركز وأيقونة نمو.',
    recommendedUse: 'عرض الأثر: (+180% نمو، 99.9% أمان، 500+ عميل).',
    icon: '📈',
    badgeTag: 'رقم قياسي متحرك'
  },
  {
    id: 'comparison',
    nameAr: 'مقارنة وتأثير قبل وبعد (Comparison)',
    nameEn: 'Comparison / Before & After',
    category: 'metrics',
    descAr: 'بطاقتان متقابلتان: بطاقة التحدي/قبل، وبطاقة الحل المضيء/بعد بأيقونات ملونة متباينة.',
    recommendedUse: 'إقناع العميل بتفوق خدماتك على الطرق التقليدية القديمة.',
    icon: '⚖️',
    badgeTag: 'مقارنة مشكلة وحل'
  },
  {
    id: 'quote-highlight',
    nameAr: 'اقتباس ورؤية ملهمة (Quote / Philosophy)',
    nameEn: 'Quote / Philosophy',
    category: 'metrics',
    descAr: 'عرض رؤية الشركة، شهادة عميل، أو عبارة ملهمة بين أقواس تنصيص أنيقة بألوان الهوية.',
    recommendedUse: 'إبراز قيم الشركة، رسالتها، أو آراء العملاء المميزين.',
    icon: '💬',
    badgeTag: 'اقتباس عريض وفاخر'
  },

  // الحركة والخاتمة
  {
    id: 'kinetic-typography',
    nameAr: 'نصوص كينيتك حركية سريعة (Kinetic Typography)',
    nameEn: 'Kinetic Typography',
    category: 'motion',
    descAr: 'حركة نصوص إيقاعية سريعة متدرجة تملأ الشاشة مع تكرار متحرك في الخلفية.',
    recommendedUse: 'المشاهد الحماسية التي تتطلب طاقة عالية وكلمات مفتاحية قوية.',
    icon: '⚡',
    badgeTag: 'إيقاع نصي حركي'
  },
  {
    id: 'video-text',
    nameAr: 'فيديو سينمائي مع نص (Video with Text)',
    nameEn: 'Video with Text',
    category: 'motion',
    descAr: 'عرض فيديو أو صورة سينمائية مع تدريج لوني وخط فاصل مضيء ونصوص في الأسفل.',
    recommendedUse: 'استعراض لقطات حية أو فيديوهات مصورة للشركة.',
    icon: '🎥',
    badgeTag: 'فيديو كامل مع طبقة نصية'
  },
  {
    id: 'call-to-action',
    nameAr: 'دعوة لاتخاذ إجراء وزر تفاعلي (Call to Action)',
    nameEn: 'Call to Action',
    category: 'motion',
    descAr: 'المشهد الختامي الحاسم: زر تفاعلي متوهج يحتوي على أيقونة انطلاق ودعوة واضحة للعمل.',
    recommendedUse: 'ختام الفيديو لتوجيه المشاهد للخطوة القادمة (تواصل، سجل، اطلب).',
    icon: '🚀',
    badgeTag: 'زر إجراء وخاتمة حاسمة'
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSceneIndex: number;
  onApplyTemplate: (templateId: Scene['type']) => void;
  onAddNewScreen: (templateId: Scene['type']) => void;
  accentColor: string;
}

export const TemplateLibraryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentSceneIndex,
  onApplyTemplate,
  onAddNewScreen,
  accentColor
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = SCREEN_TEMPLATES.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  return (
    <div className="icon-modal-backdrop" onClick={onClose}>
      <div className="template-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="icon-modal-header">
          <div>
            <h3>🏛️ مكتبة قوالب الشاشات والمشاهد المستقلة</h3>
            <small>
              كل شاشة هي قالب حركي منفصل ومستقل. يمكنك تطبيق القالب على الشاشة الحالية ({currentSceneIndex + 1}) أو إضافته كشاشة جديدة للفيديو.
            </small>
          </div>
          <button className="icon-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Category Filter Pills */}
        <div className="icon-categories-row" style={{ padding: '0 20px', marginBottom: 16 }}>
          {[
            { id: 'all', label: 'جميع قوالب الشاشات' },
            { id: 'opening', label: 'الافتتاحية والهوية' },
            { id: 'features', label: 'المميزات والشرح' },
            { id: 'metrics', label: 'الإقناع والأرقام' },
            { id: 'motion', label: 'الحركة والخاتمة' }
          ].map((cat) => (
            <button
              key={cat.id}
              className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="template-cards-grid">
          {filtered.map((tpl) => (
            <div key={tpl.id} className="template-card-item">
              <div className="template-card-header">
                <span className="template-card-icon">{tpl.icon}</span>
                <div>
                  <span className="template-card-tag">{tpl.badgeTag}</span>
                  <h4 className="template-card-title">{tpl.nameAr}</h4>
                  <small className="template-card-en">{tpl.nameEn}</small>
                </div>
              </div>

              <p className="template-card-desc">{tpl.descAr}</p>
              <div className="template-card-use">
                <b>💡 الاستخدام المثالي:</b> {tpl.recommendedUse}
              </div>

              <div className="template-card-actions">
                <button
                  type="button"
                  className="apply-btn"
                  onClick={() => {
                    onApplyTemplate(tpl.id);
                    onClose();
                  }}
                  style={{ borderColor: `${accentColor}66`, color: accentColor }}
                >
                  ✓ تطبيق على المشهد الحالي ({currentSceneIndex + 1})
                </button>
                <button
                  type="button"
                  className="add-new-btn"
                  onClick={() => {
                    onAddNewScreen(tpl.id);
                    onClose();
                  }}
                >
                  + إضافة كشاشة جديدة للفيديو
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
