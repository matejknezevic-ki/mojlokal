import Link from "next/link";
import { Coffee, UserRound } from "lucide-react";
import { requireOwnerVenue } from "@/lib/owner";
import { LocaleToggle } from "@/components/LocaleToggle";
import { AdminBottomBar, AdminSidebar } from "@/components/AdminNav";
import { switchToWaiterMode } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { venue, subscription } = await requireOwnerVenue();
  const { getT } = await import("@/lib/i18n");
  const t = await getT(venue.default_locale);

  return (
    <div className="flex min-h-screen flex-col">
      {subscription.status === "trial" && (
        <Link
          href="/pretplata"
          className="block bg-terracotta px-4 py-2 text-center text-sm font-semibold text-white"
        >
          {t("trial.left")} {subscription.daysLeft} {t("trial.days")} ·{" "}
          <span className="underline underline-offset-2">{t("trial.details")}</span>
        </Link>
      )}
      <header className="sticky top-0 z-40 border-b border-espresso/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-terracotta" />
            <span className="font-display text-lg font-semibold">
              {venue.name}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <form action={switchToWaiterMode}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl border border-espresso/15 px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-espresso/5"
              >
                <UserRound className="h-3.5 w-3.5" />
                {t("mode.workAsWaiter")}
              </button>
            </form>
            <LocaleToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-5 py-6 pb-24 lg:pb-6">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <AdminBottomBar />
    </div>
  );
}
