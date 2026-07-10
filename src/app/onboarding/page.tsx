import { redirect } from "next/navigation";
import { Coffee } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { LocaleToggle } from "@/components/LocaleToggle";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id, onboarded_at")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (venue?.onboarded_at) redirect("/admin");

  const t = await getT();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-terracotta" />
          <span className="font-display text-xl font-semibold">mojlokal</span>
        </div>
        <LocaleToggle />
      </header>
      <h1 className="mb-6 font-display text-2xl font-semibold">
        {t("onboarding.title")}
      </h1>
      <OnboardingWizard />
    </div>
  );
}
