import Link from "next/link";
import { redirect } from "next/navigation";
import { Coffee, LayoutDashboard, LogOut } from "lucide-react";
import { getWaiterSession } from "@/lib/waiter-auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { LocaleToggle } from "@/components/LocaleToggle";
import { WaiterNav } from "@/components/WaiterNav";
import { WaiterLogoutButton } from "./WaiterLogoutButton";
import { ServiceWorkerRegistrar } from "./ServiceWorkerRegistrar";

// Only the venue owner (chef) sees the back-to-admin button: the check is the
// Supabase auth session, not the waiter cookie, so a normal waiter never gets it.
async function isVenueOwner(venueId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("venues")
      .select("id")
      .eq("id", venueId)
      .eq("owner_id", user.id)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export default async function WaiterAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWaiterSession();
  if (!session) redirect("/w");

  const [t, isOwner] = await Promise.all([getT(), isVenueOwner(session.venueId)]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-5 pb-24">
      <ServiceWorkerRegistrar />
      <header className="mb-6 flex items-center justify-between">
        <Link href="/w/app" className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-terracotta" />
          <span className="font-display text-lg font-semibold">
            {t("waiter.hello")}, {session.name}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl border border-espresso/15 px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-espresso/5"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              {t("mode.backToAdmin")}
            </Link>
          )}
          <LocaleToggle />
          <WaiterLogoutButton label={t("common.logout")} slug={session.venueSlug}>
            <LogOut className="h-5 w-5" />
          </WaiterLogoutButton>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <WaiterNav />
    </div>
  );
}
