import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Wallet,
  Coffee,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { getT } from "@/lib/i18n";
import { LocaleToggle } from "@/components/LocaleToggle";

export default async function LandingPage() {
  const t = await getT();

  const features = [
    {
      icon: CalendarDays,
      title: t("landing.feature1Title"),
      text: t("landing.feature1Text"),
    },
    {
      icon: Clock3,
      title: t("landing.feature2Title"),
      text: t("landing.feature2Text"),
    },
    {
      icon: Wallet,
      title: t("landing.feature3Title"),
      text: t("landing.feature3Text"),
    },
  ];

  const steps = [t("landing.how1"), t("landing.how2"), t("landing.how3")];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-terracotta" />
          <span className="font-display text-xl font-semibold">mojlokal</span>
        </div>
        <div className="flex items-center gap-3">
          <LocaleToggle />
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-espresso hover:bg-espresso/5"
          >
            {t("landing.ctaLogin")}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-5 py-12 sm:py-20 lg:grid-cols-2">
          <div>
            <p className="mb-3 inline-block rounded-full bg-sage-light px-3 py-1 text-xs font-bold uppercase tracking-wide text-sage-dark">
              {t("landing.tagline")}
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-4 max-w-lg text-lg text-espresso-light">
              {t("landing.heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login?mode=register"
                className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-6 py-4 text-base font-bold text-white shadow-lifted transition-colors hover:bg-terracotta-dark"
              >
                {t("landing.cta")}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/w"
                className="inline-flex items-center gap-2 rounded-xl border border-espresso/15 px-6 py-4 text-base font-semibold text-espresso hover:bg-espresso/5"
              >
                {t("auth.waiterLink")}
              </Link>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="mx-auto w-full max-w-[300px]">
            <div className="rounded-[2.2rem] border-[10px] border-espresso bg-cream p-4 shadow-lifted">
              <p className="text-sm font-semibold text-espresso-light">
                {t("landing.demoHello")} 👋
              </p>
              <p className="mt-1 text-xs text-espresso/50">
                {t("landing.demoShift")}
              </p>
              <div className="mt-5 flex h-44 items-center justify-center rounded-3xl bg-terracotta text-center shadow-soft">
                <span className="px-4 font-display text-2xl font-bold leading-snug text-white">
                  {t("landing.demoStart")}
                </span>
              </div>
              <div className="mt-5 space-y-2">
                {[t("landing.feature3Title"), t("landing.feature2Title")].map(
                  (label) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-soft"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      <span className="text-xs font-semibold text-espresso">
                        {label}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-cream-dark/50 py-14">
          <div className="mx-auto grid w-full max-w-5xl gap-5 px-5 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-card border border-espresso/5 bg-white p-6 shadow-soft"
              >
                <div className="mb-4 inline-flex rounded-xl bg-terracotta-light p-3">
                  <Icon className="h-6 w-6 text-terracotta" />
                </div>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-espresso-light">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto w-full max-w-5xl px-5 py-14">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            {t("landing.howTitle")}
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-card bg-white p-5 shadow-soft"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-espresso font-display text-sm font-bold text-cream">
                  {i + 1}
                </span>
                <span className="text-sm font-medium leading-relaxed">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-8 py-4 text-lg font-bold text-white shadow-lifted transition-colors hover:bg-terracotta-dark"
            >
              {t("landing.cta")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-espresso/10 py-6 text-center text-xs text-espresso/50">
        <p>
          {t("landing.footer")} · © {new Date().getFullYear()}
        </p>
        <p className="mt-2 space-x-4">
          <Link href="/impressum" className="underline underline-offset-4 hover:text-espresso">
            {t("landing.imprint")}
          </Link>
          <Link href="/privatnost" className="underline underline-offset-4 hover:text-espresso">
            {t("landing.privacy")}
          </Link>
        </p>
      </footer>
    </div>
  );
}
