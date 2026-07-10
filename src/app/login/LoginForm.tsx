"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/client";
import { Button, Card, Input, Label } from "@/components/ui";

export function LoginForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(t("auth.invalidCredentials"));
        setBusy(false);
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(
          error.message.toLowerCase().includes("already")
            ? t("auth.emailTaken")
            : t("auth.registerError")
        );
        setBusy(false);
        return;
      }
      if (!data.session) {
        // Email confirmation is enabled on the project — sign in directly
        // afterwards fails until confirmed, so surface a helpful error.
        setError(t("auth.registerError"));
        setBusy(false);
        return;
      }
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <Card className="p-6">
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-cream-dark p-1">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === m ? "bg-white shadow-soft" : "text-espresso-light"
            }`}
          >
            {m === "login" ? t("auth.loginTab") : t("auth.registerTab")}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">
            {mode === "register" ? t("auth.passwordMin") : t("auth.password")}
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
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
          {busy
            ? t("common.loading")
            : mode === "login"
              ? t("auth.loginButton")
              : t("auth.registerButton")}
        </Button>
      </form>
    </Card>
  );
}
