"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function TipForm() {
  const t = useT();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const value = Number(amount.replace(",", "."));
  const valid = amount.trim() !== "" && Number.isFinite(value) && value > 0;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid || busy) return;
        setBusy(true);
        const res = await fetch("/api/waiter/tips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: value }),
        });
        setBusy(false);
        if (res.ok) {
          setAmount("");
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
          router.refresh();
        }
      }}
      className="flex items-center gap-2"
    >
      <div className="relative flex-1">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
          placeholder={t("month.addTip")}
          className="w-full rounded-xl border border-espresso/15 px-4 py-2.5 pr-8 text-right font-semibold tabular-nums outline-none focus:border-terracotta"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40">
          €
        </span>
      </div>
      <button
        type="submit"
        disabled={!valid || busy}
        className="rounded-xl bg-terracotta p-2.5 text-white disabled:bg-espresso/15"
        aria-label={t("month.addTip")}
      >
        <Plus className="h-5 w-5" />
      </button>
      {saved && (
        <span className="text-xs font-semibold text-success">{t("month.tipAdded")}</span>
      )}
    </form>
  );
}
