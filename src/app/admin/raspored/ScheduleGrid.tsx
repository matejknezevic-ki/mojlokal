"use client";

import { useState, useTransition } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
      router.refresh();
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={generating || !canGenerate}>
          <Sparkles className="h-4 w-4" />
          {generating
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
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-espresso/10 text-left">
                  <th className="px-4 py-3 font-semibold text-espresso/50"></th>
                  {days.map((d) => (
                    <th key={d} className="px-3 py-3 text-center">
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
                        <td key={d} className="px-1.5 py-2 text-center">
                          {shift ? (
                            <select
                              value={shift.waiter_id}
                              disabled={pending}
                              onChange={(e) => reassign(shift.id, e.target.value)}
                              className="w-full max-w-[9rem] cursor-pointer rounded-lg border border-espresso/10 bg-cream-dark/60 px-2 py-2 text-center text-sm font-semibold outline-none focus:border-terracotta"
                            >
                              {waiters.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                </option>
                              ))}
                            </select>
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
