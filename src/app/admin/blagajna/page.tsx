import { requireOwnerVenue } from "@/lib/owner";
import { getLocale, getT } from "@/lib/i18n";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import { formatMoney } from "@/lib/utils";
import type { CashCount, Waiter } from "@/lib/types";

type Params = { konobar?: string; mj?: string; od?: string; do?: string };

// Resolve the active period into [from, to) ISO bounds (to is exclusive).
function periodBounds(p: Params): { from?: string; to?: string } {
  const isDate = (s?: string) => s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (isDate(p.od) || isDate(p.do)) {
    const from = isDate(p.od) ? `${p.od}T00:00:00` : undefined;
    // "to" is inclusive of the chosen day → push to next midnight
    let to: string | undefined;
    if (isDate(p.do)) {
      const d = new Date(`${p.do}T00:00:00`);
      d.setDate(d.getDate() + 1);
      to = d.toISOString().slice(0, 10) + "T00:00:00";
    }
    return { from, to };
  }
  const now = new Date();
  if (p.mj === "ovaj") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  if (p.mj === "prosli") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  return {};
}

export default async function CashPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { supabase, venue } = await requireOwnerVenue();
  const t = await getT(venue.default_locale);
  const locale = await getLocale(venue.default_locale);
  const dateLocale = locale === "de" ? "de-AT" : "hr-HR";
  const params = await searchParams;
  const { from, to } = periodBounds(params);
  const customActive = Boolean(from || to) && !params.mj;

  const [waitersRes, cashRes] = await Promise.all([
    supabase.from("waiters").select("*").eq("venue_id", venue.id).order("name"),
    (() => {
      let q = supabase
        .from("cash_counts")
        .select("*")
        .eq("venue_id", venue.id)
        .order("counted_at", { ascending: false });
      if (params.konobar) q = q.eq("waiter_id", params.konobar);
      if (from) q = q.gte("counted_at", from);
      if (to) q = q.lt("counted_at", to);
      if (!from && !to) q = q.limit(200);
      return q;
    })(),
  ]);

  const waiters = (waitersRes.data ?? []) as Waiter[];
  const counts = (cashRes.data ?? []) as CashCount[];
  const waiterName = (id: string) => waiters.find((w) => w.id === id)?.name ?? "?";
  const total = counts.reduce((sum, c) => sum + Number(c.amount), 0);

  // Merge current params with overrides. Choosing a preset clears a custom
  // range; the waiter chips keep whatever period is active.
  const href = (o: Partial<Params>) => {
    const merged: Params = { ...params, ...o };
    if (o.mj) {
      merged.od = undefined;
      merged.do = undefined;
    }
    const sp = new URLSearchParams();
    if (merged.konobar) sp.set("konobar", merged.konobar);
    if (merged.mj) sp.set("mj", merged.mj);
    if (merged.od) sp.set("od", merged.od);
    if (merged.do) sp.set("do", merged.do);
    const q = sp.toString();
    return `/admin/blagajna${q ? `?${q}` : ""}`;
  };

  const periodChip = (label: string, active: boolean, url: string) => (
    <a
      href={url}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
        active ? "bg-terracotta text-white" : "bg-white text-espresso-light shadow-soft"
      }`}
    >
      {label}
    </a>
  );

  const noPeriod = !params.mj && !customActive;

  return (
    <div className="space-y-5">
      <div>
        <PageTitle>{t("cash.title")}</PageTitle>
        <p className="mt-1 text-sm text-espresso-light">{t("cash.subtitle")}</p>
      </div>

      {/* Waiter filter */}
      <div className="flex flex-wrap gap-1.5">
        <a
          href={href({ konobar: undefined })}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
            !params.konobar ? "bg-espresso text-cream" : "bg-white text-espresso-light shadow-soft"
          }`}
        >
          {t("cash.filterAll")}
        </a>
        {waiters.map((w) => (
          <a
            key={w.id}
            href={href({ konobar: w.id })}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
              params.konobar === w.id
                ? "bg-espresso text-cream"
                : "bg-white text-espresso-light shadow-soft"
            }`}
          >
            {w.name}
          </a>
        ))}
      </div>

      {/* Period filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        {periodChip(t("cash.pAll"), noPeriod, href({ mj: undefined, od: undefined, do: undefined }))}
        {periodChip(t("cash.pThisMonth"), params.mj === "ovaj", href({ mj: "ovaj" }))}
        {periodChip(t("cash.pLastMonth"), params.mj === "prosli", href({ mj: "prosli" }))}
      </div>

      {/* Custom range */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        {params.konobar && <input type="hidden" name="konobar" value={params.konobar} />}
        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso-light">
            {t("cash.from")}
          </label>
          <input
            type="date"
            name="od"
            defaultValue={params.od ?? ""}
            className="rounded-xl border border-espresso/15 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso-light">
            {t("cash.to")}
          </label>
          <input
            type="date"
            name="do"
            defaultValue={params.do ?? ""}
            className="rounded-xl border border-espresso/15 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-espresso px-4 py-2 text-sm font-semibold text-cream"
        >
          {t("cash.apply")}
        </button>
      </form>

      {/* Total */}
      <Card className="flex items-center justify-between gap-4 bg-espresso p-5 text-cream">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-cream/60">
            {t("cash.total")}
          </p>
          <p className="text-sm text-cream/70">
            {counts.length} {t("cash.entries")}
          </p>
        </div>
        <p className="font-display text-2xl font-bold tabular-nums">
          {formatMoney(total, venue.currency)}
        </p>
      </Card>

      {counts.length === 0 ? (
        <EmptyState>
          {noPeriod ? t("cash.empty") : t("cash.emptyPeriod")}
        </EmptyState>
      ) : (
        <Card className="divide-y divide-espresso/5">
          {counts.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-semibold">{waiterName(c.waiter_id)}</p>
                <p className="text-sm text-espresso/50">
                  {new Date(c.counted_at).toLocaleString(dateLocale, {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {c.note && (
                  <p className="mt-1 text-sm italic text-espresso-light">„{c.note}"</p>
                )}
              </div>
              <p className="font-display text-xl font-bold tabular-nums">
                {formatMoney(Number(c.amount), venue.currency)}
              </p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
