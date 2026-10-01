export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "中文 (简体)", flag: "🇨🇳", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", dir: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹", dir: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", dir: "ltr" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", dir: "ltr" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", dir: "rtl" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", dir: "rtl" },
];

export function getLanguageByCode(code: string): LanguageOption | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === code.toLowerCase());
}
