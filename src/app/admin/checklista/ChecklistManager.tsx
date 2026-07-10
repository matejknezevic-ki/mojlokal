"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button, Card, EmptyState, Input } from "@/components/ui";
import { addChecklistItem, deleteChecklistItem, updateChecklistItem } from "../actions";
import type { ChecklistItem } from "@/lib/types";

export function ChecklistManager({
  venueId,
  items,
}: {
  venueId: string;
  items: ChecklistItem[];
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState("");

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <EmptyState>{t("checklistAdmin.empty")}</EmptyState>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="flex items-center gap-3 p-3">
              <ListChecks className="ml-1 h-4 w-4 shrink-0 text-sage-dark" />
              <Input
                defaultValue={item.label}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== item.label) {
                    startTransition(async () => {
                      await updateChecklistItem(item.id, e.target.value);
                      router.refresh();
                    });
                  }
                }}
                className="flex-1 border-transparent bg-transparent"
              />
              <Button
                variant="danger"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteChecklistItem(item.id);
                    router.refresh();
                  })
                }
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
          {t("checklistAdmin.addTitle")}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!label.trim()) return;
            startTransition(async () => {
              await addChecklistItem(venueId, label);
              setLabel("");
              router.refresh();
            });
          }}
          className="flex items-end gap-3"
        >
          <div className="flex-1">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("checklistAdmin.label")}
            />
          </div>
          <Button type="submit" disabled={pending || !label.trim()}>
            <Plus className="h-4 w-4" /> {t("common.add")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
