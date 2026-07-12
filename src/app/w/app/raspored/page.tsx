import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";
import { getT } from "@/lib/i18n";
import { EmptyState, PageTitle } from "@/components/ui";
import { addDays, formatTime, isoWeekday, mondayOf } from "@/lib/utils";
import type { Shift, SwapRequest } from "@/lib/types";
import { TeamSchedule } from "./TeamSchedule";

export default async function WaiterSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ tjedan?: string }>;
}) {
  const session = await getWaiterSession();
  if (!session) redirect("/w");
  const t = await getT();

  const params = await searchParams;
  const weekStart =
    params.tjedan && /^\d{4}-\d{2}-\d{2}$/.test(params.tjedan)
      ? mondayOf(new Date(params.tjedan + "T12:00:00"))
      : mondayOf(new Date());
  const weekEnd = addDays(weekStart, 6);

  const admin = createAdminClient();
  const [shiftsRes, waitersRes, swapsRes] = await Promise.all([
    admin
      .from("shifts")
      .select("*, schedules!inner(status)")
      .eq("venue_id", session.venueId)
      .eq("schedules.status", "published")
      .gte("shift_date", weekStart)
      .lte("shift_date", weekEnd)
      .order("shift_date")
      .order("start_time"),
    admin
      .from("waiters")
      .select("id, name")
      .eq("venue_id", session.venueId),
    admin
      .from("swap_requests")
      .select("id, shift_id, from_waiter_id, to_waiter_id, status")
      .eq("venue_id", session.venueId)
      .in("status", ["open", "accepted"]),
  ]);

  const shifts = (shiftsRes.data ?? []) as Shift[];
  const waiterName = (id: string) =>
    (waitersRes.data ?? []).find((w) => w.id === id)?.name ?? "?";
  const swapByShift = new Map(
    ((swapsRes.data ?? []) as SwapRequest[]).map((s) => [s.shift_id, s])
  );
  const today = new Date().toISOString().slice(0, 10);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map(
    (date) => ({
      date,
      weekday: isoWeekday(date),
      isToday: date === today,
      shifts: shifts
        .filter((s) => s.shift_date === date)
        .map((s) => {
          const swap = swapByShift.get(s.id);
          return {
            id: s.id,
            start: formatTime(s.start_time),
            end: formatTime(s.end_time),
            waiterId: s.waiter_id,
            waiterName: waiterName(s.waiter_id),
            mine: s.waiter_id === session.waiterId,
            past: s.shift_date < today,
            swap: swap
              ? {
                  id: swap.id,
                  status: swap.status,
                  byMe: swap.from_waiter_id === session.waiterId,
                  toMe: swap.to_waiter_id === session.waiterId,
                }
              : null,
          };
        }),
    })
  );

  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <PageTitle>{t("wraspored.title")}</PageTitle>
        <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-soft">
          <Link
            href={`/w/app/raspored?tjedan=${prevWeek}`}
            className="rounded-lg p-2 hover:bg-cream-dark"
            aria-label={t("week.prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="px-1 text-xs font-semibold tabular-nums">
            {weekStart.slice(8, 10)}.{weekStart.slice(5, 7)}.–{weekEnd.slice(8, 10)}.{weekEnd.slice(5, 7)}.
          </span>
          <Link
            href={`/w/app/raspored?tjedan=${nextWeek}`}
            className="rounded-lg p-2 hover:bg-cream-dark"
            aria-label={t("week.next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {shifts.length === 0 ? (
        <EmptyState>{t("wraspored.empty")}</EmptyState>
      ) : (
        <>
          <p className="text-xs text-espresso/50">{t("wraspored.hint")}</p>
          <TeamSchedule days={days} />
        </>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
