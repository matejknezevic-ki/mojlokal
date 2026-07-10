import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";
import { getT } from "@/lib/i18n";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import { formatHours, formatMoney } from "@/lib/utils";
import type { CashCount, ShiftSession } from "@/lib/types";

export default async function WaiterHistoryPage() {
  const session = await getWaiterSession();
  if (!session) redirect("/w");
  const t = await getT();

  const admin = createAdminClient();
  const [sessionsRes, cashRes] = await Promise.all([
    admin
      .from("shift_sessions")
      .select("*")
      .eq("waiter_id", session.waiterId)
      .eq("venue_id", session.venueId)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(30),
    admin
      .from("cash_counts")
      .select("*")
      .eq("waiter_id", session.waiterId)
      .eq("venue_id", session.venueId)
      .order("counted_at", { ascending: false })
      .limit(30),
  ]);

  const sessions = (sessionsRes.data ?? []) as ShiftSession[];
  const cashBySession = new Map(
    ((cashRes.data ?? []) as CashCount[]).map((c) => [c.shift_session_id, c])
  );

  return (
    <div className="space-y-4">
      <PageTitle>{t("waiter.myShifts")}</PageTitle>
      {sessions.length === 0 ? (
        <EmptyState>{t("waiter.noHistory")}</EmptyState>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const start = new Date(s.started_at);
            const end = new Date(s.ended_at!);
            const cash = cashBySession.get(s.id);
            return (
              <Card key={s.id} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="font-semibold">
                    {start.toLocaleDateString("hr-HR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-espresso/50 tabular-nums">
                    {start.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {end.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold tabular-nums">
                    {formatHours(end.getTime() - start.getTime())} h
                  </p>
                  {cash && (
                    <p className="text-sm text-espresso/50 tabular-nums">
                      {formatMoney(Number(cash.amount))}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
