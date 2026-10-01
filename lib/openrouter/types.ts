export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};

export type OpenRouterRequest = {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
};

export type OpenRouterSettings = {
  apiKeyConfigured: boolean;
  model: string;
  availableModels: { id: string; name: string; description: string; recommended?: boolean }[];
};

export const RECOMMENDED_MODELS = [
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet (القمة في الموشن جرافيك والكود الفني)",
    description: "الأقوى عالمياً في كتابة كود CSS/SVG الحركي والرسوميات المعقدة بمستوى After Effects",
    recommended: true,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet (سريع ومتقن)",
    description: "إبداع استثنائي في هندسة الحركة والتنسيق البصري المتناغم",
    recommended: true,
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash (فائق السرعة)",
    description: "توليد سريع جداً وذكي مع فهم عميق للغة العربية والسيناريوهات",
    recommended: true,
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro (تفكير عميق)",
    description: "قدرة تحليلية عالية لبناء تفاصيل دقيقة ومعقدة",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o (شامل ومتوازن)",
    description: "أداء ممتاز في صياغة المحتوى المتسلسل والأفكار الإعلانية",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3 (اقتصادي وعالي الدقة)",
    description: "تكلفة منخفضة مع جودة برمجية متقدمة",
  },
];
