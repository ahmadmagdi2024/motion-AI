import { v4 as uuid } from 'uuid';
import type { Asset, Scene, VideoProject } from './schema';

export interface BrandColorsInput {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

function hexToDeepTint(hex: string, darkness = 0.06): string {
  const clean = hex.replace('#', '').padEnd(6, '0');
  const r = parseInt(clean.substring(0, 2), 16) || 20;
  const g = parseInt(clean.substring(2, 4), 16) || 20;
  const b = parseInt(clean.substring(4, 6), 16) || 20;

  const darkR = Math.max(6, Math.min(28, Math.round(r * darkness)));
  const darkG = Math.max(6, Math.min(28, Math.round(g * darkness)));
  const darkB = Math.max(8, Math.min(36, Math.round(b * darkness)));

  return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
}

type Domain = 'tech_saas' | 'ecommerce_product' | 'services_consulting' | 'speed_delivery' | 'luxury_prestige' | 'kinetic_promo' | 'general_brand';

function detectDomain(prompt: string): Domain {
  const p = prompt.toLowerCase();
  if (/توصيل|سريع|دليفري|شحن|فوري|سائق|delivery|speed|courier|fast/.test(p)) {
    return 'speed_delivery';
  }
  if (/تطبيق|سحابي|برمج|ذكاء|منصة|نظام|بيانات|saas|tech|ai|cloud|software|app|platform/.test(p)) {
    return 'tech_saas';
  }
  if (/متجر|عطور|منتج|شراء|أزياء|قهوة|كافيه|تسوق|سلة|store|product|shop|coffee|perfume|retail/.test(p)) {
    return 'ecommerce_product';
  }
  if (/فاخر|ملكي|فخامة|ذهب|بريميوم|راقي|vip|luxury|royal|exclusive|jewelry/.test(p)) {
    return 'luxury_prestige';
  }
  if (/محاماة|قانون|استشارات|تسويق|عقارات|إدارة|طبي|عيادة|تمويل|legal|law|consulting|real\s*estate|medical/.test(p)) {
    return 'services_consulting';
  }
  if (/عرض|خصم|تخفيض|انطلاق|مفاجأة|حصري|promo|sale|discount|deal/.test(p)) {
    return 'kinetic_promo';
  }
  return 'general_brand';
}

interface DomainStoryPlan {
  sequence: Scene['type'][];
  backgroundStyles: Scene['backgroundStyle'][];
  layouts: Scene['layout'][];
  textAnimations: Scene['textAnimation'][];
  icons: string[];
  cameras: Scene['camera'][];
  transitions: Scene['transition'][];
  arScenes: {
    title: string;
    subtitle: string;
    eyebrow: string;
    stat?: string;
    items?: string[];
    cta?: string;
  }[];
  enScenes: {
    title: string;
    subtitle: string;
    eyebrow: string;
    stat?: string;
    items?: string[];
    cta?: string;
  }[];
}

const DOMAIN_PLANS: Record<Domain, DomainStoryPlan> = {
  speed_delivery: {
    sequence: ['kinetic-typography', 'icon-badge', 'comparison', 'feature-cards', 'statistic', 'call-to-action'],
    backgroundStyles: ['neon-cyber', 'brand-glow', 'mesh-gradient', 'gradient-grid', 'aurora', 'cinematic'],
    layouts: ['center', 'center', 'editorial', 'split-left', 'center', 'center'],
    textAnimations: ['pop-elastic', 'word-stagger', 'slide', 'mask-reveal', 'scale-blur', 'pop-elastic'],
    icons: ['zap', 'rocket', 'clock', 'check-circle', 'trending-up', 'phone'],
    cameras: ['push-in', 'pan-right', 'drift', 'pan-left', 'push-in', 'static'],
    transitions: ['light-sweep', 'zoom', 'wipe', 'light-sweep', 'film-burn', 'fade'],
    arScenes: [
      {
        title: 'أسرع توصيل في مدينتك',
        subtitle: 'طلبك ينطلق فوراً ويصل لبابك في دقائق قياسية معدودة',
        eyebrow: 'السرعة الفائقة'
      },
      {
        title: 'تتبع مباشر لكل خطوة',
        subtitle: 'شاهد مسار سائقك لحظة بلحظة بدقة متناهية من الاستلام حتى الوصول',
        eyebrow: 'التقنية المباشرة'
      },
      {
        title: 'فارق السرعة والالتزام',
        subtitle: 'ودّع الانتظار الطويل وتأخر الطلبات، معنا طلبك يصل ساخناً وفي موعده المحدد',
        eyebrow: 'المقارنة الفورية',
        items: ['انتظار مجهول وتأخير متكرر', 'دقة بالمواعيد ووصول فوري مضمون']
      },
      {
        title: 'تجربة صُممت لراحتك',
        subtitle: 'خيارات دفع مرنة، تغليف آمن ودعم فني مستمر يلبي احتياجاتك',
        eyebrow: 'مزايا حصرية',
        items: ['توصيل فوري خلال 30 دقيقة', 'تتبع دقيق عبر الخريطة الحية', 'ضمان سلامة وجودة الطلب', 'خدمة عملاء على مدار 24 ساعة']
      },
      {
        title: 'آلاف الطلبات الناجحة يومياً',
        subtitle: 'ثقة متزايدة وأرقام قياسية تعكس التزامنا بأعلى معايير السرعة والجودة',
        eyebrow: 'إنجازاتنا بالأرقام',
        stat: '+99.4%'
      },
      {
        title: 'حمّل التطبيق واطلب الآن',
        subtitle: 'استمتع بأول توصيل مجاني وتجربة استثنائية بنقرة واحدة',
        eyebrow: 'انطلق معنا',
        cta: 'حمّل التطبيق الآن'
      }
    ],
    enScenes: [
      {
        title: 'Lightning Fast Delivery',
        subtitle: 'Your orders dispatched instantly and delivered in record time',
        eyebrow: 'Ultra Speed'
      },
      {
        title: 'Live Real-Time Tracking',
        subtitle: 'Watch your driver navigate turn-by-turn right to your doorstep',
        eyebrow: 'Live Precision'
      },
      {
        title: 'The Speed Advantage',
        subtitle: 'Say goodbye to cold meals and endless waiting times',
        eyebrow: 'Direct Comparison',
        items: ['Unpredictable delays and cold deliveries', 'Guaranteed punctuality & real-time dispatch']
      },
      {
        title: 'Crafted for Convenience',
        subtitle: 'Flexible checkout, secure temperature-sealed packaging, and 24/7 care',
        eyebrow: 'Core Perks',
        items: ['Under 30-minute delivery', 'Live satellite GPS tracking', 'Order protection guarantee', '24/7 dedicated support']
      },
      {
        title: 'Thousands of Daily Smiles',
        subtitle: 'Proven reliability backed by uncompromising performance standards',
        eyebrow: 'Milestones',
        stat: '+99.4%'
      },
      {
        title: 'Download & Order Now',
        subtitle: 'Get free delivery on your first order with one single tap',
        eyebrow: 'Get Started',
        cta: 'Order Now'
      }
    ]
  },

  tech_saas: {
    sequence: ['kinetic-typography', 'split-showcase', 'feature-cards', 'statistic', 'process', 'call-to-action'],
    backgroundStyles: ['neon-cyber', 'gradient-grid', 'brand-glow', 'mesh-gradient', 'aurora', 'cinematic'],
    layouts: ['center', 'split-right', 'editorial', 'center', 'editorial', 'center'],
    textAnimations: ['pop-elastic', 'slide', 'word-stagger', 'scale-blur', 'mask-reveal', '3d-flip'],
    icons: ['cpu', 'layers', 'zap', 'trending-up', 'check-circle', 'rocket'],
    cameras: ['push-in', 'pan-left', 'push-in', 'drift', 'pan-right', 'static'],
    transitions: ['light-sweep', 'zoom', 'light-sweep', 'wipe', 'film-burn', 'fade'],
    arScenes: [
      {
        title: 'مستقبل أعمالك الذكية',
        subtitle: 'منصة سحابية متطورة تدير وتنمي عملياتك بأحدث تقنيات الذكاء الاصطناعي',
        eyebrow: 'الجيل القادم'
      },
      {
        title: 'كفاءة تشغيلية غير مسبوقة',
        subtitle: 'أتمتة ذكية تختصر آلاف الساعات وتمنح فريقك قدرات تحليلية متفوقة',
        eyebrow: 'ذكاء متكامل'
      },
      {
        title: 'أدوات قوية في لوحة واحدة',
        subtitle: 'بنية تحتية مرنة، حماية سيبرانية معتمدة وتكامل فوري مع كافة أنظمتك',
        eyebrow: 'القدرات التقنية',
        items: ['أتمتة شاملة بالذكاء الاصطناعي', 'حماية بيانات مشفرة بأعلى المعايير', 'تقارير أداء لحظية وتحليلات تنبؤية', 'ربط فوري عبر API مرن']
      },
      {
        title: 'نمو متسارع وعائد استثماري مضاعف',
        subtitle: 'شركات رائدة تعتمد على حلولنا لرفع الإنتاجية وتقليل التكاليف التشغيلية',
        eyebrow: 'أرقام النجاح',
        stat: '+340%'
      },
      {
        title: 'خطوات التحول الرقمي',
        subtitle: 'بدء سهل وتكامل سلس ينقل أعمالك للمستوى التالي في أيام معدودة',
        eyebrow: 'مسار التنفيذ',
        items: ['ربط الحساب وقواعد البيانات', 'تخصيص نماذج الذكاء الاصطناعي', 'إطلاق الأتمتة المباشرة', 'تحقيق التوسع المستدام']
      },
      {
        title: 'ابدأ تجربتك المجانية اليوم',
        subtitle: 'انضم إلى مئات الشركات الرائدة وارتقِ بأعمالك مع منصتنا الذكية',
        eyebrow: 'الخطوة التالية',
        cta: 'ابدأ التجربة مجاناً'
      }
    ],
    enScenes: [
      {
        title: 'The Future of Smart Work',
        subtitle: 'AI-powered cloud platform engineered to scale your operations effortlessly',
        eyebrow: 'Next-Gen SaaS'
      },
      {
        title: 'Unrivaled Operational Velocity',
        subtitle: 'Automate tedious workflows and unlock deep predictive intelligence',
        eyebrow: 'Intelligent Cloud'
      },
      {
        title: 'Engineered for Performance',
        subtitle: 'Enterprise-grade architecture with zero downtime and seamless integration',
        eyebrow: 'Key Capabilities',
        items: ['Autonomous AI workflows', 'End-to-end encrypted security', 'Real-time telemetry dashboards', 'Instant API connectivity']
      },
      {
        title: 'Massive Return on Investment',
        subtitle: 'Empowering industry leaders to scale faster while cutting operating costs',
        eyebrow: 'Proven Metrics',
        stat: '+340%'
      },
      {
        title: 'Effortless Onboarding',
        subtitle: 'Zero-friction implementation taking your team live in under 48 hours',
        eyebrow: 'Implementation',
        items: ['Data connection & sync', 'Custom AI model tuning', 'Automated workflow launch', 'Continuous scaling']
      },
      {
        title: 'Start Your Free Trial Today',
        subtitle: 'Join top-tier enterprises building tomorrow with our smart platform',
        eyebrow: 'Take Action',
        cta: 'Get Started Free'
      }
    ]
  },

  ecommerce_product: {
    sequence: ['cinematic-opening', 'product-hero', 'feature-cards', 'quote-highlight', 'statistic', 'call-to-action'],
    backgroundStyles: ['studio-dark', 'mesh-gradient', 'brand-glow', 'aurora', 'bold-duotone', 'cinematic'],
    layouts: ['center', 'editorial', 'split-left', 'center', 'center', 'center'],
    textAnimations: ['mask-reveal', 'pop-elastic', 'word-stagger', 'scale-blur', '3d-flip', 'rise'],
    icons: ['sparkles', 'shopping-bag', 'star', 'award', 'trending-up', 'rocket'],
    cameras: ['push-in', 'pan-right', 'drift', 'pull-out', 'push-in', 'static'],
    transitions: ['film-burn', 'light-sweep', 'zoom', 'light-sweep', 'wipe', 'fade'],
    arScenes: [
      {
        title: 'الفخامة التي تستحقها',
        subtitle: 'تشكيلة استثنائية صُممت بأدق المعايير لتمنحك حضوراً يلفت الأنظار',
        eyebrow: 'إصدار حصري'
      },
      {
        title: 'في قلب الاهتمام والأناقة',
        subtitle: 'مكونات فاخرة وتفاصيل مدروسة بعناية لتعكس ذوقك الرفيع في كل لحظة',
        eyebrow: 'المنتج الأيقوني'
      },
      {
        title: 'أسرار تميز منتجاتنا',
        subtitle: 'نضمن لك تجربة لا مثيل لها تجمع بين الأصالة، الثبات والجودة العالية',
        eyebrow: 'مواصفات ممتازة',
        items: ['مكونات طبيعية نقية 100%', 'ثبات طويل يدوم لساعات ممتدة', 'تغليف فاخر يليق بالإهداء', 'ضمان ذهبي للاسترجاع السلس']
      },
      {
        title: 'تجربة تفوق التوقعات',
        subtitle: 'آراء عملائنا المميزين تثبت أن الجودة الحقيقية تصنع فارقاً يدوم طويلاً',
        eyebrow: 'ثقة ورضا'
      },
      {
        title: 'تقييمات استثنائية من العملاء',
        subtitle: 'أكثر من خمسين ألف عميل اختاروا علامتنا وشاركوا تجاربهم المميزة',
        eyebrow: 'رضا العملاء',
        stat: '4.9/5'
      },
      {
        title: 'تسوق الآن واستمتع بالعرض',
        subtitle: 'عرض خاص لفترة محدودة مع شحن سريع وتغليف هدايا مجاني',
        eyebrow: 'اطلب فوراً',
        cta: 'تسوق التشكيلة الآن'
      }
    ],
    enScenes: [
      {
        title: 'Luxury You Deserve',
        subtitle: 'An exceptional curation crafted with uncompromising sophistication',
        eyebrow: 'Signature Collection'
      },
      {
        title: 'Centerstage Elegance',
        subtitle: 'Finest materials and exquisite craftsmanship designed to make a statement',
        eyebrow: 'Iconic Craft'
      },
      {
        title: 'What Sets Us Apart',
        subtitle: 'A sensory experience harmonizing raw purity, longevity, and timeless style',
        eyebrow: 'Crafted Details',
        items: ['100% sustainably sourced materials', 'Long-lasting premium finish', 'Luxury gift packaging included', 'Full satisfaction guarantee']
      },
      {
        title: 'An Unforgettable Experience',
        subtitle: 'Loved by thousands who appreciate genuine craft and refined aesthetics',
        eyebrow: 'Customer Love'
      },
      {
        title: 'Unanimous 5-Star Ratings',
        subtitle: 'Over fifty thousand satisfied connoisseurs worldwide endorse our craft',
        eyebrow: 'Trust & Ratings',
        stat: '4.9/5'
      },
      {
        title: 'Shop the Exclusive Collection',
        subtitle: 'Limited-time complimentary express shipping on all flagship items',
        eyebrow: 'Order Today',
        cta: 'Shop Now'
      }
    ]
  },

  services_consulting: {
    sequence: ['cinematic-opening', 'comparison', 'process', 'statistic', 'icon-badge', 'call-to-action'],
    backgroundStyles: ['cinematic', 'bold-duotone', 'brand-glow', 'gradient-grid', 'aurora', 'mesh-gradient'],
    layouts: ['editorial', 'center', 'editorial', 'center', 'editorial', 'center'],
    textAnimations: ['mask-reveal', 'slide', 'word-stagger', 'scale-blur', 'pop-elastic', '3d-flip'],
    icons: ['shield', 'badge-check', 'compass', 'trending-up', 'award', 'phone'],
    cameras: ['push-in', 'pan-left', 'drift', 'pull-out', 'pan-right', 'static'],
    transitions: ['light-sweep', 'wipe', 'light-sweep', 'zoom', 'film-burn', 'fade'],
    arScenes: [
      {
        title: 'شريكك الاستراتيجي الموثوق',
        subtitle: 'خبرات استشارية وقانونية متخصصة تحمي مصالحك وتدعم قراراتك الاستثمارية',
        eyebrow: 'الخبرة والموثوقية'
      },
      {
        title: 'الحلول الحقيقية تصنع الفارق',
        subtitle: 'ابتعد عن التعقيدات والقرارات العشوائية واعتمد على دراسات استراتيجية رصينة',
        eyebrow: 'رؤية ثاقبة',
        items: ['مخاطر غير محسوبة وحلول تقليدية', 'رؤية واضحة، حماية شاملة ونتائج مضمونة']
      },
      {
        title: 'منهجية عمل متقنة',
        subtitle: 'خطوات منهجية مدروسة تضمن تحقيق أهدافك بأعلى درجات الكفاءة والسرية',
        eyebrow: 'مراحل الشراكة',
        items: ['دراسة وتحليل الوضع الراهن', 'صياغة الاستراتيجية المتخصصة', 'التنفيذ والمتابعة المباشرة', 'تحقيق النجاح والاستدامة']
      },
      {
        title: 'سجل حافل بالنجاحات المشهودة',
        subtitle: 'مئات القضايا والمشاريع الاستثمارية التي أدرناها باحترافية تامة وأمان مطلق',
        eyebrow: 'إنجازاتنا',
        stat: '+98%'
      },
      {
        title: 'فريق من نخبة المستشارين',
        subtitle: 'كفاءات معتمدة تكرس جهودها لتقديم أفضل الاستشارات بدقة وموضوعية تامة',
        eyebrow: 'فريق الخبراء'
      },
      {
        title: 'احجز جلستك الاستشارية الآن',
        subtitle: 'تواصل مع مستشارينا لمناقشة مشروعك ووضع خطة العمل المثالية لأهدافك',
        eyebrow: 'تواصل معنا',
        cta: 'احجز استشارتك اليوم'
      }
    ],
    enScenes: [
      {
        title: 'Your Trusted Strategic Partner',
        subtitle: 'Advisory and legal excellence safeguarding your vision and business growth',
        eyebrow: 'Elite Counsel'
      },
      {
        title: 'Strategic Clarity Over Noise',
        subtitle: 'Eliminate blind spots with deep domain expertise and actionable roadmaps',
        eyebrow: 'Strategic Contrast',
        items: ['Fragmented advice & hidden risks', 'Clear foresight, rigorous compliance & stability']
      },
      {
        title: 'Our Proven Methodology',
        subtitle: 'A disciplined, confidentiality-first process yielding measurable success',
        eyebrow: 'Process Roadmap',
        items: ['Comprehensive diagnostic analysis', 'Tailored tactical strategy', 'Rigorous execution & oversight', 'Long-term value creation']
      },
      {
        title: 'Track Record of Excellence',
        subtitle: 'Hundreds of complex corporate transactions and cases delivered with precision',
        eyebrow: 'Track Record',
        stat: '+98%'
      },
      {
        title: 'Industry-Recognized Leaders',
        subtitle: 'Seasoned professionals dedicated to delivering counsel that stands the test of time',
        eyebrow: 'Advisory Board'
      },
      {
        title: 'Schedule Your Confidential Briefing',
        subtitle: 'Speak directly with our senior partners to formulate your growth roadmap',
        eyebrow: 'Take Action',
        cta: 'Book Consultation'
      }
    ]
  },

  luxury_prestige: {
    sequence: ['cinematic-opening', 'quote-highlight', 'split-showcase', 'product-hero', 'logo-reveal', 'call-to-action'],
    backgroundStyles: ['cinematic', 'aurora', 'studio-dark', 'mesh-gradient', 'brand-glow', 'cinematic'],
    layouts: ['editorial', 'center', 'split-right', 'center', 'center', 'center'],
    textAnimations: ['mask-reveal', 'word-stagger', 'slide', 'pop-elastic', 'scale-blur', 'rise'],
    icons: ['sparkles', 'award', 'star', 'shield', 'compass', 'sparkles'],
    cameras: ['push-in', 'pan-left', 'drift', 'pull-out', 'push-in', 'static'],
    transitions: ['light-sweep', 'zoom', 'film-burn', 'light-sweep', 'fade', 'fade'],
    arScenes: [
      {
        title: 'حين تلتقي الفخامة بالإتقان',
        subtitle: 'صرح من التميز يصنع معايير غير مسبوقة في عالم الذوق الرفيع والحضور الملكي',
        eyebrow: 'قمة التميز'
      },
      {
        title: 'الكمال يكمن في أدق التفاصيل',
        subtitle: 'نحن لا نصنع مجرد تصاميم، بل نبتكر تجارب استثنائية تخلّد في الذاكرة',
        eyebrow: 'فلسفتنا'
      },
      {
        title: 'إرث عريق وهوية رائدة',
        subtitle: 'شغف متوارث يجمع بين عراقة التراث ولمسات الابتكار المعاصر الخالد',
        eyebrow: 'الأصالة المعاصرة'
      },
      {
        title: 'روائع حصرية لنخبة مميزة',
        subtitle: 'إبداعات صُممت خصيصاً لمن يبحث عن الفرادة والاختلاف في كل مظهر',
        eyebrow: 'الإصدار الماسي'
      },
      {
        title: 'علامة تترك أثراً دائماً',
        subtitle: 'رمز للفخامة والريادة يحظى بتقدير وثقة كبار الشخصيات حول العالم',
        eyebrow: 'الريادة العالمية'
      },
      {
        title: 'اكتشف عالمنا الخاص الآن',
        subtitle: 'ندعوك لتجربة شخصية فريدة تكتشف فيها تفاصيل مجموعتنا الحصرية الفاخرة',
        eyebrow: 'دعوة خاصة',
        cta: 'استكشف التشكيلة'
      }
    ],
    enScenes: [
      {
        title: 'Where Prestige Meets Precision',
        subtitle: 'An untouchable echelon of craft defining the gold standard in luxury',
        eyebrow: 'Pinnacle of Craft'
      },
      {
        title: 'Perfection in Every Nuance',
        subtitle: 'We craft timeless statements that resonate across generations',
        eyebrow: 'Our Heritage'
      },
      {
        title: 'Legacy of Distinction',
        subtitle: 'Rooted in heritage, elevated by cutting-edge modern vision',
        eyebrow: 'Timeless Identity'
      },
      {
        title: 'Exclusively for the Few',
        subtitle: 'Curated specifically for those who demand nothing short of transcendence',
        eyebrow: 'Diamond Edition'
      },
      {
        title: 'A Mark of Unrivaled Eminence',
        subtitle: 'A globally acknowledged emblem of mastery and distinction',
        eyebrow: 'Global Distinction'
      },
      {
        title: 'Enter Our Private World',
        subtitle: 'Request a bespoke private showcase and immerse yourself in our curation',
        eyebrow: 'Private Invitation',
        cta: 'Discover the World'
      }
    ]
  },

  kinetic_promo: {
    sequence: ['kinetic-typography', 'statistic', 'feature-cards', 'comparison', 'call-to-action'],
    backgroundStyles: ['brand-glow', 'mesh-gradient', 'bold-duotone', 'aurora', 'neon-cyber'],
    layouts: ['center', 'center', 'editorial', 'center', 'center'],
    textAnimations: ['pop-elastic', '3d-flip', 'word-stagger', 'slide', 'pop-elastic'],
    icons: ['zap', 'trending-up', 'star', 'badge-check', 'rocket'],
    cameras: ['push-in', 'pan-right', 'drift', 'pan-left', 'static'],
    transitions: ['light-sweep', 'zoom', 'wipe', 'film-burn', 'fade'],
    arScenes: [
      {
        title: 'أقوى العروض الحصرية بدأت',
        subtitle: 'فرصة لا تعوض للاستفادة من خصومات هائلة ومزايا استثنائية لفترة محدودة',
        eyebrow: 'عرض الموسم'
      },
      {
        title: 'خصم استثنائي لا يتكرر',
        subtitle: 'وفّر أكثر مع باقاتنا الحصرية المصممة لتمنحك أقصى قيمة استثمارية',
        eyebrow: 'وفّر الآن',
        stat: '50% خصم'
      },
      {
        title: 'مزايا إضافية مع كل طلب',
        subtitle: 'احصل على هدايا ومكافآت حصرية وضمان شامل يرافق مشترياتك فوراً',
        eyebrow: 'مكافآت فورية',
        items: ['شحن وتوصيل فوري مجاناً', 'هدايا حصرية مرفقة بكل طلب', 'ضمان استبدال فوري مرن', 'نقاط مكافآت مضاعفة']
      },
      {
        title: 'سارع قبل نفاد الكمية',
        subtitle: 'الكميات محدودة جداً والإقبال غير مسبوق، لا تدع الفرصة تفوتك',
        eyebrow: 'فرصة محدودة'
      },
      {
        title: 'اطلب الآن واستفد من الخصم',
        subtitle: 'انقر الآن واستخدم كود الخصم الحصري قبل انتهاء الوقت المتبقي',
        eyebrow: 'الوقت ينفد',
        cta: 'احصل على العرض الآن'
      }
    ],
    enScenes: [
      {
        title: 'The Season Mega Drop',
        subtitle: 'Unprecedented limited-time offers crafted to give you massive value',
        eyebrow: 'Exclusive Promo'
      },
      {
        title: 'Unbelievable 50% Savings',
        subtitle: 'Max out your advantage with our deepest price cuts of the entire year',
        eyebrow: 'Instant Savings',
        stat: '50% OFF'
      },
      {
        title: 'Exclusive Tier Perks',
        subtitle: 'Unlock VIP bonuses, extended warranties, and instant gift packages',
        eyebrow: 'Bonus Rewards',
        items: ['Complimentary overnight shipping', 'VIP bonus pack included', 'No-questions-asked refund policy', 'Double reward tier credits']
      },
      {
        title: 'Supplies Strictly Limited',
        subtitle: 'High demand is clearing inventory fast — claim your spot before it closes',
        eyebrow: 'Ending Soon'
      },
      {
        title: 'Claim Your Exclusive Deal',
        subtitle: 'Tap below and apply the special promo code before midnight',
        eyebrow: 'Final Call',
        cta: 'Claim Offer Now'
      }
    ]
  },

  general_brand: {
    sequence: ['cinematic-opening', 'icon-badge', 'feature-cards', 'comparison', 'statistic', 'process', 'call-to-action'],
    backgroundStyles: ['mesh-gradient', 'aurora', 'gradient-grid', 'brand-glow', 'bold-duotone', 'neon-cyber', 'cinematic'],
    layouts: ['editorial', 'center', 'editorial', 'center', 'center', 'editorial', 'center'],
    textAnimations: ['mask-reveal', 'pop-elastic', 'word-stagger', 'slide', 'scale-blur', '3d-flip', 'pop-elastic'],
    icons: ['sparkles', 'rocket', 'shield', 'badge-check', 'trending-up', 'layers', 'compass'],
    cameras: ['push-in', 'pan-right', 'drift', 'pan-left', 'pull-out', 'push-in', 'static'],
    transitions: ['light-sweep', 'zoom', 'wipe', 'light-sweep', 'film-burn', 'fade', 'fade'],
    arScenes: [
      {
        title: 'حين تتحول الرؤية إلى واقع',
        subtitle: 'قصة ملهمة وإيقاع بصري فريد يلفت الانتباه ويعكس قوة هويتك',
        eyebrow: 'البداية الملهمة'
      },
      {
        title: 'قوة في الأداء ودقة في التنفيذ',
        subtitle: 'نبتكر معايير جديدة تمنح علامتك تميزاً استثنائياً في كل محفل',
        eyebrow: 'لماذا نحن؟'
      },
      {
        title: 'حلول متكاملة صنعت لنموك',
        subtitle: 'منهجية ذكية تجمع بين السرعة الفائقة، الأمان والمظهر الفاخر',
        eyebrow: 'أهم المزايا',
        items: ['أداء فائق بسرعة استثنائية', 'حماية معتمدة وموثوقية مطلقة', 'تصاميم تفاعلية مبتكرة', 'دعم متواصل وشراكة حقيقية']
      },
      {
        title: 'فارق حقيقي تصنعه الجودة',
        subtitle: 'تجاوز الأساليب التقليدية المجهدة إلى نتائج ملموسة ومبهرة',
        eyebrow: 'الأثر والنتيجة',
        items: ['أساليب بطيئة وتكاليف متزايدة', 'حلول ذكية، سرعة فائقة وجودة استثنائية']
      },
      {
        title: 'نمو مستمر وأرقام تتحدث',
        subtitle: 'قرارات بصرية وتجارب فريدة تحقق أهدافك وتصنع فارقاً حقيقياً',
        eyebrow: 'إنجازاتنا',
        stat: '+180%'
      },
      {
        title: 'خطوات مدروسة نحو التميز',
        subtitle: 'فكرة متقدة، تصميم متزن، ثم تنفيذ استثنائي يبهر الجميع',
        eyebrow: 'آلية العمل',
        items: ['الفكرة والاستراتيجية', 'التصميم وبناء الهوية', 'الحركة والتأثير', 'الإطلاق والصقل']
      },
      {
        title: 'انطلق معنا وصنع الفارق',
        subtitle: 'حوّل طموحك إلى واقع ملموس يراه جمهورك ويتفاعل معه اليوم',
        eyebrow: 'الخطوة التالية',
        cta: 'ابدأ رحلتك الآن'
      }
    ],
    enScenes: [
      {
        title: 'Where Vision Becomes Reality',
        subtitle: 'An inspiring story engineered with rhythm, prestige, and memorable craft',
        eyebrow: 'The Journey'
      },
      {
        title: 'Exceptional Craft & Precision',
        subtitle: 'Setting benchmarks that give your brand an unfair, unmistakable advantage',
        eyebrow: 'Why Choose Us'
      },
      {
        title: 'Complete Solutions for Scale',
        subtitle: 'A sophisticated synthesis of velocity, resilience, and luxury aesthetics',
        eyebrow: 'Core Highlights',
        items: ['Unmatched operational speed', 'Enterprise-level reliability', 'Bespoke modern design', 'Dedicated partner support']
      },
      {
        title: 'A Measurable Transformation',
        subtitle: 'Step beyond legacy roadblocks and experience immediate, impactful results',
        eyebrow: 'Impact Comparison',
        items: ['Cumbersome, slow legacy workflows', 'Streamlined velocity & flawless delivery']
      },
      {
        title: 'Consistent Growth & Metrics',
        subtitle: 'Data-driven visual decisions delivering tangible, celebrated outcomes',
        eyebrow: 'Proven Milestones',
        stat: '+180%'
      },
      {
        title: 'Disciplined Path to Impact',
        subtitle: 'Sharp concept, balanced design, and breathtaking motion execution',
        eyebrow: 'Our Roadmap',
        items: ['Concept & Strategic Vision', 'Brand Identity Architecture', 'Dynamic Kinetic Motion', 'Global Launch & Polish']
      },
      {
        title: 'Start Your Story Today',
        subtitle: 'Transform your bold vision into an unforgettable experience right now',
        eyebrow: 'Get Started',
        cta: 'Launch Your Project'
      }
    ]
  }
};

export function createLocalProject(input: {
  prompt: string;
  language: 'ar' | 'en';
  duration: number;
  assets: Asset[];
  brandColors?: BrandColorsInput;
  requestedScreenTypes?: string[];
}): VideoProject {
  const { prompt, language, duration, assets, brandColors } = input;
  const fps = 30;
  const ar = language === 'ar';

  const primary = brandColors?.primaryColor || '#d8b56b';
  const secondary = brandColors?.secondaryColor || '#2563eb';
  const accent = brandColors?.accentColor || '#f59e0b';

  // Dynamic deep tinted backgrounds automatically harmonized with brand
  const deepPrimary = hexToDeepTint(primary, 0.07);
  const deepSecondary = hexToDeepTint(secondary, 0.06);
  const deepSlate = '#080c14';
  const deepCharcoal = '#0b0f19';

  // Detect domain from prompt to build a custom narrative storyboard
  const domain = detectDomain(prompt);
  const plan = DOMAIN_PLANS[domain] || DOMAIN_PLANS.general_brand;

  // Calculate scene count dynamically based on duration
  const targetSceneCount = duration <= 15 ? 4 : duration <= 30 ? 6 : Math.min(plan.sequence.length, 8);
  const total = duration * fps;
  const baseDuration = Math.floor(total / targetSceneCount);

  const visualAssets = assets.filter((a) => a.type === 'image' || a.type === 'video');
  const logo = assets.find((a) => a.type === 'logo');
  const audio = assets.find((a) => a.type === 'audio');

  const domainScenes = ar ? plan.arScenes : plan.enScenes;

  const scenes: Scene[] = Array.from({ length: targetSceneCount }, (_, i) => {
    const type = plan.sequence[i % plan.sequence.length];
    const backgroundAsset = visualAssets.length ? visualAssets[i % visualAssets.length] : undefined;
    const foregroundAsset = visualAssets.length > 1 ? visualAssets[(i + 1) % visualAssets.length] : backgroundAsset;

    const data = domainScenes[i % domainScenes.length];
    const icon = plan.icons[i % plan.icons.length];
    const bgStyle = plan.backgroundStyles[i % plan.backgroundStyles.length];
    const layout = plan.layouts[i % plan.layouts.length];
    const textAnim = plan.textAnimations[i % plan.textAnimations.length];
    const camera = plan.cameras[i % plan.cameras.length];
    const transition = i === targetSceneCount - 1 ? 'fade' : plan.transitions[i % plan.transitions.length];

    // Harmonize scene colors across scenes
    const sceneAccent = i % 3 === 0 ? accent : i % 3 === 1 ? primary : secondary;
    const sceneBg = i % 3 === 0 ? deepPrimary : i % 3 === 1 ? deepSlate : deepSecondary;

    return {
      id: uuid(),
      type,
      durationInFrames: i === targetSceneCount - 1 ? total - baseDuration * (targetSceneCount - 1) : baseDuration,
      title: data.title,
      subtitle: i === 0 && prompt.length > 20 ? prompt.slice(0, 180) : data.subtitle,
      eyebrow: data.eyebrow,
      icon,
      backgroundAssetId: backgroundAsset?.id,
      foregroundAssetId: ['product-hero', 'split-showcase'].includes(type) ? foregroundAsset?.id : undefined,
      accent: sceneAccent,
      backgroundColor: sceneBg,
      textColor: '#ffffff',
      iconColor: sceneAccent,
      statistic: data.stat,
      items: data.items || [],
      cta: data.cta || (ar ? 'ابدأ الآن' : 'Get Started'),
      layout,
      camera,
      textAnimation: textAnim,
      mediaAnimation: i % 2 ? 'parallax' : 'ken-burns',
      backgroundStyle: bgStyle,
      templateStyle: 'modern-minimal',
      intensity: 1,
      focusPoint: { x: 50, y: 50 },
      transition
    };
  });

  return {
    id: uuid(),
    title: ar ? `فيديو موشن ذكي — ${prompt.slice(0, 35)}` : `AI Motion Video — ${prompt.slice(0, 35)}`,
    brief: prompt,
    language,
    direction: ar ? 'rtl' : 'ltr',
    fps,
    width: 1080,
    height: 1920,
    brand: {
      primaryColor: primary,
      secondaryColor: secondary,
      accentColor: accent,
      backgroundColor: deepPrimary,
      textColor: '#ffffff',
      fontFamily: 'Cairo, Arial, sans-serif',
      logoAssetId: logo?.id,
      name: '',
      tagline: ''
    },
    voiceover: '',
    musicAssetId: audio?.id,
    assets,
    scenes
  };
}
