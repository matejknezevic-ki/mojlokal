"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Delete } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Card } from "@/components/ui";

export function WaiterLogin({
  venueSlug,
  waiters,
}: {
  venueSlug: string;
  waiters: { id: string; name: string }[];
}) {
  const t = useT();
  const router = useRouter();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitPin(fullPin: string) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/waiter/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueSlug, waiterId: selected.id, pin: fullPin }),
      });
      if (res.ok) {
        router.push("/w/app");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error === "locked" ? t("waiter.locked") : t("waiter.wrongPin"));
      setPin("");
    } catch {
      setError(t("common.error"));
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  function press(digit: string) {
    if (busy || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) void submitPin(next);
  }

  if (!selected) {
    return (
      <div>
        <h1 className="mb-5 font-display text-2xl font-semibold">
          {t("waiter.whoAreYou")}
        </h1>
        <div className="grid grid-cols-2 gap-3">
          {waiters.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setSelected(w);
                setPin("");
                setError(null);
              }}
              className="min-h-[80px] rounded-card bg-white px-4 py-5 font-display text-lg font-semibold shadow-soft transition-transform active:scale-95"
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <button
        type="button"
        onClick={() => {
          setSelected(null);
          setPin("");
          setError(null);
        }}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-espresso-light"
      >
        <ChevronLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <h1 className="text-center font-display text-xl font-semibold">
        {selected.name}
      </h1>
      <p className="mt-1 text-center text-sm text-espresso-light">
        {t("waiter.enterPin")}
      </p>

      {/* PIN dots */}
      <div className="my-6 flex justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full transition-colors ${
              i < pin.length ? "bg-terracotta" : "bg-espresso/15"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-center text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {/* Number pad */}
      <div className={`grid grid-cols-3 gap-2.5 ${busy ? "opacity-50" : ""}`}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            disabled={busy}
            onClick={() => press(d)}
            className="min-h-[64px] rounded-2xl bg-cream-dark font-display text-2xl font-semibold transition-transform active:scale-95"
          >
            {d}
          </button>
        ))}
        <span />
        <button
          type="button"
          disabled={busy}
          onClick={() => press("0")}
          className="min-h-[64px] rounded-2xl bg-cream-dark font-display text-2xl font-semibold transition-transform active:scale-95"
        >
          0
        </button>
        <button
          type="button"
          disabled={busy || pin.length === 0}
          onClick={() => setPin(pin.slice(0, -1))}
          className="flex min-h-[64px] items-center justify-center rounded-2xl bg-cream-dark transition-transform active:scale-95"
          aria-label="Delete"
        >
          <Delete className="h-6 w-6 text-espresso-light" />
        </button>
      </div>
    </Card>
  );
}
