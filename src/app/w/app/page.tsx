import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";
import { getT } from "@/lib/i18n";
import { Card, EmptyState } from "@/components/ui";
import { formatTime, toDateString } from "@/lib/utils";
import type { Shift } from "@/lib/types";
import { StartShiftButton } from "./StartShiftButton";

export default async function WaiterHomePage() {
  const session = await getWaiterSession();
  if (!session) redirect("/w");
  const t = await getT();

  const admin = createAdminClient();
  const today = toDateString(new Date());

  const [openRes, upcomingRes] = await Promise.all([
    admin
      .from("shift_sessions")
      .select("id, started_at")
      .eq("waiter_id", session.waiterId)
      .eq("venue_id", session.venueId)
      .is("ended_at", null)
      .maybeSingle(),
    admin
      .from("shifts")
      .select("*, schedules!inner(status)")
      .eq("waiter_id", session.waiterId)
      .eq("venue_id", session.venueId)
      .eq("schedules.status", "published")
      .gte("shift_date", today)
      .order("shift_date")
      .order("start_time")
      .limit(7),
  ]);

  const openSession = openRes.data;
  const upcoming = (upcomingRes.data ?? []) as Shift[];

  const dayNames = [1, 2, 3, 4, 5, 6, 7].map((d) =>
    t(`day.${d}` as Parameters<typeof t>[0])
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <StartShiftButton
        openSession={
          openSession
            ? { id: openSession.id, startedAt: openSession.started_at }
            : null
        }
      />

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-espresso/40">
          {t("waiter.upcomingShifts")}
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState>{t("waiter.noUpcoming")}</EmptyState>
        ) : (
          <div className="space-y-2">
            {upcoming.map((s) => {
              const d = new Date(s.shift_date + "T12:00:00");
              const weekday = d.getDay() === 0 ? 7 : d.getDay();
              const isToday = s.shift_date === toDateString(new Date());
              return (
                <Card
                  key={s.id}
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    isToday ? "border-l-4 border-l-terracotta" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold">
                      {isToday ? t("common.today") : dayNames[weekday - 1]}
                    </p>
                    <p className="text-sm text-espresso/50 tabular-nums">
                      {s.shift_date.slice(8, 10)}.{s.shift_date.slice(5, 7)}.
                    </p>
                  </div>
                  <p className="font-display text-lg font-semibold tabular-nums">
                    {formatTime(s.start_time)} – {formatTime(s.end_time)}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
