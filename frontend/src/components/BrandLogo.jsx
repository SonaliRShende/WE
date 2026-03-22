import { useLocale } from "../context/LocaleContext";

export default function BrandLogo({
  compact = false,
  showTagline = true,
  className = "",
}) {
  const { messages } = useLocale();

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div className="">
        <img
          src="/shaurya-logo.png"
          alt={`${messages.brand.name} logo`}
          className="h-16 w-16 object-contain drop-shadow-[0_4px_8px_rgba(29,78,216,0.85)]"
        />
      </div>

      <div className={compact ? "hidden sm:block" : ""}>
      <p className="text-lg font-semibold text-slate-950 sm:text-xl font-serif">
        {messages.brand.name}
      </p>
        {showTagline && (
          <p className=" text-sm text-slate-600 lg:block">
            {messages.brand.tagline}
          </p>
        )}
      </div>
    </div>
  );
}