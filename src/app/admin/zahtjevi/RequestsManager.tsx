"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, CalendarOff, Check, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button, Card } from "@/components/ui";
import { resolveSwap, resolveTimeOff } from "../actions";

export function RequestsManager({
  timeOff,
  swaps,
}: {
  timeOff: { id: string; waiter: string; date: string; note: string | null }[];
  swaps: { id: string; from: string; to: string; date: string; time: string }[];
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const fmtDate = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}.`;

  return (
    <div className="space-y-5">
      {timeOff.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-espresso/40">
            <CalendarOff className="h-4 w-4" /> {t("req.timeoff")}
          </h2>
          <div className="space-y-2">
            {timeOff.map((r) => (
              <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">
                    {r.waiter} · <span className="tabular-nums">{fmtDate(r.date)}</span>
                  </p>
                  {r.note && <p className="text-sm text-espresso/50">„{r.note}“</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await resolveTimeOff(r.id, true);
                        router.refresh();
                      })
                    }
                  >
                    <Check className="h-4 w-4" /> {t("req.approve")}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await resolveTimeOff(r.id, false);
                        router.refresh();
                      })
                    }
                  >
                    <X className="h-4 w-4" /> {t("req.deny")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {swaps.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-espresso/40">
            <ArrowLeftRight className="h-4 w-4" /> {t("req.swaps")}
          </h2>
          <div className="space-y-2">
            {swaps.map((s) => (
              <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">
                    {s.to} {t("req.swapWants")} {s.from}
                  </p>
                  <p className="text-sm text-espresso/50 tabular-nums">
                    {fmtDate(s.date)} · {s.time}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await resolveSwap(s.id, true);
                        router.refresh();
                      })
                    }
                  >
                    <Check className="h-4 w-4" /> {t("req.approve")}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await resolveSwap(s.id, false);
                        router.refresh();
                      })
                    }
                  >
                    <X className="h-4 w-4" /> {t("req.deny")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
