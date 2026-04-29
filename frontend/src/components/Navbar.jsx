import { useEffect, useState } from "react";
import {
  Bell,
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
import { buildApiUrl } from "../config/api";

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
  const { messages, language } = useLocale();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const parsedUser = stored ? JSON.parse(stored) : null;
    setUser(parsedUser);
    setShowDropdown(false);
    setShowNotifications(false);
    setMobileOpen(false);

    const fetchNotifications = async () => {
      if (!parsedUser?.id) {
        setNotifications([]);
        return;
      }

      try {
        const response = await fetch(
          buildApiUrl(`/api/notifications/${parsedUser.id}`, { lang: language })
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load notifications");
        }
        setNotifications((data.notifications || []).slice(0, 8));
      } catch (error) {
        console.error("Navbar notifications error:", error);
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, [language, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setShowDropdown(false);
    setShowNotifications(false);
    setMobileOpen(false);
    navigate("/");
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const markAllNotificationsRead = async () => {
    if (!user?.id || !notifications.some((item) => !item.is_read)) {
      return;
    }

    try {
      await fetch(buildApiUrl(`/api/notifications/${user.id}/mark-read`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifications((previous) => previous.map((item) => ({ ...item, is_read: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
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
                  onClick={() => {
                    setShowNotifications((current) => !current);
                    setShowDropdown(false);
                  }}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                  title={messages.nav.notifications}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10">
                    <div className="mb-2 flex items-center justify-between px-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {messages.nav.notifications}
                      </p>
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-sky-700 transition hover:text-sky-800"
                      >
                        {messages.nav.markAllRead}
                      </button>
                    </div>
                    {!notifications.length ? (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{messages.nav.noNotifications}</div>
                    ) : (
                      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                        {notifications.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                              {String(item.type || "notification").replaceAll("_", " ")}
                            </p>
                            {!item.is_read && <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Unread</p>}
                            <p className="mt-1 text-sm text-slate-800">{item.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown((current) => !current);
                    setShowNotifications(false);
                  }}
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
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications((current) => !current);
                    setShowDropdown(false);
                  }}
                  className="inline-flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800"
                >
                  <span className="inline-flex items-center gap-2">
                    <Bell size={16} />
                    {messages.nav.notifications}
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{messages.nav.notifications}</p>
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-sky-700"
                      >
                        {messages.nav.markAllRead}
                      </button>
                    </div>
                    {!notifications.length ? (
                      <p className="text-sm text-slate-600">{messages.nav.noNotifications}</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.slice(0, 5).map((item) => (
                          <div key={item.id} className="rounded-xl bg-slate-50 p-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                              {String(item.type || "notification").replaceAll("_", " ")}
                            </p>
                            {!item.is_read && <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Unread</p>}
                            <p className="mt-1 text-sm text-slate-800">{item.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
