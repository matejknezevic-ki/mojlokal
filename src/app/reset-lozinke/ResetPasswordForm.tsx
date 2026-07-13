"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/client";
import { Button, Card, Input, Label } from "@/components/ui";

export function ResetPasswordForm() {
  const t = useT();
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The recovery link lands here with a code; the browser client exchanges it
    // for a session automatically. Give it a moment, then verify.
    const supabase = createClient();
    const timer = setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setReady(user ? "ok" : "invalid");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(t("common.error"));
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/admin");
      router.refresh();
    }, 1200);
  }

  if (ready === "checking") {
    return <p className="text-center text-sm text-espresso-light">{t("common.loading")}</p>;
  }

  if (ready === "invalid") {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm font-medium text-danger">{t("auth.resetInvalid")}</p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
        >
          {t("auth.loginTab")}
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {done ? (
        <p className="rounded-xl bg-success-light px-4 py-3 text-sm font-semibold text-success">
          {t("auth.resetSuccess")}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
            <Input
              id="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {busy ? t("common.loading") : t("auth.resetButton")}
          </Button>
        </form>
      )}
    </Card>
  );
}
