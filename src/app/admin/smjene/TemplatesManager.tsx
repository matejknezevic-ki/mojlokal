"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button, Card, EmptyState, Input, Label } from "@/components/ui";
import { formatTime } from "@/lib/utils";
import { addTemplate, deleteTemplate, updateOpeningDays, updateTemplate } from "../actions";
import type { ShiftTemplate } from "@/lib/types";

export function TemplatesManager({
  venueId,
  openingDays,
  templates,
}: {
  venueId: string;
  openingDays: number[];
  templates: ShiftTemplate[];
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("16:00");

  function toggleDay(d: number) {
    const next = openingDays.includes(d)
      ? openingDays.filter((x) => x !== d)
      : [...openingDays, d].sort();
    startTransition(async () => {
      await updateOpeningDays(venueId, next);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">
          {t("shiftsAdmin.openingDays")}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <button
              key={d}
              type="button"
              disabled={pending}
              onClick={() => toggleDay(d)}
              className={`min-w-[3rem] rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                openingDays.includes(d)
                  ? "bg-espresso text-cream"
                  : "bg-cream-dark text-espresso/50"
              }`}
            >
              {t(`day.short.${d}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>
      </Card>

      {templates.length === 0 ? (
        <EmptyState>{t("shiftsAdmin.empty")}</EmptyState>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="flex flex-wrap items-center gap-3 p-4">
              <Input
                defaultValue={tpl.name}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== tpl.name) {
                    startTransition(async () => {
                      await updateTemplate(tpl.id, { name: e.target.value });
                      router.refresh();
                    });
                  }
                }}
                className="min-w-[10rem] flex-1"
              />
              <Input
                type="time"
                defaultValue={formatTime(tpl.start_time)}
                onBlur={(e) =>
                  startTransition(async () => {
                    await updateTemplate(tpl.id, { start: e.target.value });
                    router.refresh();
                  })
                }
                className="w-28"
              />
              <Input
                type="time"
                defaultValue={formatTime(tpl.end_time)}
                onBlur={(e) =>
                  startTransition(async () => {
                    await updateTemplate(tpl.id, { end: e.target.value });
                    router.refresh();
                  })
                }
                className="w-28"
              />
              <Button
                variant="danger"
                disabled={pending}
                onClick={() => {
                  if (confirm(t("common.confirmDelete"))) {
                    startTransition(async () => {
                      await deleteTemplate(tpl.id);
                      router.refresh();
                    });
                  }
                }}
                aria-label={t("common.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">
          {t("shiftsAdmin.addTitle")}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            startTransition(async () => {
              await addTemplate(venueId, name, start, end);
              setName("");
              router.refresh();
            });
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[10rem] flex-1">
            <Label htmlFor="tplName">{t("shiftsAdmin.name")}</Label>
            <Input id="tplName" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="tplStart">{t("shiftsAdmin.from")}</Label>
            <Input
              id="tplStart"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-28"
            />
          </div>
          <div>
            <Label htmlFor="tplEnd">{t("shiftsAdmin.to")}</Label>
            <Input
              id="tplEnd"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-28"
            />
          </div>
          <Button type="submit" disabled={pending || !name.trim()}>
            <Plus className="h-4 w-4" /> {t("common.add")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
