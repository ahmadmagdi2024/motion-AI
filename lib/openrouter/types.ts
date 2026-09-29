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
  provider: "openrouter";
  apiKeyConfigured: boolean;
  model: string;
  visionEnabled: boolean;
  temperature: number;
  maxTokens: number;
  siteUrl?: string;
  appName?: string;
};
