"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, Check, Clock3, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Card, Input } from "@/components/ui";
import type { TimeOffRequest } from "@/lib/types";

export function AvailabilityManager({
  availability,
  requests,
}: {
  availability: Record<string, boolean>;
  requests: TimeOffRequest[];
}) {
  const t = useT();
  const router = useRouter();
  const [local, setLocal] = useState(availability);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function toggleDay(d: number) {
    const next = { ...local };
    if (next[String(d)] === false) delete next[String(d)];
    else next[String(d)] = false;
    setLocal(next);
    setBusy(true);
    const res = await fetch("/api/waiter/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability: next }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function requestTimeOff(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/waiter/timeoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, note }),
    });
    setBusy(false);
    if (res.ok) {
      setDate("");
      setNote("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "exists" ? t("avail.exists") : t("common.error"));
    }
  }

  const statusStyle = {
    pending: "bg-cream-dark text-espresso-light",
    approved: "bg-success-light text-success",
    denied: "bg-danger/10 text-danger",
  } as const;
  const statusIcon = { pending: Clock3, approved: Check, denied: X } as const;

  return (
    <div className="space-y-4">
      {/* Weekly availability */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold">{t("avail.weekly")}</h2>
        <p className="mb-3 mt-1 text-sm text-espresso-light">{t("avail.weeklyHint")}</p>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => {
            const blocked = local[String(d)] === false;
            return (
              <button
                key={d}
                type="button"
                disabled={busy}
                onClick={() => toggleDay(d)}
                className={`min-w-[2.9rem] rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                  blocked
                    ? "bg-danger/15 text-danger line-through"
                    : "bg-sage-light text-sage-dark"
                }`}
              >
                {t(`day.short.${d}` as Parameters<typeof t>[0])}
              </button>
            );
          })}
        </div>
        {saved && (
          <p className="mt-2 text-xs font-semibold text-success">{t("avail.saved")}</p>
        )}
      </Card>

      {/* Time-off requests */}
      <Card className="p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <CalendarOff className="h-5 w-5 text-terracotta" /> {t("avail.timeoff")}
        </h2>
        <p className="mb-4 mt-1 text-sm text-espresso-light">{t("avail.timeoffHint")}</p>

        <form onSubmit={requestTimeOff} className="space-y-2.5">
          <Input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("avail.notePlaceholder")}
          />
          <button
            type="submit"
            disabled={!date || busy}
            className="w-full rounded-xl bg-terracotta py-3 font-semibold text-white disabled:bg-espresso/15"
          >
            {t("avail.request")}
          </button>
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
        </form>

        {requests.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-espresso/5 pt-4">
            {requests.map((r) => {
              const Icon = statusIcon[r.status];
              return (
                <li key={r.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold tabular-nums">
                      {r.off_date.slice(8, 10)}.{r.off_date.slice(5, 7)}.{r.off_date.slice(0, 4)}.
                    </p>
                    {r.note && (
                      <p className="text-xs text-espresso/50">{r.note}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[r.status]}`}
                  >
                    <Icon className="h-3 w-3" />
                    {t(`avail.${r.status}` as Parameters<typeof t>[0])}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
