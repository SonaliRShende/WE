import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { useLocale } from "../context/LocaleContext";

export default function Footer() {
  const { messages, t } = useLocale();

  return (
    <footer className="border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.35fr_0.9fr_1fr]">
        <div className="space-y-4">
          <BrandLogo showTagline={false} />
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            {messages.brand.footerSummary}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {messages.footer.quickLinks}
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-700">
            <Link to="/" className="transition hover:text-sky-700">
              {messages.nav.home}
            </Link>
            <a href="/#features" className="transition hover:text-sky-700">
              {messages.nav.features}
            </a>
            <a href="/#about" className="transition hover:text-sky-700">
              {messages.nav.about}
            </a>
            <a href="/#contact" className="transition hover:text-sky-700">
              {messages.nav.contact}
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {messages.footer.accessTitle}
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {messages.footer.accessBody}
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-4 text-center text-sm text-slate-500 sm:px-6">
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
