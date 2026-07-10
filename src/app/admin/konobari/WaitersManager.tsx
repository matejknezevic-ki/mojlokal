"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button, Card, EmptyState, Input, Label } from "@/components/ui";
import { addWaiter, deleteWaiter, resetWaiterPin, updateWaiter } from "../actions";
import type { Waiter } from "@/lib/types";

export function WaitersManager({
  venueId,
  waiters,
}: {
  venueId: string;
  waiters: Waiter[];
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState(5);
  const [revealedPin, setRevealedPin] = useState<{ name: string; pin: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    startTransition(async () => {
      setError(null);
      const result = await addWaiter(venueId, newName, newTarget);
      if ("error" in result) {
        setError(t("common.error"));
        return;
      }
      setRevealedPin({ name: newName.trim(), pin: result.pin });
      setNewName("");
      setNewTarget(5);
      router.refresh();
    });
  }

  function resetPin(w: Waiter) {
    startTransition(async () => {
      const result = await resetWaiterPin(w.id);
      if ("pin" in result) setRevealedPin({ name: w.name, pin: result.pin });
    });
  }

  function toggleDay(w: Waiter, day: number) {
    const availability = { ...w.availability };
    if (availability[String(day)] === false) delete availability[String(day)];
    else availability[String(day)] = false;
    startTransition(async () => {
      await updateWaiter(w.id, { availability });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {revealedPin && (
        <Card className="border-l-4 border-l-terracotta p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-semibold">
                <KeyRound className="h-4 w-4 text-terracotta" />
                {t("waiters.newPinIs")} {revealedPin.name}:
              </p>
              <p className="mt-1 text-xs text-espresso-light">{t("waiters.pinNote")}</p>
            </div>
            <span className="font-display text-3xl font-bold tracking-[0.25em] text-terracotta">
              {revealedPin.pin}
            </span>
          </div>
        </Card>
      )}

      {waiters.length === 0 ? (
        <EmptyState>{t("waiters.empty")}</EmptyState>
      ) : (
        <div className="space-y-3">
          {waiters.map((w) => (
            <Card key={w.id} className={`p-5 ${w.active ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">
                    {w.name}
                    {!w.active && (
                      <span className="ml-2 rounded-full bg-espresso/10 px-2 py-0.5 text-xs font-bold uppercase">
                        {t("waiters.inactive")}
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-espresso-light">
                    <Input
                      type="number"
                      min={0}
                      max={14}
                      defaultValue={w.target_shifts_per_week}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== w.target_shifts_per_week) {
                          startTransition(async () => {
                            await updateWaiter(w.id, { targetShifts: v });
                            router.refresh();
                          });
                        }
                      }}
                      className="w-16 py-1.5 text-center"
                    />
                    <span>{t("waiters.targetShifts")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" onClick={() => resetPin(w)} disabled={pending}>
                    <KeyRound className="h-4 w-4" /> {t("waiters.resetPin")}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await updateWaiter(w.id, { active: !w.active });
                        router.refresh();
                      })
                    }
                  >
                    {w.active ? t("waiters.deactivate") : t("waiters.activate")}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(t("common.confirmDelete"))) {
                        startTransition(async () => {
                          await deleteWaiter(w.id);
                          router.refresh();
                        });
                      }
                    }}
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold text-espresso/50">
                  {t("waiters.availability")} — {t("waiters.availabilityHint")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                    const blocked = w.availability?.[String(d)] === false;
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={pending}
                        onClick={() => toggleDay(w, d)}
                        className={`min-w-[2.75rem] rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
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
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">
          {t("waiters.addTitle")}
        </h2>
        <form onSubmit={add} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1">
            <Label htmlFor="newWaiterName">{t("waiters.name")}</Label>
            <Input
              id="newWaiterName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="newWaiterTarget">{t("waiters.targetShifts")}</Label>
            <Input
              id="newWaiterTarget"
              type="number"
              min={0}
              max={14}
              value={newTarget}
              onChange={(e) => setNewTarget(Number(e.target.value) || 0)}
              className="w-24 text-center"
            />
          </div>
          <Button type="submit" disabled={pending || !newName.trim()}>
            <Plus className="h-4 w-4" /> {t("common.add")}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      </Card>
    </div>
  );
}
