import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { subscriptionState } from "@/lib/billing";
import type { Venue } from "@/lib/types";
import { VenueAdminList } from "./VenueAdminList";

function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "matej@mk-ki.at,matej_knezevic@yahoo.de")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Betreiber-Panel: nur für die in SUPER_ADMIN_EMAILS gelisteten Konten.
export default async function SuperAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !superAdminEmails().includes(user.email.toLowerCase())) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const [{ data: venues }, usersRes] = await Promise.all([
    admin
      .from("venues")
      .select("*")
      .order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailByOwner = new Map(
    (usersRes.data?.users ?? []).map((u) => [u.id, u.email ?? "?"])
  );

  const rows = ((venues ?? []) as Venue[]).map((v) => {
    const state = subscriptionState(v);
    return {
      id: v.id,
      name: v.name,
      slug: v.slug,
      city: v.city,
      ownerName: v.owner_name,
      ownerEmail: emailByOwner.get(v.owner_id) ?? "?",
      createdAt: v.created_at,
      status: v.subscription_status,
      trialEndsAt: v.trial_ends_at,
      state: state.status,
      daysLeft: state.status === "trial" ? state.daysLeft : null,
      earlyBird: v.early_bird,
    };
  });

  const stats = {
    total: rows.length,
    trial: rows.filter((r) => r.state === "trial").length,
    paid: rows.filter((r) => r.status === "active").length,
    free: rows.filter((r) => r.status === "free").length,
    expired: rows.filter(
      (r) => r.state === "expired" || r.status === "blocked"
    ).length,
  };
  const stat = (label: string, value: number) => (
    <div className="rounded-card bg-white px-4 py-3 text-center shadow-soft">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-espresso-light">{label}</p>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8">
      <h1 className="flex items-center gap-2 font-display text-2xl font-semibold">
        <ShieldCheck className="h-6 w-6 text-terracotta" /> mojlokal Superadmin
      </h1>
      <p className="mt-1 text-sm text-espresso-light">
        Wer hat sich wann und wo angemeldet — plus freischalten, Testphase
        verlängern oder sperren.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {stat("Gesamt", stats.total)}
        {stat("Testphase", stats.trial)}
        {stat("Zahlend", stats.paid)}
        {stat("Gratis", stats.free)}
        {stat("Abgelaufen", stats.expired)}
      </div>

      <div className="mt-6">
        <VenueAdminList venues={rows} />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
