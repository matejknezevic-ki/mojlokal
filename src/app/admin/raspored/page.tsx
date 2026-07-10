import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireOwnerVenue } from "@/lib/owner";
import { getT } from "@/lib/i18n";
import { PageTitle } from "@/components/ui";
import { addDays, mondayOf } from "@/lib/utils";
import type { Schedule, Shift, ShiftTemplate, Waiter } from "@/lib/types";
import { ScheduleGrid } from "./ScheduleGrid";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ tjedan?: string }>;
}) {
  const { supabase, venue } = await requireOwnerVenue();
  const t = await getT(venue.default_locale);

  const params = await searchParams;
  const weekStart =
    params.tjedan && /^\d{4}-\d{2}-\d{2}$/.test(params.tjedan)
      ? mondayOf(new Date(params.tjedan + "T12:00:00"))
      : mondayOf(new Date());

  const [{ data: schedule }, { data: waiters }, { data: templates }] =
    await Promise.all([
      supabase
        .from("schedules")
        .select("*")
        .eq("venue_id", venue.id)
        .eq("week_start", weekStart)
        .maybeSingle(),
      supabase
        .from("waiters")
        .select("*")
        .eq("venue_id", venue.id)
        .eq("active", true)
        .order("name"),
      supabase
        .from("shift_templates")
        .select("*")
        .eq("venue_id", venue.id)
        .eq("active", true)
        .order("position"),
    ]);

  let shifts: Shift[] = [];
  if (schedule) {
    const { data } = await supabase
      .from("shifts")
      .select("*")
      .eq("schedule_id", schedule.id);
    shifts = (data ?? []) as Shift[];
  }

  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const weekEnd = addDays(weekStart, 6);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>{t("schedule.title")}</PageTitle>
        <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-soft">
          <Link
            href={`/admin/raspored?tjedan=${prevWeek}`}
            className="rounded-lg p-2 hover:bg-cream-dark"
            aria-label={t("week.prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="px-2 text-sm font-semibold tabular-nums">
            {weekStart.slice(8, 10)}.{weekStart.slice(5, 7)}. – {weekEnd.slice(8, 10)}.{weekEnd.slice(5, 7)}.{weekEnd.slice(0, 4)}.
          </span>
          <Link
            href={`/admin/raspored?tjedan=${nextWeek}`}
            className="rounded-lg p-2 hover:bg-cream-dark"
            aria-label={t("week.next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <ScheduleGrid
        weekStart={weekStart}
        openingDays={venue.opening_days}
        schedule={schedule as Schedule | null}
        shifts={shifts}
        waiters={(waiters ?? []) as Waiter[]}
        templates={(templates ?? []) as ShiftTemplate[]}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
