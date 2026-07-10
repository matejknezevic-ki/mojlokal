import { Coffee } from "lucide-react";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n";
import { getWaiterSession } from "@/lib/waiter-auth";
import { LocaleToggle } from "@/components/LocaleToggle";
import { VenueCodeForm } from "./VenueCodeForm";

export default async function WaiterEntryPage() {
  const session = await getWaiterSession();
  if (session) redirect("/w/app");

  const t = await getT();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-terracotta" />
          <span className="font-display text-xl font-semibold">mojlokal</span>
        </div>
        <LocaleToggle />
      </header>
      <main className="flex flex-1 flex-col justify-center pb-16">
        <h1 className="mb-2 font-display text-2xl font-semibold">
          {t("waiter.enterCode")}
        </h1>
        <p className="mb-6 text-sm text-espresso-light">{t("waiter.codeHint")}</p>
        <VenueCodeForm />
      </main>
    </div>
  );
}
