import { requireOwnerVenue } from "@/lib/owner";
import { getT } from "@/lib/i18n";
import { EmptyState, PageTitle } from "@/components/ui";
import { formatTime } from "@/lib/utils";
import type { SwapRequest, TimeOffRequest, Waiter } from "@/lib/types";
import { RequestsManager } from "./RequestsManager";

export default async function RequestsPage() {
  const { supabase, venue } = await requireOwnerVenue();
  const t = await getT(venue.default_locale);

  const [waitersRes, timeOffRes, swapsRes] = await Promise.all([
    supabase.from("waiters").select("id, name").eq("venue_id", venue.id),
    supabase
      .from("time_off_requests")
      .select("*")
      .eq("venue_id", venue.id)
      .eq("status", "pending")
      .order("off_date"),
    supabase
      .from("swap_requests")
      .select("*, shifts!inner(shift_date, start_time, end_time)")
      .eq("venue_id", venue.id)
      .eq("status", "accepted"),
  ]);

  const waiters = (waitersRes.data ?? []) as Pick<Waiter, "id" | "name">[];
  const name = (id: string | null) => waiters.find((w) => w.id === id)?.name ?? "?";

  const timeOff = (timeOffRes.data ?? []) as TimeOffRequest[];
  const swaps = (swapsRes.data ?? []) as (SwapRequest & {
    shifts: { shift_date: string; start_time: string; end_time: string };
  })[];

  const hasAny = timeOff.length > 0 || swaps.length > 0;

  return (
    <div className="space-y-5">
      <PageTitle>{t("req.title")}</PageTitle>
      {!hasAny ? (
        <EmptyState>{t("req.none")}</EmptyState>
      ) : (
        <RequestsManager
          timeOff={timeOff.map((r) => ({
            id: r.id,
            waiter: name(r.waiter_id),
            date: r.off_date,
            note: r.note,
          }))}
          swaps={swaps.map((s) => ({
            id: s.id,
            from: name(s.from_waiter_id),
            to: name(s.to_waiter_id),
            date: s.shifts.shift_date,
            time: `${formatTime(s.shifts.start_time)}–${formatTime(s.shifts.end_time)}`,
          }))}
        />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
