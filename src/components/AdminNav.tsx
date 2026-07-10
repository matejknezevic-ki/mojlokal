"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Clock3,
  ListChecks,
  Wallet,
  Timer,
  Settings,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";

const items = [
  { href: "/admin", icon: LayoutDashboard, key: "nav.dashboard" },
  { href: "/admin/raspored", icon: CalendarDays, key: "nav.schedule" },
  { href: "/admin/konobari", icon: Users, key: "nav.waiters" },
  { href: "/admin/smjene", icon: Clock3, key: "nav.shifts" },
  { href: "/admin/checklista", icon: ListChecks, key: "nav.checklist" },
  { href: "/admin/blagajna", icon: Wallet, key: "nav.cash" },
  { href: "/admin/sati", icon: Timer, key: "nav.hours" },
  { href: "/admin/postavke", icon: Settings, key: "nav.settings" },
] as const;

// Bottom tab bar on mobile shows the 5 most-used destinations; the sidebar
// on desktop shows everything.
const mobileItems = [items[0], items[1], items[2], items[5], items[7]];

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="hidden w-56 shrink-0 flex-col gap-1 lg:flex">
      {items.map(({ href, icon: Icon, key }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-espresso text-cream"
                : "text-espresso-light hover:bg-espresso/5"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminBottomBar() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-espresso/10 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {mobileItems.map(({ href, icon: Icon, key }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${
                active ? "text-terracotta" : "text-espresso/50"
              }`}
            >
              <Icon className="h-5 w-5" />
              {t(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
