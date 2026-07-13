"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Ban, Clock3, Gift, RotateCcw, Sparkles } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { setVenueSubscription } from "./actions";

type Row = {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  createdAt: string;
  status: string;
  trialEndsAt: string;
  state: string;
  daysLeft: number | null;
  earlyBird: boolean;
};

export function VenueAdminList({ venues }: { venues: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(id: string, action: "activate" | "extend_trial" | "block" | "free") {
    startTransition(async () => {
      await setVenueSubscription(id, action);
      router.refresh();
    });
  }

  const stateBadge = (r: Row) => {
    if (r.status === "free")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sage-light px-2.5 py-1 text-xs font-bold text-sage-dark">
          <Gift className="h-3 w-3" /> Gratis
        </span>
      );
    if (r.state === "active")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2.5 py-1 text-xs font-bold text-success">
          <BadgeCheck className="h-3 w-3" /> Aktiv
        </span>
      );
    if (r.state === "trial")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-light px-2.5 py-1 text-xs font-bold text-terracotta-dark">
          <Clock3 className="h-3 w-3" /> Trial · {r.daysLeft} Tag(e)
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-bold text-danger">
        <Ban className="h-3 w-3" /> Abgelaufen/gesperrt
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {venues.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold">
                {r.name}{" "}
                <span className="text-sm font-normal text-espresso/40">/{r.slug}</span>
              </p>
              <p className="text-sm text-espresso-light">{r.ownerEmail}</p>
              <p className="text-xs text-espresso/40">
                registriert {new Date(r.createdAt).toLocaleDateString("de-AT")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {r.earlyBird && (
                <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-light px-2.5 py-1 text-xs font-bold text-terracotta-dark">
                  <Sparkles className="h-3 w-3" /> Frühbucher
                </span>
              )}
              {stateBadge(r)}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.status !== "active" && (
              <Button disabled={pending} onClick={() => act(r.id, "activate")}>
                <BadgeCheck className="h-4 w-4" /> Freischalten
              </Button>
            )}
            {r.status !== "free" && (
              <Button variant="ghost" disabled={pending} onClick={() => act(r.id, "free")}>
                <Gift className="h-4 w-4" /> Gratis-Zugang
              </Button>
            )}
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => act(r.id, "extend_trial")}
            >
              <RotateCcw className="h-4 w-4" /> Trial neu starten
            </Button>
            {r.status !== "blocked" && (
              <Button
                variant="danger"
                disabled={pending}
                onClick={() => act(r.id, "block")}
              >
                <Ban className="h-4 w-4" /> Sperren
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
