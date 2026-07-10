import { Coffee } from "lucide-react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n";
import { getWaiterSession } from "@/lib/waiter-auth";
import { LocaleToggle } from "@/components/LocaleToggle";
import { EmptyState } from "@/components/ui";
import { WaiterLogin } from "./WaiterLogin";

export default async function WaiterPickerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await getWaiterSession();
  if (session?.venueSlug === slug) redirect("/w/app");

  // Public info only: venue name + active waiter names, loaded via service
  // role (waiters have no Supabase identity). No PINs, no other data.
  const admin = createAdminClient();
  const { data: venue } = await admin
    .from("venues")
    .select("id, name, slug, default_locale")
    .eq("slug", slug)
    .maybeSingle();

  const t = await getT(venue?.default_locale ?? "hr");

  if (!venue) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5">
        <EmptyState>{t("waiter.notFound")}</EmptyState>
      </div>
    );
  }

  const { data: waiters } = await admin
    .from("waiters")
    .select("id, name")
    .eq("venue_id", venue.id)
    .eq("active", true)
    .order("name");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-terracotta" />
          <span className="font-display text-lg font-semibold">{venue.name}</span>
        </div>
        <LocaleToggle />
      </header>
      <main className="flex flex-1 flex-col justify-center pb-10">
        <WaiterLogin venueSlug={venue.slug} waiters={waiters ?? []} />
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
