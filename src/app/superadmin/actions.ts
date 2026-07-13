"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TRIAL_DAYS } from "@/lib/billing";

function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "matej@mk-ki.at,matej_knezevic@yahoo.de")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !superAdminEmails().includes(user.email.toLowerCase())) {
    throw new Error("forbidden");
  }
}

export async function setVenueSubscription(
  venueId: string,
  action: "activate" | "extend_trial" | "block" | "free"
) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  if (action === "activate") {
    await admin
      .from("venues")
      .update({ subscription_status: "active" })
      .eq("id", venueId);
  } else if (action === "extend_trial") {
    await admin
      .from("venues")
      .update({
        subscription_status: "trial",
        trial_ends_at: new Date(
          Date.now() + TRIAL_DAYS * 86_400_000
        ).toISOString(),
      })
      .eq("id", venueId);
  } else if (action === "block") {
    await admin
      .from("venues")
      .update({ subscription_status: "blocked" })
      .eq("id", venueId);
  } else if (action === "free") {
    await admin
      .from("venues")
      .update({ subscription_status: "free" })
      .eq("id", venueId);
  }
  revalidatePath("/superadmin");
}
