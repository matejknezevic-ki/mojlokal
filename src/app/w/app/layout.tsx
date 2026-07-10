import Link from "next/link";
import { redirect } from "next/navigation";
import { Coffee, History, UserRound } from "lucide-react";
import { getWaiterSession } from "@/lib/waiter-auth";
import { getT } from "@/lib/i18n";
import { LocaleToggle } from "@/components/LocaleToggle";
import { WaiterLogoutButton } from "./WaiterLogoutButton";

export default async function WaiterAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWaiterSession();
  if (!session) redirect("/w");

  const t = await getT();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-5">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/w/app" className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-terracotta" />
          <span className="font-display text-lg font-semibold">
            {t("waiter.hello")}, {session.name}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <Link
            href="/w/app/povijest"
            className="rounded-xl p-2 text-espresso-light hover:bg-espresso/5"
            aria-label={t("waiter.history")}
          >
            <History className="h-5 w-5" />
          </Link>
          <WaiterLogoutButton label={t("waiter.switchUser")} slug={session.venueSlug}>
            <UserRound className="h-5 w-5" />
          </WaiterLogoutButton>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
