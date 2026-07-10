import { requireOwnerVenue } from "@/lib/owner";
import { getT } from "@/lib/i18n";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import { addDays, formatHours, mondayOf, toDateString } from "@/lib/utils";
import type { ShiftSession, Waiter } from "@/lib/types";

type Range = "thisWeek" | "lastWeek" | "thisMonth";

function rangeBounds(range: Range): { from: string; to: string } {
  const now = new Date();
  if (range === "thisWeek") {
    const from = mondayOf(now);
    return { from, to: addDays(from, 7) };
  }
  if (range === "lastWeek") {
    const thisMonday = mondayOf(now);
    return { from: addDays(thisMonday, -7), to: thisMonday };
  }
  const from = `${toDateString(now).slice(0, 7)}-01`;
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from, to: toDateString(next) };
}

export default async function HoursPage({
  searchParams,
}: {
  searchParams: Promise<{ razdoblje?: string }>;
}) {
  const { supabase, venue } = await requireOwnerVenue();
  const t = await getT(venue.default_locale);
  const params = await searchParams;
  const range: Range =
    params.razdoblje === "lastWeek" || params.razdoblje === "thisMonth"
      ? params.razdoblje
      : "thisWeek";
  const { from, to } = rangeBounds(range);

  const [waitersRes, sessionsRes] = await Promise.all([
    supabase.from("waiters").select("*").eq("venue_id", venue.id).order("name"),
    supabase
      .from("shift_sessions")
      .select("*")
      .eq("venue_id", venue.id)
      .gte("started_at", `${from}T00:00:00`)
      .lt("started_at", `${to}T00:00:00`)
      .order("started_at", { ascending: false }),
  ]);

  const waiters = (waitersRes.data ?? []) as Waiter[];
  const sessions = (sessionsRes.data ?? []) as ShiftSession[];

  const perWaiter = new Map<string, { ms: number; count: number; open: boolean }>();
  for (const s of sessions) {
    const entry = perWaiter.get(s.waiter_id) ?? { ms: 0, count: 0, open: false };
    if (s.ended_at) {
      entry.ms += new Date(s.ended_at).getTime() - new Date(s.started_at).getTime();
      entry.count += 1;
    } else {
      entry.open = true;
    }
    perWaiter.set(s.waiter_id, entry);
  }
  const totalMs = [...perWaiter.values()].reduce((sum, e) => sum + e.ms, 0);

  const ranges: { key: Range; label: string }[] = [
    { key: "thisWeek", label: t("hoursAdmin.thisWeek") },
    { key: "lastWeek", label: t("hoursAdmin.lastWeek") },
    { key: "thisMonth", label: t("hoursAdmin.thisMonth") },
  ];

  return (
    <div className="space-y-5">
      <div>
        <PageTitle>{t("hoursAdmin.title")}</PageTitle>
        <p className="mt-1 text-sm text-espresso-light">{t("hoursAdmin.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ranges.map((r) => (
          <a
            key={r.key}
            href={`/admin/sati?razdoblje=${r.key}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
              range === r.key
                ? "bg-espresso text-cream"
                : "bg-white text-espresso-light shadow-soft"
            }`}
          >
            {r.label}
          </a>
        ))}
      </div>

      {perWaiter.size === 0 ? (
        <EmptyState>{t("hoursAdmin.empty")}</EmptyState>
      ) : (
        <Card className="divide-y divide-espresso/5">
          {waiters
            .filter((w) => perWaiter.has(w.id))
            .map((w) => {
              const e = perWaiter.get(w.id)!;
              return (
                <div key={w.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-semibold">
                      {w.name}
                      {e.open && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-xs font-bold text-success">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                          {t("hoursAdmin.stillWorking")}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-espresso/50">
                      {e.count} {t("hoursAdmin.shiftsCount")}
                    </p>
                  </div>
                  <p className="font-display text-xl font-bold tabular-nums">
                    {formatHours(e.ms)} <span className="text-sm font-normal text-espresso/50">h</span>
                  </p>
                </div>
              );
            })}
          <div className="flex items-center justify-between bg-cream-dark/50 px-5 py-4">
            <p className="font-bold">{t("hoursAdmin.total")}</p>
            <p className="font-display text-xl font-bold tabular-nums">
              {formatHours(totalMs)} <span className="text-sm font-normal text-espresso/50">h</span>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
