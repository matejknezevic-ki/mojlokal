import { Coffee } from "lucide-react";
import Link from "next/link";
import { getT } from "@/lib/i18n";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const t = await getT();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-terracotta" />
          <span className="font-display text-xl font-semibold">mojlokal</span>
        </Link>
        <LocaleToggle />
      </header>
      <main className="flex flex-1 flex-col justify-center py-10">
        <h1 className="mb-6 text-center font-display text-2xl font-semibold">
          {t("auth.resetTitle")}
        </h1>
        <ResetPasswordForm />
      </main>
    </div>
  );
}
