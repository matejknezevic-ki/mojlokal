"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, History, Home, PiggyBank } from "lucide-react";
import { useT } from "@/lib/i18n/client";

const items = [
  { href: "/w/app", icon: Home, key: "wnav.home" },
  { href: "/w/app/mjesec", icon: PiggyBank, key: "wnav.month" },
  { href: "/w/app/dostupnost", icon: CalendarCheck2, key: "wnav.availability" },
  { href: "/w/app/povijest", icon: History, key: "wnav.history" },
] as const;

export function WaiterNav() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-espresso/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, icon: Icon, key }) => {
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
