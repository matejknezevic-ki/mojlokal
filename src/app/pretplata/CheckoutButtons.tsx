"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// Two card-payment buttons — the customer picks a one-time purchase or a monthly
// subscription. Each POSTs to the checkout route and redirects to Stripe.
export function CheckoutButtons() {
  const t = useT();
  const [loading, setLoading] = useState<"onetime" | "monthly" | null>(null);
  const [error, setError] = useState(false);

  async function go(plan: "onetime" | "monthly") {
    setError(false);
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setLoading(null);
  }

  return (
    <div className="mt-6 space-y-2.5">
      <button
        type="button"
        onClick={() => go("onetime")}
        disabled={loading !== null}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-terracotta font-display text-lg font-bold text-white shadow-lifted active:scale-[0.98] disabled:opacity-60"
      >
        {loading === "onetime" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CreditCard className="h-5 w-5" />
        )}
        {t("sub.payOneTime")}
      </button>
      <button
        type="button"
        onClick={() => go("monthly")}
        disabled={loading !== null}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-espresso font-display text-lg font-bold text-cream active:scale-[0.98] disabled:opacity-60"
      >
        {loading === "monthly" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CreditCard className="h-5 w-5" />
        )}
        {t("sub.payMonthly")}
      </button>
      {error && (
        <p className="text-center text-sm font-medium text-danger">
          {t("sub.payError")}
        </p>
      )}
    </div>
  );
}
