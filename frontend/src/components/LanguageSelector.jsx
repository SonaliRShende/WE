import { Globe } from "lucide-react";
import { useLocale } from "../context/LocaleContext";

export default function LanguageSelector({ compact = false }) {
  const { language, setLanguage, supportedLanguages, messages } = useLocale();

  return (
    <label
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm backdrop-blur ${compact ? "w-full justify-between" : ""}`}
    >
      <span className="flex items-center gap-2 font-medium">
        <Globe size={16} className="text-sky-700" />
        <span>{messages.nav.language}</span>
      </span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="min-w-[6.5rem] bg-transparent text-sm font-semibold text-slate-900 outline-none"
        aria-label={messages.nav.language}
      >
        {supportedLanguages.map((option) => (
          <option key={option.code} value={option.code}>
            {option.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
