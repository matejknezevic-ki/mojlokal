"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Clock3 } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Card } from "@/components/ui";
import { toDateString } from "@/lib/utils";

function dayLabel(date: string, t: ReturnType<typeof useT>) {
  if (date === toDateString(new Date())) return t("common.today");
  const d = new Date(date + "T12:00:00");
  const weekday = d.getDay() === 0 ? 7 : d.getDay();
  return t(`day.${weekday}` as Parameters<typeof t>[0]);
}

async function swapAction(body: Record<string, unknown>) {
  const res = await fetch("/api/waiter/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

export function UpcomingShifts({
  shifts,
}: {
  shifts: {
    id: string;
    date: string;
    start: string;
    end: string;
    swapStatus: string | null;
    swapId: string | null;
  }[];
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-2">
      {shifts.map((s) => {
        const isToday = s.date === toDateString(new Date());
        return (
          <Card
            key={s.id}
            className={`px-4 py-3.5 ${isToday ? "border-l-4 border-l-terracotta" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{dayLabel(s.date, t)}</p>
                <p className="text-sm text-espresso/50 tabular-nums">
                  {s.date.slice(8, 10)}.{s.date.slice(5, 7)}.
                </p>
              </div>
              <p className="font-display text-lg font-semibold tabular-nums">
                {s.start} – {s.end}
              </p>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2">
              {s.swapStatus === null ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await swapAction({ action: "offer", shiftId: s.id });
                    router.refresh();
                    setBusy(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-terracotta hover:bg-terracotta-light"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" /> {t("swap.offer")}
                </button>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-dark px-2.5 py-1 text-xs font-bold text-espresso-light">
                    <Clock3 className="h-3 w-3" />
                    {s.swapStatus === "open"
                      ? t("swap.offered")
                      : t("swap.pendingApproval")}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await swapAction({ action: "cancel", swapId: s.swapId });
                      router.refresh();
                      setBusy(false);
                    }}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
                  >
                    {t("swap.cancel")}
                  </button>
                </>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function OpenSwapOffers({
  offers,
}: {
  offers: { id: string; from: string; date: string; start: string; end: string }[];
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-2">
      {offers.map((o) => (
        <Card key={o.id} className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="font-semibold">
              {dayLabel(o.date, t)}{" "}
              <span className="font-normal text-espresso/50 tabular-nums">
                {o.date.slice(8, 10)}.{o.date.slice(5, 7)}. · {o.start}–{o.end}
              </span>
            </p>
            <p className="text-sm text-espresso-light">{o.from}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await swapAction({ action: "take", swapId: o.id });
              router.refresh();
              setBusy(false);
            }}
            className="rounded-xl bg-sage px-3.5 py-2.5 text-sm font-bold text-white active:scale-95"
          >
            {t("swap.take")}
          </button>
        </Card>
      ))}
    </div>
  );
}
