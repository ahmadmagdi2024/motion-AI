import {z} from 'zod';

export const HexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/).catch('#d8b56b');

export const AssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  type: z.enum(['image','video','audio','logo']),
  description: z.string().optional().default(''),
  mimeType: z.string().optional()
});

export const SceneTypeSchema = z.enum([
  'cinematic-opening',
  'icon-badge',
  'feature-cards',
  'video-text',
  'kinetic-typography',
  'statistic',
  'process',
  'comparison',
  'quote-highlight',
  'split-showcase',
  'product-hero',
  'logo-reveal',
  'call-to-action'
]);

export const SceneSchema = z.object({
  id: z.string(),
  type: SceneTypeSchema,
  durationInFrames: z.number().int().min(30).max(900),
  title: z.string().max(180),
  subtitle: z.string().max(300).default(''),
  eyebrow: z.string().max(100).default(''),
  icon: z.string().optional().default('sparkles'),
  iconSecondary: z.string().optional(),
  iconColor: HexColor.optional(),
  backgroundAssetId: z.string().nullable().optional(),
  foregroundAssetId: z.string().nullable().optional(),
  accent: HexColor.default('#d8b56b'),
  backgroundColor: HexColor.optional(),
  textColor: HexColor.optional().default('#ffffff'),
  statistic: z.string().max(30).optional(),
  items: z.array(z.string().max(80)).max(6).optional().default([]),
  cta: z.string().max(100).optional().default(''),
  layout: z.enum(['editorial','center','split-left','split-right','full-bleed','focus-bottom']).optional().default('editorial'),
  camera: z.enum(['static','push-in','pull-out','pan-left','pan-right','drift']).optional().default('push-in'),
  textAnimation: z.enum(['rise','word-stagger','mask-reveal','scale-blur','slide','pop-elastic','3d-flip']).optional().default('word-stagger'),
  mediaAnimation: z.enum(['static','ken-burns','parallax','mask-reveal','float']).optional().default('ken-burns'),
  backgroundStyle: z.enum(['cinematic','gradient-grid','aurora','studio-dark','brand-glow','mesh-gradient','bold-duotone','neon-cyber']).optional().default('cinematic'),
  templateStyle: z.enum(['modern-minimal','bold-kinetic','corporate-tech','vibrant-glow','luxury-editorial']).optional().default('modern-minimal'),
  intensity: z.number().min(0.35).max(1.5).optional().default(1),
  focusPoint: z.object({x:z.number().min(0).max(100),y:z.number().min(0).max(100)}).optional().default({x:50,y:50}),
  transition: z.enum(['fade','light-sweep','zoom','wipe','film-burn']).default('light-sweep')
});

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  brief: z.string(),
  language: z.enum(['ar','en']),
  direction: z.enum(['rtl','ltr']),
  fps: z.number().int().min(24).max(60).default(30),
  width: z.number().int().default(1080),
  height: z.number().int().default(1920),
  brand: z.object({
    primaryColor: HexColor.default('#d8b56b'),
    secondaryColor: HexColor.default('#2563eb'),
    accentColor: HexColor.default('#f59e0b'),
    backgroundColor: HexColor.default('#070808'),
    textColor: HexColor.default('#ffffff'),
    fontFamily: z.string().default('Cairo, Arial, sans-serif'),
    logoAssetId: z.string().nullable().optional(),
    name: z.string().optional().default(''),
    tagline: z.string().optional().default('')
  }),
  voiceover: z.string().default(''),
  musicAssetId: z.string().nullable().optional(),
  assets: z.array(AssetSchema),
  scenes: z.array(SceneSchema).min(1).max(20)
});

export type Asset = z.infer<typeof AssetSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type VideoProject = z.infer<typeof ProjectSchema>;

export const totalFrames = (project: VideoProject) =>
  project.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);
