import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { useLocale } from "../context/LocaleContext";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const { messages } = useLocale();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center px-4 py-12 sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white/90 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] lg:grid-cols-[0.95fr_1.05fr]">
          <section className="bg-[linear-gradient(145deg,#10203d,#1d4ed8,#38bdf8)] px-8 py-12 text-white sm:px-12">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-100">
              {messages.brand.shortName}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              {messages.auth.loginTitle}
            </h1>
            <p className="mt-4 max-w-md text-base leading-8 text-sky-100">
              {messages.auth.loginBody}
            </p>

          </section>

          <section className="px-8 py-12 sm:px-12">
            <form onSubmit={handleSubmit} className="mx-auto max-w-md">
              <div className="space-y-5">
                {error && (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </p>
                )}

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Mail size={16} />
                    {messages.auth.email}
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder={messages.auth.email}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <LockKeyhole size={16} />
                    {messages.auth.password}
                  </span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder={messages.auth.password}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      onChange={handleChange}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-8 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? messages.auth.loginLoading : messages.auth.loginAction}
              </button>

              <p className="mt-6 text-center text-sm text-slate-600">
                {messages.auth.needAccount}{" "}
                <Link to="/register" className="font-semibold text-sky-700 hover:text-sky-800">
                  {messages.auth.signUp}
                </Link>
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Login;
