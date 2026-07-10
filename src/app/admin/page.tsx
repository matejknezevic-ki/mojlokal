import Link from "next/link";
import { ArrowRight, Clock3, Users, Wallet } from "lucide-react";
import { requireOwnerVenue } from "@/lib/owner";
import { getT } from "@/lib/i18n";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import {
  formatHours,
  formatMoney,
  formatTime,
  mondayOf,
  toDateString,
} from "@/lib/utils";
import type { Shift, ShiftSession, Waiter } from "@/lib/types";

export default async function DashboardPage() {
  const { supabase, venue } = await requireOwnerVenue();
  const t = await getT(venue.default_locale);

  const today = toDateString(new Date());
  const weekStart = mondayOf(new Date());

  const [waitersRes, openSessionsRes, todayShiftsRes, lastCashRes, weekSessionsRes] =
    await Promise.all([
      supabase.from("waiters").select("*").eq("venue_id", venue.id),
      supabase
        .from("shift_sessions")
        .select("*")
        .eq("venue_id", venue.id)
        .is("ended_at", null),
      supabase
        .from("shifts")
        .select("*, schedules!inner(status)")
        .eq("venue_id", venue.id)
        .eq("shift_date", today)
        .eq("schedules.status", "published")
        .order("start_time"),
      supabase
        .from("cash_counts")
        .select("*")
        .eq("venue_id", venue.id)
        .order("counted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("shift_sessions")
        .select("*")
        .eq("venue_id", venue.id)
        .gte("started_at", `${weekStart}T00:00:00`)
        .not("ended_at", "is", null),
    ]);

  const waiters = (waitersRes.data ?? []) as Waiter[];
  const waiterName = (id: string) =>
    waiters.find((w) => w.id === id)?.name ?? "?";
  const openSessions = (openSessionsRes.data ?? []) as ShiftSession[];
  const todayShifts = (todayShiftsRes.data ?? []) as Shift[];
  const lastCash = lastCashRes.data;
  const weekMs = ((weekSessionsRes.data ?? []) as ShiftSession[]).reduce(
    (sum, s) =>
      sum + (new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()),
    0
  );

  return (
    <div className="space-y-6">
      <PageTitle>{venue.owner_name ? `${t("waiter.hello")}, ${venue.owner_name}!` : venue.name}</PageTitle>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Working now */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-espresso/40">
            <Users className="h-4 w-4" /> {t("dash.workingNow")}
          </div>
          {openSessions.length === 0 ? (
            <p className="text-sm text-espresso-light">{t("dash.nobodyWorking")}</p>
          ) : (
            <ul className="space-y-2">
              {openSessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl bg-success-light px-4 py-3"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                    {waiterName(s.waiter_id)}
                  </span>
                  <span className="text-sm text-espresso-light">
                    {t("dash.sinceTime")}{" "}
                    {new Date(s.started_at).toLocaleTimeString("hr-HR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Last cash */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-espresso/40">
            <Wallet className="h-4 w-4" /> {t("dash.lastCash")}
          </div>
          {lastCash ? (
            <div>
              <p className="font-display text-3xl font-bold text-espresso">
                {formatMoney(Number(lastCash.amount), venue.currency)}
              </p>
              <p className="mt-1 text-sm text-espresso-light">
                {waiterName(lastCash.waiter_id)} ·{" "}
                {new Date(lastCash.counted_at).toLocaleString("hr-HR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-espresso-light">{t("dash.noCashYet")}</p>
          )}
        </Card>

        {/* Today's shifts */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-espresso/40">
            <Clock3 className="h-4 w-4" /> {t("dash.todayShifts")}
          </div>
          {todayShifts.length === 0 ? (
            <p className="text-sm text-espresso-light">{t("dash.noShiftsToday")}</p>
          ) : (
            <ul className="space-y-2">
              {todayShifts.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl bg-cream-dark px-4 py-3"
                >
                  <span className="font-semibold">{waiterName(s.waiter_id)}</span>
                  <span className="text-sm text-espresso-light">
                    {formatTime(s.start_time)} – {formatTime(s.end_time)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Week hours */}
        <Card className="p-5">
          <div className="mb-3 text-sm font-bold uppercase tracking-wide text-espresso/40">
            {t("dash.thisWeekHours")}
          </div>
          <p className="font-display text-3xl font-bold">
            {formatHours(weekMs)} <span className="text-base font-normal text-espresso-light">{t("common.hours")}</span>
          </p>
        </Card>
      </div>

      <Link
        href="/admin/raspored"
        className="inline-flex items-center gap-2 font-semibold text-terracotta underline-offset-4 hover:underline"
      >
        {t("dash.quickSchedule")} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export const dynamic = "force-dynamic";
