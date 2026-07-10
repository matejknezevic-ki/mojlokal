import { requireOwnerVenue } from "@/lib/owner";
import { getT } from "@/lib/i18n";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import { formatMoney } from "@/lib/utils";
import type { CashCount, Waiter } from "@/lib/types";

export default async function CashPage({
  searchParams,
}: {
  searchParams: Promise<{ konobar?: string }>;
}) {
  const { supabase, venue } = await requireOwnerVenue();
  const t = await getT(venue.default_locale);
  const params = await searchParams;

  const [waitersRes, cashRes] = await Promise.all([
    supabase.from("waiters").select("*").eq("venue_id", venue.id).order("name"),
    (() => {
      let q = supabase
        .from("cash_counts")
        .select("*")
        .eq("venue_id", venue.id)
        .order("counted_at", { ascending: false })
        .limit(100);
      if (params.konobar) q = q.eq("waiter_id", params.konobar);
      return q;
    })(),
  ]);

  const waiters = (waitersRes.data ?? []) as Waiter[];
  const counts = (cashRes.data ?? []) as CashCount[];
  const waiterName = (id: string) => waiters.find((w) => w.id === id)?.name ?? "?";

  return (
    <div className="space-y-5">
      <div>
        <PageTitle>{t("cash.title")}</PageTitle>
        <p className="mt-1 text-sm text-espresso-light">{t("cash.subtitle")}</p>
      </div>

      {/* Waiter filter */}
      <div className="flex flex-wrap gap-1.5">
        <a
          href="/admin/blagajna"
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
            !params.konobar ? "bg-espresso text-cream" : "bg-white text-espresso-light shadow-soft"
          }`}
        >
          {t("cash.filterAll")}
        </a>
        {waiters.map((w) => (
          <a
            key={w.id}
            href={`/admin/blagajna?konobar=${w.id}`}
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

      {counts.length === 0 ? (
        <EmptyState>{t("cash.empty")}</EmptyState>
      ) : (
        <Card className="divide-y divide-espresso/5">
          {counts.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-semibold">{waiterName(c.waiter_id)}</p>
                <p className="text-sm text-espresso/50">
                  {new Date(c.counted_at).toLocaleString("hr-HR", {
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
