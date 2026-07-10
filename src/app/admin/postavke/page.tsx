import { requireOwnerVenue } from "@/lib/owner";
import { getT } from "@/lib/i18n";
import { PageTitle } from "@/components/ui";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const { venue } = await requireOwnerVenue();
  const t = await getT(venue.default_locale);

  return (
    <div className="space-y-5">
      <PageTitle>{t("settings.title")}</PageTitle>
      <SettingsForm venue={venue} />
    </div>
  );
}

export const dynamic = "force-dynamic";
