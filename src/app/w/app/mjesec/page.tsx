import { redirect } from "next/navigation";
import { Award, Coins, PiggyBank, Timer } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";
import { getT } from "@/lib/i18n";
import { Card, PageTitle } from "@/components/ui";
import { formatHours, formatMoney, toDateString } from "@/lib/utils";
import type { ShiftSession, Tip } from "@/lib/types";
import { TipForm } from "./TipForm";

export default async function MonthPage() {
  const session = await getWaiterSession();
  if (!session) redirect("/w");
  const t = await getT();

  const admin = createAdminClient();
  const now = new Date();
  const monthStart = `${toDateString(now).slice(0, 7)}-01`;

  const [monthSessionsRes, allSessionsRes, tipsRes, meRes] = await Promise.all([
    admin
      .from("shift_sessions")
      .select("started_at, ended_at")
      .eq("waiter_id", session.waiterId)
      .eq("venue_id", session.venueId)
      .gte("started_at", `${monthStart}T00:00:00`)
      .not("ended_at", "is", null),
    admin
      .from("shift_sessions")
      .select("started_at, ended_at")
      .eq("waiter_id", session.waiterId)
      .eq("venue_id", session.venueId)
      .not("ended_at", "is", null),
    admin
      .from("tips")
      .select("*")
      .eq("waiter_id", session.waiterId)
      .gte("tip_date", monthStart)
      .order("tip_date", { ascending: false }),
    admin
      .from("waiters")
      .select("hourly_rate")
      .eq("id", session.waiterId)
      .single(),
  ]);

  const sumMs = (rows: Pick<ShiftSession, "started_at" | "ended_at">[]) =>
    rows.reduce(
      (sum, s) =>
        sum + (new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()),
      0
    );

  const monthSessions = monthSessionsRes.data ?? [];
  const allSessions = allSessionsRes.data ?? [];
  const monthMs = sumMs(monthSessions);
  const monthHours = monthMs / 3600_000;
  const hourlyRate = meRes.data?.hourly_rate ? Number(meRes.data.hourly_rate) : null;
  const tips = (tipsRes.data ?? []) as Tip[];
  const tipsSum = tips.reduce((s, tp) => s + Number(tp.amount), 0);

  // All-time achievements
  const totalShifts = allSessions.length;
  const totalHours = sumMs(allSessions) / 3600_000;
  const earlyStarts = allSessions.filter(
    (s) => new Date(s.started_at).getHours() < 7
  ).length;
  const badges = [
    { key: "badge.first", icon: "🎉", earned: totalShifts >= 1 },
    { key: "badge.s25", icon: "💪", earned: totalShifts >= 25 },
    { key: "badge.s100", icon: "🏆", earned: totalShifts >= 100 },
    { key: "badge.h100", icon: "⏱️", earned: totalHours >= 100 },
    { key: "badge.checklist", icon: "✅", earned: totalShifts >= 10 },
    { key: "badge.earlybird", icon: "🌅", earned: earlyStarts >= 5 },
  ] as const;

  const monthLabel = now.toLocaleDateString("hr-HR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <div>
        <PageTitle>{t("month.title")}</PageTitle>
        <p className="mt-1 text-sm capitalize text-espresso-light">{monthLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-espresso/40">
            <Timer className="h-3.5 w-3.5" /> {t("month.hours")}
          </p>
          <p className="font-display text-2xl font-bold tabular-nums">
            {formatHours(monthMs)} h
          </p>
          <p className="text-xs text-espresso/50">
            {monthSessions.length} {t("month.shifts")}
          </p>
        </Card>

        <Card className="p-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-espresso/40">
            <PiggyBank className="h-3.5 w-3.5" /> {t("month.earnings")}
          </p>
          {hourlyRate ? (
            <>
              <p className="font-display text-2xl font-bold tabular-nums text-success">
                {formatMoney(monthHours * hourlyRate)}
              </p>
              <p className="text-xs text-espresso/50">
                {formatMoney(hourlyRate)}/h
              </p>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-espresso-light">
              {t("month.noRate")}
            </p>
          )}
        </Card>
      </div>

      {/* Tips */}
      <Card className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-espresso/40">
            <Coins className="h-3.5 w-3.5" /> {t("month.tips")}
          </p>
          <p className="font-display text-xl font-bold tabular-nums">
            {formatMoney(tipsSum)}
          </p>
        </div>
        <p className="mb-3 text-xs text-espresso/50">{t("month.tipsPrivate")}</p>
        <TipForm />
        {tips.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-espresso/5 pt-3">
            {tips.slice(0, 8).map((tp) => (
              <li
                key={tp.id}
                className="flex items-center justify-between text-sm text-espresso-light"
              >
                <span className="tabular-nums">
                  {tp.tip_date.slice(8, 10)}.{tp.tip_date.slice(5, 7)}.
                </span>
                <span className="font-semibold tabular-nums text-espresso">
                  {formatMoney(Number(tp.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Badges */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-espresso/40">
          <Award className="h-4 w-4" /> {t("month.badges")}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {badges.map((b) => (
            <div
              key={b.key}
              className={`rounded-card p-3 text-center shadow-soft ${
                b.earned ? "bg-white" : "bg-cream-dark/60 opacity-45 grayscale"
              }`}
            >
              <div className="text-2xl">{b.icon}</div>
              <p className="mt-1 text-[11px] font-bold leading-tight">
                {t(b.key)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
