import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  defaultLanguage,
  getLanguageMeta,
  supportedLanguages,
  translations,
} from "../content/locales";

const STORAGE_KEY = "shaurya-language";

const LocaleContext = createContext(null);

const resolvePath = (obj, path) =>
  path.split(".").reduce((accumulator, segment) => accumulator?.[segment], obj);

export function LocaleProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const storedLanguage = localStorage.getItem(STORAGE_KEY);
    return translations[storedLanguage] ? storedLanguage : defaultLanguage;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = getLanguageMeta(language).htmlLang;
  }, [language]);

  const value = useMemo(() => {
    const messages = translations[language];
    const meta = getLanguageMeta(language);

    const t = (path, replacements = {}) => {
      const resolved = resolvePath(messages, path);

      if (typeof resolved === "function") {
        return resolved(replacements);
      }

      if (typeof resolved !== "string") {
        return resolved;
      }

      return resolved.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? `{${key}}`);
    };

    return {
      language,
      setLanguage,
      supportedLanguages,
      speechLocale: meta.speechLocale,
      languageLabel: meta.nativeLabel,
      messages,
      t,
    };
  }, [language]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
