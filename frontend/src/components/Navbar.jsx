import { useEffect, useState } from "react";
import {
  LogIn,
  LogOut,
  Menu,
  UserPlus,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import LanguageSelector from "./LanguageSelector";
import { useLocale } from "../context/LocaleContext";

const getInitials = (name) => {
  if (!name) {
    return "U";
  }

  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name[0].toUpperCase();
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { messages } = useLocale();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
    setShowDropdown(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setShowDropdown(false);
    setMobileOpen(false);
    navigate("/");
  };

  const guestLinks = [
    { href: "/#features", label: messages.nav.features },
    { href: "/#about", label: messages.nav.about },
    { href: "/#contact", label: messages.nav.contact },
  ];

  const userLinks = [
    { to: "/", label: messages.nav.home },
    { href: "/#contact", label: messages.nav.contact },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-8xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0">
          <BrandLogo compact />
        </Link>

        <div className="hidden items-center gap-3 lg:flex">
          {(user ? userLinks : guestLinks).map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </a>
            )
          )}
          <LanguageSelector />
          {user ? (
            <>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown((current) => !current)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-sky-200"
                  title={user.name}
                >
                  {getInitials(user.name)}
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {messages.nav.signedInAs}
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-950">{user.name}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <LogOut size={16} />
                      {messages.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <LogIn size={16} />
                {messages.nav.login}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full  px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-100"
              >
                <UserPlus size={16} />
                {messages.nav.getStarted}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
          aria-label={messages.nav.menu}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {(user ? userLinks : guestLinks).map((item) =>
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                >
                  {item.label}
                </a>
              )
            )}

            <LanguageSelector compact />

            {user ? (
              <>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {messages.nav.signedInAs}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{user.name}</p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                >
                  <LogOut size={16} />
                  {messages.nav.logout}
                </button>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800"
                >
                  <LogIn size={16} />
                  {messages.nav.login}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl  px-4 py-3 text-sm font-semibold text-white"
                >
                  <UserPlus size={16} />
                  {messages.nav.getStarted}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
