import React, { createContext, useContext, useState, useEffect } from "react";
import { en } from "./locales/en";
import { hi } from "./locales/hi";
import { ta } from "./locales/ta";
import { te } from "./locales/te";

export type Language = "hi" | "ta" | "te" | "en";

export interface LanguageInfo {
  code: Language;
  nativeName: string;
  englishName: string;
  flag: string;
  dir: "ltr" | "rtl";
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", flag: "🇮🇳", dir: "ltr" },
  { code: "ta", nativeName: "தமிழ்", englishName: "Tamil", flag: "🇮🇳", dir: "ltr" },
  { code: "te", nativeName: "తెలుగు", englishName: "Telugu", flag: "🇮🇳", dir: "ltr" },
  { code: "en", nativeName: "English", englishName: "English", flag: "🌐", dir: "ltr" },
];

export const translations: Record<Language, Record<string, string>> = {
  hi,
  ta,
  te,
  en,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: "hi",
  setLanguage: () => {},
  t: (key: string) => key,
  dir: "ltr",
  languages: LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "hi";
    const saved = localStorage.getItem("gramx_language") as Language;
    if (saved && (saved === "hi" || saved === "ta" || saved === "te" || saved === "en")) {
      return saved;
    }
    // Auto-detect browser language if available
    const browserLang = navigator.language?.toLowerCase() || "";
    if (browserLang.startsWith("ta")) return "ta";
    if (browserLang.startsWith("te")) return "te";
    if (browserLang.startsWith("hi")) return "hi";
    // Default to Hindi (Directive #40)
    return "hi";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("gramx_language", lang);
      document.documentElement.lang = lang;
      const langInfo = LANGUAGES.find(l => l.code === lang);
      document.documentElement.dir = langInfo?.dir || "ltr";
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = language;
      const langInfo = LANGUAGES.find(l => l.code === language);
      document.documentElement.dir = langInfo?.dir || "ltr";
    }
  }, [language]);

  const t = (key: string, variables?: Record<string, string | number>): string => {
    let text = translations[language]?.[key] || translations["en"]?.[key] || key;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return text;
  };

  const currentLangInfo = LANGUAGES.find(l => l.code === language);
  const dir = currentLangInfo?.dir || "ltr";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
