export type OpenRouterMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
  name?: string;
};

export type OpenRouterRequest = {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
  tools?: any[];
  tool_choice?: any;
};

export type OpenRouterSettings = {
  apiKeyConfigured: boolean;
  model: string;
  availableModels: { id: string; name: string; description: string; recommended?: boolean }[];
};

export const RECOMMENDED_MODELS = [
  {
    id: "stealth/space-bunny-alpha",
    name: "Space Bunny Alpha (تجريبي مجاني 🐰)",
    description: "نموذج استدلالي تجريبي سريع ومجاني بالكامل مع معمارية التفكير المنخفض",
    recommended: true,
  },
  {
    id: "google/gemini-3.8-flash",
    name: "Gemini 3.8 Flash (فائق السرعة والذكاء الحركي)",
    description: "سرعة معالجة خاطفة مع استيعاب عميق للغة العربية ودقة عالية في هندسة المشاهد",
    recommended: true,
  },
  {
    id: "openai/gpt-6.1-sol",
    name: "GPT-6.1 Sol (أحدث أجيال الاستدلال والإخراج)",
    description: "إبداع فائق في السيناريوهات وتوليد المنطق البرمجي والرسوميات المتناغمة",
    recommended: true,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o (شامل ومتوازن)",
    description: "أداء موثوق في صياغة المحتوى المتسلسل والأفكار الإعلانية",
    recommended: true,
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash (سريع وخفيف)",
    description: "توليد سريع وخفيف للمشاهد البسيطة",
    recommended: true,
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro (تفكير عميق)",
    description: "قدرة تحليلية عالية لبناء تفاصيل دقيقة ومعقدة",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3 (اقتصادي وعالي الدقة)",
    description: "تكلفة منخفضة مع جودة برمجية متقدمة",
  },
];
