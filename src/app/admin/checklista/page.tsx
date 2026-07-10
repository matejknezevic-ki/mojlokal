import { requireOwnerVenue } from "@/lib/owner";
import { getT } from "@/lib/i18n";
import { PageTitle } from "@/components/ui";
import type { ChecklistItem } from "@/lib/types";
import { ChecklistManager } from "./ChecklistManager";

export default async function ChecklistPage() {
  const { supabase, venue } = await requireOwnerVenue();
  const t = await getT(venue.default_locale);

  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("venue_id", venue.id)
    .eq("active", true)
    .order("position");

  return (
    <div className="space-y-5">
      <div>
        <PageTitle>{t("checklistAdmin.title")}</PageTitle>
        <p className="mt-1 text-sm text-espresso-light">
          {t("checklistAdmin.subtitle")}
        </p>
      </div>
      <ChecklistManager venueId={venue.id} items={(items ?? []) as ChecklistItem[]} />
    </div>
  );
}

export const dynamic = "force-dynamic";
