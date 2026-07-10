"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Lock, PartyPopper, Wallet } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Card } from "@/components/ui";
import { formatHours } from "@/lib/utils";
import type { ChecklistItem } from "@/lib/types";

export function EndShiftFlow({
  startedAt,
  items,
}: {
  startedAt: string;
  items: ChecklistItem[];
}) {
  const t = useT();
  const router = useRouter();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [cash, setCash] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMs, setDoneMs] = useState<number | null>(null);

  const cashValue = Number(cash.replace(",", "."));
  const cashValid = cash.trim() !== "" && Number.isFinite(cashValue) && cashValue >= 0;
  const allChecked = items.every((i) => checked.has(i.id));
  const canEnd = allChecked && cashValid && !busy;

  function toggle(id: string) {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  }

  async function endShift() {
    if (!canEnd) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/waiter/shift/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashAmount: cashValue,
          note: note.trim() || undefined,
          checkedItemIds: [...checked],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "checklist_incomplete"
            ? t("endShift.serverChecklist")
            : data.error === "no_open_shift"
              ? t("endShift.noOpenShift")
              : t("common.error")
        );
        return;
      }
      setDoneMs(
        new Date(data.endedAt).getTime() - new Date(data.startedAt).getTime()
      );
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  if (doneMs !== null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <PartyPopper className="h-14 w-14 text-terracotta" />
        <h1 className="font-display text-2xl font-semibold">
          {t("endShift.success")}
        </h1>
        <p className="text-espresso-light">
          {t("endShift.workedFor")}{" "}
          <span className="font-display text-xl font-bold text-espresso">
            {formatHours(doneMs)} h
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            router.push("/w/app");
            router.refresh();
          }}
          className="mt-4 rounded-xl bg-espresso px-6 py-3.5 font-semibold text-cream"
        >
          {t("endShift.backHome")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-2">
        <Link
          href="/w/app"
          className="rounded-lg p-1.5 text-espresso-light hover:bg-espresso/5"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl font-semibold">{t("endShift.title")}</h1>
      </div>

      {/* Checklist */}
      {items.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-espresso/40">
              {t("endShift.checklistTitle")}
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                allChecked ? "bg-success-light text-success" : "bg-cream-dark text-espresso/50"
              }`}
            >
              {checked.size}/{items.length} {t("endShift.progress")}
            </span>
          </div>
          <div className="space-y-2">
            {items.map((item) => {
              const isChecked = checked.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`flex min-h-[64px] w-full items-center gap-3 rounded-card px-4 py-3 text-left shadow-soft transition-colors ${
                    isChecked ? "bg-success-light" : "bg-white"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                      isChecked
                        ? "border-success bg-success text-white"
                        : "border-espresso/25"
                    }`}
                  >
                    {isChecked && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <span
                    className={`font-semibold ${
                      isChecked ? "text-success line-through decoration-success/40" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Cash count */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-espresso/40">
          <Wallet className="h-4 w-4" /> {t("endShift.cashTitle")}
        </h2>
        <Card className="p-4">
          <p className="mb-3 text-sm text-espresso-light">{t("endShift.cashHint")}</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={cash}
              onChange={(e) => setCash(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder={t("endShift.cashPlaceholder")}
              className="w-full rounded-xl border border-espresso/15 bg-cream px-4 py-4 text-right font-display text-3xl font-bold tabular-nums outline-none focus:border-terracotta"
            />
            <span className="font-display text-3xl font-bold text-espresso/40">€</span>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("endShift.notePlaceholder")}
            className="mt-3 w-full rounded-xl border border-espresso/10 px-4 py-2.5 text-sm outline-none focus:border-terracotta"
          />
        </Card>
      </section>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {/* End button — locked until checklist + cash are done */}
      <button
        type="button"
        onClick={endShift}
        disabled={!canEnd}
        className={`flex min-h-[76px] w-full items-center justify-center gap-3 rounded-card font-display text-xl font-bold transition-all ${
          canEnd
            ? "bg-terracotta text-white shadow-lifted active:scale-[0.98]"
            : "cursor-not-allowed bg-espresso/10 text-espresso/40"
        }`}
      >
        {!canEnd && <Lock className="h-5 w-5" />}
        {busy
          ? t("common.loading")
          : canEnd
            ? t("endShift.endButton")
            : !allChecked
              ? t("endShift.lockedChecklist")
              : t("endShift.lockedCash")}
      </button>
    </div>
  );
}
