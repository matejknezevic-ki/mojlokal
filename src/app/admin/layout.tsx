import Link from "next/link";
import { Coffee } from "lucide-react";
import { requireOwnerVenue } from "@/lib/owner";
import { LocaleToggle } from "@/components/LocaleToggle";
import { AdminBottomBar, AdminSidebar } from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { venue } = await requireOwnerVenue();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-espresso/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-terracotta" />
            <span className="font-display text-lg font-semibold">
              {venue.name}
            </span>
          </Link>
          <LocaleToggle />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-5 py-6 pb-24 lg:pb-6">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <AdminBottomBar />
    </div>
  );
}
