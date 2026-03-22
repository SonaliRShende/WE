import { motion } from "framer-motion";
import { BriefcaseBusiness, Building2, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useLocale } from "../context/LocaleContext";
import heroImg from "../assets/women-hero.jpg";

const heroAnimation = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65 } },
};

export default function Landing() {
  const navigate = useNavigate();
  const { messages } = useLocale();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, []);

  const goToSeekerFlow = () => {
    navigate(user ? "/job-seeker-dashboard" : "/register");
  };

  const goToProviderFlow = () => {
    navigate(user ? "/job-provider-dashboard" : "/register");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
         <section className="relative overflow-hidden">
  <div
    className="absolute inset-0 bg-cover opacity-100"
    style={{
      backgroundImage: `url(${heroImg})`,
      backgroundPosition: "75% center",
    }}
  />
         <div className="absolute inset-0 " />
           <div className="relative mx-auto  max-w-7xl gap-10 px-4 py-18 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-6">
            <motion.div
              initial="hidden"
              animate="show"
              variants={heroAnimation}
              className="max-w-2xl"
            >
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl drop-shadow-[0_4px_8px_rgba(0,0,0,1)]">
                <span className="block">{messages.landing.titleLine1}</span>
                <span className="block text-sky-300">{messages.landing.titleLine2}</span>
                <span className="block text-cyan-100">{messages.landing.titleLine3}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
                {messages.landing.description}
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={goToSeekerFlow}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-sky-50"
                >
                  <BriefcaseBusiness size={17} />
                  {messages.landing.primaryCta}
                </button>
                <button
                  type="button"
                  onClick={goToProviderFlow}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/15"
                >
                  <Building2 size={17} />
                  {messages.landing.secondaryCta}
                </button>
              </div>
            </motion.div>

          </div>
        </section>
        <section id="about" className="mx-auto max-w-7xl px-4 py-18 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <article className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(160deg,#eff6ff,#ffffff)] p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                {messages.nav.about}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                {messages.landing.aboutTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                {messages.landing.aboutBody}
              </p>
            </article>

            <div className="grid gap-6 sm:grid-cols-2">
              <button
                type="button"
                onClick={goToSeekerFlow}
                className="rounded-[2rem] border border-slate-200 bg-white/90 p-7 text-left shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] transition hover:-translate-y-1"
              >
                <div className="inline-flex rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <BriefcaseBusiness size={22} />
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-slate-950">
                  {messages.landing.roleCards.seekerTitle}
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  {messages.landing.roleCards.seekerBody}
                </p>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                  {messages.landing.roleCards.seekerAction}
                </p>
              </button>

              <button
                type="button"
                onClick={goToProviderFlow}
                className="rounded-[2rem] border border-slate-200 bg-white/90 p-7 text-left shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] transition hover:-translate-y-1"
              >
                <div className="inline-flex rounded-2xl bg-indigo-50 p-3 text-indigo-700">
                  <Building2 size={22} />
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-slate-950">
                  {messages.landing.roleCards.providerTitle}
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  {messages.landing.roleCards.providerBody}
                </p>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">
                  {messages.landing.roleCards.providerAction}
                </p>
              </button>
            </div>
          </div>
        </section>

        <section id="contact" className="px-4 pb-18 sm:px-6">
          <div className="mx-auto max-w-7xl rounded-[2.25rem] bg-[linear-gradient(120deg,#10203d,#1d4ed8,#0ea5e9)] px-6 py-12 text-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.8)] sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-100">
              {messages.nav.contact}
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              {messages.landing.contactTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-sky-100">
              {messages.landing.contactBody}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={goToSeekerFlow}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-50"
              >
                {messages.landing.primaryCta}
              </button>
              <button
                type="button"
                onClick={goToProviderFlow}
                className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                {messages.landing.secondaryCta}
              </button>
            </div>
          </div>
        </section> 
      </main>

      <Footer />
    </div>
  );
}
