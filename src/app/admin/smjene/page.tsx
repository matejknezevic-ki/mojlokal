import { requireOwnerVenue } from "@/lib/owner";
import { getT } from "@/lib/i18n";
import { PageTitle } from "@/components/ui";
import type { ShiftTemplate } from "@/lib/types";
import { TemplatesManager } from "./TemplatesManager";

export default async function TemplatesPage() {
  const { supabase, venue } = await requireOwnerVenue();
  const t = await getT(venue.default_locale);

  const { data: templates } = await supabase
    .from("shift_templates")
    .select("*")
    .eq("venue_id", venue.id)
    .eq("active", true)
    .order("position");

  return (
    <div className="space-y-5">
      <PageTitle>{t("shiftsAdmin.title")}</PageTitle>
      <TemplatesManager
        venueId={venue.id}
        openingDays={venue.opening_days}
        templates={(templates ?? []) as ShiftTemplate[]}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
