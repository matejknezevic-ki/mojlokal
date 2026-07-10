"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { Button, Input } from "@/components/ui";
import { slugify } from "@/lib/utils";

export function VenueCodeForm() {
  const t = useT();
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const slug = slugify(code);
        if (slug) router.push(`/w/${slug}`);
      }}
      className="space-y-3"
    >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t("waiter.codePlaceholder")}
        autoCapitalize="none"
        autoCorrect="off"
        autoFocus
        className="py-4 text-lg"
      />
      <Button type="submit" size="lg" className="w-full" disabled={!code.trim()}>
        {t("waiter.go")}
      </Button>
    </form>
  );
}
