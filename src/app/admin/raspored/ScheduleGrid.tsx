"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Megaphone, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button, Card, EmptyState } from "@/components/ui";
import { addDays, formatTime, isoWeekday } from "@/lib/utils";
import { publishSchedule, updateShiftAssignment } from "../actions";
import type { Schedule, Shift, ShiftTemplate, Waiter } from "@/lib/types";

export function ScheduleGrid({
  weekStart,
  openingDays,
  schedule,
  shifts,
  waiters,
  templates,
}: {
  weekStart: string;
  openingDays: number[];
  schedule: Schedule | null;
  shifts: Shift[];
  waiters: Waiter[];
  templates: ShiftTemplate[];
}) {
  const t = useT();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [refreshing, startRefresh] = useTransition();

  // Overlay stays visible until the refreshed server data is actually rendered.
  const busy = generating || refreshing;
  const progressKeys = [
    "schedule.progress1",
    "schedule.progress2",
    "schedule.progress3",
  ] as const;

  useEffect(() => {
    if (!busy) {
      setProgressStep(0);
      return;
    }
    const id = setInterval(
      () => setProgressStep((s) => Math.min(s + 1, progressKeys.length - 1)),
      4000
    );
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(
    (d) => openingDays.includes(isoWeekday(d))
  );

  const shiftFor = (date: string, templateId: string) =>
    shifts.find((s) => s.shift_date === date && s.template_id === templateId);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "need_data" ? t("schedule.needData") : t("common.error"));
        return;
      }
      // startRefresh keeps `refreshing` true until the new server payload is in.
      startRefresh(() => router.refresh());
    } catch {
      setError(t("common.error"));
    } finally {
      setGenerating(false);
    }
  }

  function reassign(shiftId: string, waiterId: string) {
    startTransition(async () => {
      await updateShiftAssignment(shiftId, waiterId);
      router.refresh();
    });
  }

  function publish() {
    if (!schedule) return;
    startTransition(async () => {
      await publishSchedule(schedule.id);
      router.refresh();
    });
  }

  const canGenerate = waiters.length > 0 && templates.length > 0;

  const waiterSelect = (shift: Shift) => (
    <select
      value={shift.waiter_id}
      disabled={pending}
      onChange={(e) => reassign(shift.id, e.target.value)}
      className="w-full cursor-pointer truncate rounded-lg border border-espresso/10 bg-cream-dark/60 px-3 py-2 text-sm font-semibold outline-none focus:border-terracotta"
    >
      {waiters.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-4">
      {/* Progress overlay while the AI plans + the fresh data loads */}
      {busy && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-espresso/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-card bg-white px-8 py-8 shadow-lifted">
            <span className="relative flex h-14 w-14 items-center justify-center">
              <span className="absolute h-14 w-14 animate-ping rounded-full bg-terracotta/25" />
              <Sparkles className="h-8 w-8 animate-pulse text-terracotta" />
            </span>
            <p className="font-display text-lg font-semibold">
              {t("schedule.generating")}
            </p>
            <p className="text-sm text-espresso-light" aria-live="polite">
              {t(progressKeys[progressStep])}
            </p>
            <div className="flex gap-1.5">
              {progressKeys.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    i <= progressStep ? "bg-terracotta" : "bg-espresso/10"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={busy || !canGenerate}>
          <Sparkles className="h-4 w-4" />
          {busy
            ? t("schedule.generating")
            : schedule
              ? t("schedule.regenerate")
              : t("schedule.generateAI")}
        </Button>

        {schedule && schedule.status === "draft" && (
          <Button variant="secondary" onClick={publish} disabled={pending}>
            <Megaphone className="h-4 w-4" /> {t("schedule.publish")}
          </Button>
        )}

        {schedule && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              schedule.status === "published"
                ? "bg-success-light text-success"
                : "bg-terracotta-light text-terracotta-dark"
            }`}
          >
            {schedule.status === "published" && <CheckCircle2 className="h-3.5 w-3.5" />}
            {schedule.status === "published" ? t("schedule.published") : t("schedule.draft")}
          </span>
        )}
      </div>

      {!canGenerate && (
        <p className="text-sm text-espresso-light">{t("schedule.needData")}</p>
      )}
      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {!schedule ? (
        canGenerate && (
          <EmptyState>
            <p className="font-semibold">{t("schedule.empty")}</p>
            <p className="mt-1">{t("schedule.emptyHint")}</p>
          </EmptyState>
        )
      ) : (
        <>
          {/* Mobile: whole week at a glance, one card per day (scroll down) */}
          <div className="space-y-3 lg:hidden">
            {days.map((d) => (
              <Card key={d} className="p-4">
                <div className="mb-3 flex items-baseline justify-between border-b border-espresso/10 pb-2">
                  <span className="font-display text-base font-bold">
                    {t(`day.${isoWeekday(d)}` as Parameters<typeof t>[0])}
                  </span>
                  <span className="text-xs text-espresso/40 tabular-nums">
                    {d.slice(8, 10)}.{d.slice(5, 7)}.
                  </span>
                </div>
                <div className="space-y-2.5">
                  {templates.map((tpl) => {
                    const shift = shiftFor(d, tpl.id);
                    return (
                      <div key={tpl.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{tpl.name}</div>
                          <div className="text-xs text-espresso/40 tabular-nums">
                            {formatTime(tpl.start_time)}–{formatTime(tpl.end_time)}
                          </div>
                        </div>
                        <div className="w-36 shrink-0">
                          {shift ? (
                            waiterSelect(shift)
                          ) : (
                            <span className="block text-right text-sm text-espresso/25">
                              {t("schedule.nobody")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: full-week matrix */}
          <Card className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-espresso/10 text-left">
                  <th className="px-4 py-3 font-semibold text-espresso/50"></th>
                  {days.map((d) => (
                    <th key={d} className="min-w-[8rem] px-3 py-3 text-center">
                      <div className="font-bold">
                        {t(`day.short.${isoWeekday(d)}` as Parameters<typeof t>[0])}
                      </div>
                      <div className="text-xs font-normal text-espresso/40 tabular-nums">
                        {d.slice(8, 10)}.{d.slice(5, 7)}.
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map((tpl) => (
                  <tr key={tpl.id} className="border-b border-espresso/5 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-semibold">{tpl.name}</div>
                      <div className="text-xs text-espresso/40 tabular-nums">
                        {formatTime(tpl.start_time)}–{formatTime(tpl.end_time)}
                      </div>
                    </td>
                    {days.map((d) => {
                      const shift = shiftFor(d, tpl.id);
                      return (
                        <td key={d} className="min-w-[8rem] px-1.5 py-2 text-center">
                          {shift ? (
                            waiterSelect(shift)
                          ) : (
                            <span className="text-espresso/25">{t("schedule.nobody")}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {schedule.status === "draft" && (
            <p className="text-xs text-espresso/50">{t("schedule.publishHint")}</p>
          )}

          {schedule.ai_notes && (
            <Card className="border-l-4 border-l-sage p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-sage-dark">
                {t("schedule.aiNotes")}
              </p>
              <p className="mt-1 text-sm text-espresso-light">{schedule.ai_notes}</p>
              <p className="mt-2 text-xs text-espresso/40">
                {schedule.generated_by === "ai"
                  ? t("schedule.generatedByAI")
                  : schedule.generated_by === "fallback"
                    ? t("schedule.generatedByFallback")
                    : t("schedule.generatedByManual")}
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
