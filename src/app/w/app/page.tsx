import { redirect } from "next/navigation";
import { StickyNote, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";
import { getT } from "@/lib/i18n";
import { Card, EmptyState } from "@/components/ui";
import { addDays, formatTime, mondayOf, toDateString } from "@/lib/utils";
import type { Shift, SwapRequest } from "@/lib/types";
import { StartShiftButton } from "./StartShiftButton";
import { UpcomingShifts, OpenSwapOffers } from "./SwapControls";
import { QuickActions } from "./QuickActions";

export default async function WaiterHomePage() {
  const session = await getWaiterSession();
  if (!session) redirect("/w");
  const t = await getT();

  const admin = createAdminClient();
  const today = toDateString(new Date());
  const weekStart = mondayOf(new Date());
  const weekEnd = addDays(weekStart, 6);
  const handoverSince = new Date(Date.now() - 18 * 3600_000).toISOString();

  const [
    openRes,
    upcomingRes,
    todayTeamRes,
    handoverRes,
    waitersRes,
    swapsRes,
    meRes,
  ] = await Promise.all([
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
    admin
      .from("shifts")
      .select("waiter_id, start_time, end_time, schedules!inner(status)")
      .eq("venue_id", session.venueId)
      .eq("shift_date", today)
      .eq("schedules.status", "published")
      .neq("waiter_id", session.waiterId),
    admin
      .from("shift_sessions")
      .select("handover_note, ended_at, waiter_id")
      .eq("venue_id", session.venueId)
      .not("handover_note", "is", null)
      .gte("ended_at", handoverSince)
      .order("ended_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("waiters").select("id, name").eq("venue_id", session.venueId),
    admin
      .from("swap_requests")
      .select("*, shifts!inner(shift_date, start_time, end_time)")
      .eq("venue_id", session.venueId)
      .in("status", ["open", "accepted"]),
    admin
      .from("waiters")
      .select("calendar_token")
      .eq("id", session.waiterId)
      .single(),
  ]);

  const waiterName = (id: string | null) =>
    (waitersRes.data ?? []).find((w) => w.id === id)?.name ?? "?";
  const openSession = openRes.data;
  const upcoming = (upcomingRes.data ?? []) as Shift[];
  const handover = handoverRes.data;
  const swaps = (swapsRes.data ?? []) as (SwapRequest & {
    shifts: { shift_date: string; start_time: string; end_time: string };
  })[];
  const mySwapByShift = new Map(
    swaps
      .filter((s) => s.from_waiter_id === session.waiterId)
      .map((s) => [s.shift_id, s])
  );
  const openOffers = swaps.filter(
    (s) =>
      s.status === "open" &&
      s.from_waiter_id !== session.waiterId &&
      s.shifts.shift_date >= today
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

      {/* Handover note from the previous shift */}
      {handover?.handover_note && (
        <Card className="border-l-4 border-l-sage p-4">
          <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sage-dark">
            <StickyNote className="h-3.5 w-3.5" /> {t("handover.title")} ·{" "}
            {waiterName(handover.waiter_id)}
          </p>
          <p className="text-sm font-medium">„{handover.handover_note}“</p>
        </Card>
      )}

      {/* Who works with me today */}
      <Card className="p-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-espresso/40">
          <Users className="h-3.5 w-3.5" /> {t("team.today")}
        </p>
        {(todayTeamRes.data ?? []).length === 0 ? (
          <p className="text-sm text-espresso-light">{t("team.todayNone")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(todayTeamRes.data ?? []).map((s, i) => (
              <span
                key={i}
                className="rounded-full bg-sage-light px-3 py-1.5 text-sm font-semibold text-sage-dark"
              >
                {waiterName(s.waiter_id)}{" "}
                <span className="font-normal opacity-70 tabular-nums">
                  {formatTime(s.start_time)}–{formatTime(s.end_time)}
                </span>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming shifts incl. swap offers */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-espresso/40">
          {t("waiter.upcomingShifts")}
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState>{t("waiter.noUpcoming")}</EmptyState>
        ) : (
          <UpcomingShifts
            shifts={upcoming.map((s) => ({
              id: s.id,
              date: s.shift_date,
              start: formatTime(s.start_time),
              end: formatTime(s.end_time),
              swapStatus: mySwapByShift.get(s.id)?.status ?? null,
              swapId: mySwapByShift.get(s.id)?.id ?? null,
            }))}
          />
        )}
      </section>

      {/* Colleagues' open offers */}
      {openOffers.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-espresso/40">
            {t("swap.openOffers")}
          </h2>
          <OpenSwapOffers
            offers={openOffers.map((s) => ({
              id: s.id,
              from: waiterName(s.from_waiter_id),
              date: s.shifts.shift_date,
              start: formatTime(s.shifts.start_time),
              end: formatTime(s.shifts.end_time),
            }))}
          />
        </section>
      )}

      <QuickActions calendarToken={meRes.data?.calendar_token ?? ""} />
    </div>
  );
}

export const dynamic = "force-dynamic";
