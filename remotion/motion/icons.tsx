import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import * as LucideIcons from 'lucide-react';

export interface IconItem {
  id: string;
  name: string;
  category: string;
  labelAr: string;
}

export const POPULAR_ICONS: IconItem[] = [
  // نمو وبيزنس وإطلاق
  { id: 'rocket', name: 'Rocket', category: 'business', labelAr: 'صاروخ وانطلاق' },
  { id: 'trending-up', name: 'TrendingUp', category: 'business', labelAr: 'مؤشر صاعد ونمو' },
  { id: 'chart-bar', name: 'BarChart3', category: 'business', labelAr: 'رسم بياني وأرقام' },
  { id: 'target', name: 'Target', category: 'business', labelAr: 'هدف استراتيجي ودقة' },
  { id: 'trophy', name: 'Trophy', category: 'business', labelAr: 'كأس الإنجاز' },
  { id: 'award', name: 'Award', category: 'business', labelAr: 'وسام وجائزة' },
  { id: 'briefcase', name: 'Briefcase', category: 'business', labelAr: 'حقيبة أعمال وشركات' },
  { id: 'dollar-sign', name: 'DollarSign', category: 'business', labelAr: 'عائد وأرباح مالية' },
  { id: 'wallet', name: 'Wallet', category: 'business', labelAr: 'محفظة ومدفوعات' },
  { id: 'credit-card', name: 'CreditCard', category: 'business', labelAr: 'بطاقة دفع وتجارة' },
  { id: 'line-chart', name: 'LineChart', category: 'business', labelAr: 'مخطط بياني متقدم' },

  // تقنية وذكاء اصطناعي وحلول رقمية
  { id: 'sparkles', name: 'Sparkles', category: 'tech', labelAr: 'ذكاء اصطناعي وبريق' },
  { id: 'cpu', name: 'Cpu', category: 'tech', labelAr: 'معالج وتقنية سحابية' },
  { id: 'zap', name: 'Zap', category: 'tech', labelAr: 'سرعة فائقة وطاقة' },
  { id: 'brain', name: 'Brain', category: 'tech', labelAr: 'عقل وذكاء اصطناعي' },
  { id: 'code', name: 'Code2', category: 'tech', labelAr: 'برمجة وتطوير' },
  { id: 'database', name: 'Database', category: 'tech', labelAr: 'قواعد بيانات وسحاب' },
  { id: 'layers', name: 'Layers', category: 'tech', labelAr: 'طبقات وحلول متكاملة' },
  { id: 'server', name: 'Server', category: 'tech', labelAr: 'خوادم وبنية تحتية' },
  { id: 'cloud', name: 'Cloud', category: 'tech', labelAr: 'سحابة وتخزين' },
  { id: 'smartphone', name: 'Smartphone', category: 'tech', labelAr: 'تطبيق هاتف ذكي' },
  { id: 'laptop', name: 'Laptop', category: 'tech', labelAr: 'برمجيات ومنصات' },
  { id: 'wifi', name: 'Wifi', category: 'tech', labelAr: 'اتصال وشبكات' },

  // أمان وثقة وضمان
  { id: 'shield', name: 'Shield', category: 'security', labelAr: 'درع حماية وأمان' },
  { id: 'shield-check', name: 'ShieldCheck', category: 'security', labelAr: 'أمان معتمد وموثق' },
  { id: 'lock', name: 'Lock', category: 'security', labelAr: 'خصوصية وتشفير' },
  { id: 'badge-check', name: 'BadgeCheck', category: 'security', labelAr: 'شارة تحقق وضمان' },
  { id: 'check-circle', name: 'CheckCircle2', category: 'security', labelAr: 'إنجاز وجودة مؤكدة' },
  { id: 'key', name: 'Key', category: 'security', labelAr: 'مفتاح أمان وحلول' },

  // تواصل ومجتمع وعملاء
  { id: 'users', name: 'Users', category: 'social', labelAr: 'فريق عمل ومجتمع' },
  { id: 'user-check', name: 'UserCheck', category: 'social', labelAr: 'عملاء موثوقون' },
  { id: 'globe', name: 'Globe', category: 'social', labelAr: 'عالمية وانتشار' },
  { id: 'heart', name: 'Heart', category: 'social', labelAr: 'شغف ورضا العملاء' },
  { id: 'star', name: 'Star', category: 'social', labelAr: 'تقييمات خمس نجوم' },
  { id: 'message-square', name: 'MessageSquare', category: 'social', labelAr: 'تواصل ودعم فوري' },
  { id: 'phone', name: 'Phone', category: 'social', labelAr: 'اتصال ومبيعات' },
  { id: 'mail', name: 'Mail', category: 'social', labelAr: 'بريد ورسائل' },
  { id: 'send', name: 'Send', category: 'social', labelAr: 'إرسال وتفاعل' },

  // تسوق وتجارة ومنتجات
  { id: 'shopping-cart', name: 'ShoppingCart', category: 'commerce', labelAr: 'سلة تسوق ومنتجات' },
  { id: 'shopping-bag', name: 'ShoppingBag', category: 'commerce', labelAr: 'حقيبة شراء ومتجر' },
  { id: 'package', name: 'Package', category: 'commerce', labelAr: 'طرد وتوصيل سريع' },
  { id: 'truck', name: 'Truck', category: 'commerce', labelAr: 'شحن ولوجستيات' },
  { id: 'store', name: 'Store', category: 'commerce', labelAr: 'متجر إلكتروني ومقر' },
  { id: 'tag', name: 'Tag', category: 'commerce', labelAr: 'عروض وخصومات' },

  // وسائط وإعلام وإبداع
  { id: 'video', name: 'Video', category: 'media', labelAr: 'كاميرا وإنتاج فيديو' },
  { id: 'play', name: 'Play', category: 'media', labelAr: 'تشغيل ومحتوى مرئي' },
  { id: 'music', name: 'Music', category: 'media', labelAr: 'موسيقى وصوتيات' },
  { id: 'mic', name: 'Mic', category: 'media', labelAr: 'تسجيل وبودكاست' },
  { id: 'camera', name: 'Camera', category: 'media', labelAr: 'تصوير فوتوغرافي' },
  { id: 'image', name: 'Image', category: 'media', labelAr: 'معرض صور' },

  // تفكير وتخطيط ووقت
  { id: 'lightbulb', name: 'Lightbulb', category: 'ideas', labelAr: 'فكرة وحلول ابتكارية' },
  { id: 'compass', name: 'Compass', category: 'ideas', labelAr: 'رؤية وتوجيه استراتيجي' },
  { id: 'clock', name: 'Clock', category: 'ideas', labelAr: 'التزام بالمواعيد وسرعة' },
  { id: 'calendar', name: 'Calendar', category: 'ideas', labelAr: 'جدولة وخطة عمل' },
  { id: 'settings', name: 'Settings', category: 'ideas', labelAr: 'إعدادات وتخصيص' },
  { id: 'search', name: 'Search', category: 'ideas', labelAr: 'بحث وتحليل سوق' }
];

export const ICON_NAMES = POPULAR_ICONS;

export function toPascalCase(str: string): string {
  if (!str) return 'Sparkles';
  return str
    .replace(/[-_\s]+(\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function resolveLucideIcon(iconName: string): React.ComponentType<any> | null {
  if (!iconName) return LucideIcons.Sparkles;
  const pascal = toPascalCase(iconName);

  // 1. Direct match on LucideIcons
  if ((LucideIcons as any)[pascal]) {
    return (LucideIcons as any)[pascal];
  }

  // 2. Lookup in LucideIcons.icons dictionary
  if ((LucideIcons as any).icons && (LucideIcons as any).icons[pascal]) {
    return (LucideIcons as any).icons[pascal];
  }

  // 3. Match from popular mapped list
  const mapped = POPULAR_ICONS.find(
    (item) => item.id.toLowerCase() === iconName.toLowerCase() || item.name.toLowerCase() === iconName.toLowerCase()
  );
  if (mapped && (LucideIcons as any)[mapped.name]) {
    return (LucideIcons as any)[mapped.name];
  }

  // 4. Default fallback icon
  return LucideIcons.Sparkles;
}

export interface MotionIconProps {
  name?: string;
  size?: number;
  color?: string; // Solid single color (No gradient)
  glow?: boolean;
  delay?: number;
  badge?: boolean;
  badgeBg?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const MotionIcon: React.FC<MotionIconProps> = ({
  name = 'sparkles',
  size = 72,
  color = '#d8b56b',
  glow = true,
  delay = 5,
  badge = false,
  badgeBg,
  style = {}
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Elastic pop-in entrance
  const pop = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 12,
      stiffness: 110,
      mass: 0.8
    }
  });

  // Micro floating animation
  const floatY = Math.sin((frame + delay * 12) / 16) * 4;
  const floatRotate = Math.sin((frame + delay * 12) / 24) * 2;

  // Solid color with NO gradient
  const solidColor = color || '#ffffff';

  // Check if custom raw SVG string was provided (e.g. from an external library)
  const isRawSvg = typeof name === 'string' && name.trim().startsWith('<svg');
  const isSvgUrl = typeof name === 'string' && (name.startsWith('http://') || name.startsWith('https://') || name.endsWith('.svg'));

  let iconNode: React.ReactNode = null;

  if (isRawSvg) {
    iconNode = (
      <div
        dangerouslySetInnerHTML={{ __html: name }}
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: solidColor,
          fill: 'currentColor',
          stroke: solidColor,
          filter: glow ? `drop-shadow(0 0 ${size * 0.2}px ${solidColor}66)` : undefined,
          transform: `translate3d(0, ${floatY}px, 0) rotate(${floatRotate}deg)`
        }}
      />
    );
  } else if (isSvgUrl) {
    iconNode = (
      <img
        src={name}
        alt="icon"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          filter: glow ? `drop-shadow(0 0 ${size * 0.2}px ${solidColor}66)` : undefined,
          transform: `translate3d(0, ${floatY}px, 0) rotate(${floatRotate}deg)`
        }}
      />
    );
  } else {
    const IconComponent = resolveLucideIcon(name);
    if (IconComponent) {
      iconNode = (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: glow ? `drop-shadow(0 0 ${size * 0.2}px ${solidColor}77)` : undefined,
            transform: `translate3d(0, ${floatY}px, 0) rotate(${floatRotate}deg)`
          }}
        >
          <IconComponent size={size} color={solidColor} strokeWidth={1.85} />
        </div>
      );
    }
  }

  if (!badge) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${pop})`,
          opacity: pop,
          ...style
        }}
      >
        {iconNode}
      </div>
    );
  }

  // Luxury Glassmorphic Badge Wrapper (Solid single-color styling)
  const badgeSize = size * 1.8;
  const bg = badgeBg || `radial-gradient(circle at 40% 40%, ${solidColor}1f, ${solidColor}08)`;
  const borderColor = `${solidColor}44`;

  return (
    <div
      style={{
        position: 'relative',
        width: badgeSize,
        height: badgeSize,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        border: `1.5px solid ${borderColor}`,
        boxShadow: glow
          ? `0 20px 60px -10px ${solidColor}33, inset 0 0 25px ${solidColor}1a`
          : undefined,
        backdropFilter: 'blur(16px)',
        transform: `scale(${pop})`,
        opacity: pop,
        ...style
      }}
    >
      {/* Rotating subtle dash ring */}
      <div
        style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          border: `1px dashed ${solidColor}33`,
          transform: `rotate(${frame * 0.4}deg)`,
          pointerEvents: 'none'
        }}
      />
      {iconNode}
    </div>
  );
};
