import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Coffee, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import {
  BILLING_CONTACT_EMAIL,
  MONTHLY_PRICE,
  MONTHLY_PRICE_EARLY,
  ONE_TIME_PRICE,
  ONE_TIME_PRICE_EARLY,
  subscriptionState,
} from "@/lib/billing";
import { Card } from "@/components/ui";
import { LocaleToggle } from "@/components/LocaleToggle";
import type { Venue } from "@/lib/types";
import { DiscountCodeForm } from "./DiscountCodeForm";

const eur = (n: number) =>
  n.toLocaleString("hr-HR", { minimumFractionDigits: n % 1 ? 2 : 0 }) + " €";

// Paywall page — deliberately outside /admin so it stays reachable after expiry.
export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venueRow } = await supabase
    .from("venues")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!venueRow) redirect("/onboarding");
  const venue = venueRow as Venue;

  const t = await getT(venue.default_locale);
  const state = subscriptionState(venue);
  const early = venue.early_bird;

  const oneTime = early ? ONE_TIME_PRICE_EARLY : ONE_TIME_PRICE;
  const monthly = early ? MONTHLY_PRICE_EARLY : MONTHLY_PRICE;
  const mailSubject = encodeURIComponent(`mojlokal pretplata — ${venue.name}`);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-terracotta" />
          <span className="font-display text-xl font-semibold">mojlokal</span>
        </Link>
        <LocaleToggle />
      </header>

      <main className="flex flex-1 flex-col justify-center pb-16">
        {state.status === "active" ? (
          <Card className="p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h1 className="mt-4 font-display text-2xl font-semibold">
              {venue.subscription_status === "free"
                ? t("sub.freeTitle")
                : t("sub.activeTitle")}
            </h1>
            <Link
              href="/admin"
              className="mt-6 inline-block rounded-xl bg-espresso px-6 py-3 font-semibold text-cream"
            >
              {t("sub.backToApp")}
            </Link>
          </Card>
        ) : (
          <Card className="p-6">
            <h1 className="font-display text-2xl font-semibold">
              {state.status === "expired" ? t("sub.expiredTitle") : t("sub.title")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-espresso-light">
              {state.status === "expired"
                ? t("sub.expiredText")
                : `${t("sub.trialInfo")}:`}
            </p>

            {early && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-success-light px-4 py-2.5 text-sm font-bold text-success">
                <Sparkles className="h-4 w-4" /> {t("sub.earlyBird")}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-card bg-cream-dark p-4">
                {early && (
                  <p className="text-sm text-espresso/40 line-through">
                    {eur(ONE_TIME_PRICE)}
                  </p>
                )}
                <p className="font-display text-3xl font-bold">{eur(oneTime)}</p>
                <p className="mt-1 text-xs text-espresso-light">{t("sub.oneTime")}</p>
              </div>
              <div className="rounded-card bg-cream-dark p-4">
                {early && (
                  <p className="text-sm text-espresso/40 line-through">
                    {eur(MONTHLY_PRICE)}
                  </p>
                )}
                <p className="font-display text-3xl font-bold">{eur(monthly)}</p>
                <p className="mt-1 text-xs text-espresso-light">
                  {t("sub.monthly")}
                  {early && (
                    <>
                      <br />
                      {t("sub.earlyMonthlyNote")}
                    </>
                  )}
                </p>
              </div>
            </div>

            {!early && <DiscountCodeForm />}

            <a
              href={`mailto:${BILLING_CONTACT_EMAIL}?subject=${mailSubject}`}
              className="mt-6 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-terracotta font-display text-lg font-bold text-white shadow-lifted active:scale-[0.98]"
            >
              <Mail className="h-5 w-5" /> {t("sub.activate")}
            </a>
            <p className="mt-3 text-center text-xs text-espresso/50">
              {t("sub.contactHint")}
            </p>

            {state.status === "trial" && (
              <Link
                href="/admin"
                className="mt-6 block text-center text-sm font-semibold text-espresso-light underline-offset-4 hover:underline"
              >
                {t("sub.backToApp")}
              </Link>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
