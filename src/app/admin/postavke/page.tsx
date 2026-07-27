import Link from "next/link";
import { ChevronRight, Clock3, ListChecks, Timer, Wallet } from "lucide-react";
import { requireOwnerVenue } from "@/lib/owner";
import { getT } from "@/lib/i18n";
import { Card, PageTitle } from "@/components/ui";
import { SettingsForm } from "./SettingsForm";

// Sections that live only in the desktop sidebar — surfaced here so the chef can
// reach them from the phone (the mobile bottom bar only holds five destinations).
const MOBILE_SECTIONS = [
  { href: "/admin/smjene", icon: Clock3, key: "nav.shifts" },
  { href: "/admin/checklista", icon: ListChecks, key: "nav.checklist" },
  { href: "/admin/blagajna", icon: Wallet, key: "nav.cash" },
  { href: "/admin/sati", icon: Timer, key: "nav.hours" },
] as const;

export default async function SettingsPage() {
  const { venue } = await requireOwnerVenue();
  const t = await getT(venue.default_locale);

  return (
    <div className="space-y-5">
      <PageTitle>{t("settings.title")}</PageTitle>

      <Card className="overflow-hidden p-0 lg:hidden">
        <p className="border-b border-espresso/10 px-5 py-3 text-xs font-bold uppercase tracking-wide text-espresso/40">
          {t("settings.manage")}
        </p>
        <nav>
          {MOBILE_SECTIONS.map(({ href, icon: Icon, key }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 border-b border-espresso/5 px-5 py-3.5 last:border-0 active:bg-cream-dark/60"
            >
              <Icon className="h-5 w-5 text-terracotta" />
              <span className="flex-1 font-semibold">{t(key)}</span>
              <ChevronRight className="h-4 w-4 text-espresso/30" />
            </Link>
          ))}
        </nav>
      </Card>

      <SettingsForm venue={venue} />
    </div>
  );
}

export const dynamic = "force-dynamic";
