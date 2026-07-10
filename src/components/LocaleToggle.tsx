"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/client";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n";

export function LocaleToggle() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border border-espresso/15 bg-white/70 p-0.5 text-xs font-semibold ${
        pending ? "opacity-50" : ""
      }`}
    >
      {(["hr", "de"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
            locale === l
              ? "bg-espresso text-cream"
              : "text-espresso-light hover:text-espresso"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
