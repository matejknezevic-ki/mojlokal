import { Suspense } from "react";
import Link from "next/link";
import { Coffee } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { LocaleToggle } from "@/components/LocaleToggle";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/admin");

  const t = await getT();

  return (
    <div className="flex min-h-screen flex-col items-center px-5 py-8">
      <header className="flex w-full max-w-md items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-terracotta" />
          <span className="font-display text-xl font-semibold">mojlokal</span>
        </Link>
        <LocaleToggle />
      </header>

      <main className="flex w-full max-w-md flex-1 flex-col justify-center py-10">
        <h1 className="mb-6 text-center font-display text-2xl font-semibold">
          {t("auth.loginTitle")}
        </h1>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-8 text-center text-sm">
          <Link href="/w" className="font-semibold text-terracotta underline-offset-4 hover:underline">
            {t("auth.waiterLink")}
          </Link>
        </p>
      </main>
    </div>
  );
}
