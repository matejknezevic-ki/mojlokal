"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Clock3 } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Card } from "@/components/ui";

type DayShift = {
  id: string;
  start: string;
  end: string;
  waiterId: string;
  waiterName: string;
  mine: boolean;
  past: boolean;
  swap: { id: string; status: string; byMe: boolean; toMe: boolean } | null;
};

export function TeamSchedule({
  days,
}: {
  days: {
    date: string;
    weekday: number;
    isToday: boolean;
    shifts: DayShift[];
  }[];
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    await fetch("/api/waiter/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
    setBusy(false);
  }

  function onTap(s: DayShift) {
    if (busy || s.past) return;
    if (s.mine) {
      if (s.swap?.byMe) {
        void act({ action: "cancel", swapId: s.swap.id });
      } else if (!s.swap && confirm(t("swap.confirmOffer"))) {
        void act({ action: "offer", shiftId: s.id });
      }
      return;
    }
    // Colleague's shift
    if (s.swap?.status === "open") {
      if (confirm(t("swap.confirmTake"))) void act({ action: "take", swapId: s.swap.id });
    } else if (!s.swap && confirm(t("swap.confirmTake"))) {
      void act({ action: "request", shiftId: s.id });
    }
  }

  function badge(s: DayShift) {
    if (!s.swap) return null;
    let label = "";
    if (s.swap.status === "open") label = s.swap.byMe ? t("swap.offered") : t("swap.openOffers");
    else if (s.swap.toMe) label = t("swap.requested");
    else label = t("swap.pendingApproval");
    return (
      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-cream-dark px-2 py-0.5 text-[10px] font-bold text-espresso-light">
        <Clock3 className="h-2.5 w-2.5" /> {label}
      </span>
    );
  }

  return (
    <div className="space-y-3">
      {days.map((day) => (
        <Card
          key={day.date}
          className={`overflow-hidden ${day.isToday ? "ring-2 ring-terracotta/40" : ""}`}
        >
          <div
            className={`flex items-baseline justify-between px-4 py-2 ${
              day.isToday ? "bg-terracotta-light" : "bg-cream-dark/60"
            }`}
          >
            <span className="font-display font-semibold">
              {day.isToday
                ? t("common.today")
                : t(`day.${day.weekday}` as Parameters<typeof t>[0])}
            </span>
            <span className="text-xs text-espresso/50 tabular-nums">
              {day.date.slice(8, 10)}.{day.date.slice(5, 7)}.
            </span>
          </div>

          {day.shifts.length === 0 ? (
            <p className="px-4 py-3 text-sm text-espresso/30">—</p>
          ) : (
            <div className="divide-y divide-espresso/5">
              {day.shifts.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={busy || s.past}
                  onClick={() => onTap(s)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors active:bg-cream-dark/60 disabled:opacity-60 ${
                    s.mine ? "bg-sage-light/50" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold">
                      {s.mine ? (
                        <>
                          {s.waiterName}{" "}
                          <span className="rounded-full bg-sage px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                            {t("wraspored.you")}
                          </span>
                        </>
                      ) : (
                        s.waiterName
                      )}
                    </p>
                    {badge(s)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold tabular-nums">
                      {s.start}–{s.end}
                    </span>
                    {!s.past && !s.swap && (
                      <ArrowLeftRight className="h-3.5 w-3.5 text-espresso/25" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
