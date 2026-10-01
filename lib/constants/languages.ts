export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: "ltr" | "rtl";
}

export interface ResolvedLanguage {
  code: string;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", dir: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹", dir: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", dir: "ltr" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", dir: "ltr" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", dir: "rtl" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", dir: "rtl" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪", dir: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱", dir: "ltr" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱", dir: "ltr" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷", dir: "ltr" },
  { code: "he", name: "Hebrew", nativeName: "עבריت", flag: "🇮🇱", dir: "rtl" },
];

const COMMON_ALIASES: Record<string, ResolvedLanguage> = {
  // Arabic
  "العربية": { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" },
  "عربي": { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" },
  "عربية": { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" },
  "arabic": { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" },
  "ar": { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" },

  // English
  "الانجليزية": { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇺🇸" },
  "الإنجليزية": { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇺🇸" },
  "انجليزي": { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇺🇸" },
  "إنجليزي": { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇺🇸" },
  "english": { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇺🇸" },
  "en": { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇺🇸" },

  // French
  "الفرنسية": { code: "fr", name: "French", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },
  "فرنسي": { code: "fr", name: "French", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },
  "french": { code: "fr", name: "French", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },
  "français": { code: "fr", name: "French", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },
  "fr": { code: "fr", name: "French", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },

  // Spanish
  "الاسبانية": { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },
  "الإسبانية": { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },
  "اسباني": { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },
  "spanish": { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },
  "español": { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },
  "es": { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },

  // German
  "الالمانية": { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  "الألمانية": { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  "الماني": { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  "german": { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  "deutsch": { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  "de": { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },

  // Turkish
  "التركية": { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", flag: "🇹🇷" },
  "تركي": { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", flag: "🇹🇷" },
  "turkish": { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", flag: "🇹🇷" },
  "türkçe": { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", flag: "🇹🇷" },
  "tr": { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", flag: "🇹🇷" },

  // Russian
  "الروسية": { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", flag: "🇷🇺" },
  "روسي": { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", flag: "🇷🇺" },
  "russian": { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", flag: "🇷🇺" },
  "русский": { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", flag: "🇷🇺" },
  "ru": { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", flag: "🇷🇺" },

  // Chinese
  "الصينية": { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr", flag: "🇨🇳" },
  "صيني": { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr", flag: "🇨🇳" },
  "chinese": { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr", flag: "🇨🇳" },
  "中文": { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr", flag: "🇨🇳" },
  "zh": { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr", flag: "🇨🇳" },

  // Japanese
  "اليابانية": { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr", flag: "🇯🇵" },
  "ياباني": { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr", flag: "🇯🇵" },
  "japanese": { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr", flag: "🇯🇵" },
  "日本語": { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr", flag: "🇯🇵" },
  "ja": { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr", flag: "🇯🇵" },

  // Italian
  "الايطالية": { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr", flag: "🇮🇹" },
  "الإيطالية": { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr", flag: "🇮🇹" },
  "ايطالي": { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr", flag: "🇮🇹" },
  "italian": { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr", flag: "🇮🇹" },
  "italiano": { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr", flag: "🇮🇹" },
  "it": { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr", flag: "🇮🇹" },

  // Persian
  "الفارسية": { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl", flag: "🇮🇷" },
  "فارسي": { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl", flag: "🇮🇷" },
  "persian": { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl", flag: "🇮🇷" },
  "farsi": { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl", flag: "🇮🇷" },
  "fa": { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl", flag: "🇮🇷" },

  // Urdu
  "الاردية": { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl", flag: "🇵🇰" },
  "الأردية": { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl", flag: "🇵🇰" },
  "اردو": { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl", flag: "🇵🇰" },
  "urdu": { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl", flag: "🇵🇰" },
  "ur": { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl", flag: "🇵🇰" },

  // Swedish
  "السويدية": { code: "sv", name: "Swedish", nativeName: "Svenska", dir: "ltr", flag: "🇸🇪" },
  "swedish": { code: "sv", name: "Swedish", nativeName: "Svenska", dir: "ltr", flag: "🇸🇪" },
  "sv": { code: "sv", name: "Swedish", nativeName: "Svenska", dir: "ltr", flag: "🇸🇪" },

  // Dutch
  "الهولندية": { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr", flag: "🇳🇱" },
  "dutch": { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr", flag: "🇳🇱" },
  "nl": { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr", flag: "🇳🇱" },
};

export function getLanguageByCode(code: string): LanguageOption | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === code.toLowerCase());
}

/**
 * Resolves any free-form user-typed language name (in Arabic, English, or any language)
 * into a structured Language object with code, name, nativeName, direction, and flag.
 */
export function resolveLanguageInput(rawInput: string): ResolvedLanguage {
  const clean = rawInput.trim();
  if (!clean) {
    return { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" };
  }

  const lower = clean.toLowerCase();

  // 1. Direct match in aliases
  if (COMMON_ALIASES[clean] || COMMON_ALIASES[lower]) {
    return COMMON_ALIASES[clean] || COMMON_ALIASES[lower];
  }

  // 2. Substring match in SUPPORTED_LANGUAGES
  const found = SUPPORTED_LANGUAGES.find(
    (l) =>
      l.code.toLowerCase() === lower ||
      l.name.toLowerCase() === lower ||
      l.nativeName.toLowerCase() === lower ||
      lower.includes(l.name.toLowerCase()) ||
      lower.includes(l.nativeName.toLowerCase())
  );
  if (found) {
    return {
      code: found.code,
      name: found.name,
      nativeName: found.nativeName,
      dir: found.dir,
      flag: found.flag,
    };
  }

  // 3. Dynamic custom language entered manually
  const isRtl =
    /[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF]/.test(clean) &&
    (lower.includes("عرب") ||
      lower.includes("فارس") ||
      lower.includes("ارد") ||
      lower.includes("عبر") ||
      lower.includes("سريان"));

  let generatedCode = lower.replace(/[^a-z0-9]/g, "").slice(0, 4);
  if (!generatedCode || generatedCode.length < 2) {
    let h = 0;
    for (let i = 0; i < clean.length; i++) {
      h = (h << 5) - h + clean.charCodeAt(i);
    }
    generatedCode = "lang_" + Math.abs(h % 1000);
  }

  return {
    code: generatedCode,
    name: clean,
    nativeName: clean,
    dir: isRtl ? "rtl" : "ltr",
    flag: "🌐",
  };
}
