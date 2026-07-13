"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Input } from "@/components/ui";
import { applyDiscountCode } from "./actions";

export function DiscountCodeForm() {
  const t = useT();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(false);
        startTransition(async () => {
          const result = await applyDiscountCode(code);
          if (result.ok) router.refresh();
          else setError(true);
        });
      }}
      className="mt-5"
    >
      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-espresso-light">
        <Tag className="h-3.5 w-3.5" /> {t("sub.codeLabel")}
      </p>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("sub.codePlaceholder")}
          className="flex-1 uppercase"
          autoCapitalize="characters"
        />
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="rounded-xl bg-espresso px-4 py-2 text-sm font-semibold text-cream disabled:opacity-40"
        >
          {t("sub.codeApply")}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-sm font-medium text-danger">{t("sub.codeInvalid")}</p>
      )}
    </form>
  );
}
