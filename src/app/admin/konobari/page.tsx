import { requireOwnerVenue } from "@/lib/owner";
import { getT } from "@/lib/i18n";
import { PageTitle } from "@/components/ui";
import type { Waiter } from "@/lib/types";
import { WaitersManager } from "./WaitersManager";

export default async function WaitersPage() {
  const { supabase, venue } = await requireOwnerVenue();
  const t = await getT(venue.default_locale);

  const { data: waiters } = await supabase
    .from("waiters")
    .select("id, venue_id, name, target_shifts_per_week, availability, active, created_at")
    .eq("venue_id", venue.id)
    .order("name");

  return (
    <div className="space-y-5">
      <PageTitle>{t("waiters.title")}</PageTitle>
      <WaitersManager venueId={venue.id} waiters={(waiters ?? []) as Waiter[]} />
    </div>
  );
}

export const dynamic = "force-dynamic";
