"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EARLY_BIRD_CODE, EARLY_BIRD_LIMIT } from "@/lib/billing";

export async function applyDiscountCode(
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  if (code.trim().toUpperCase() !== EARLY_BIRD_CODE.toUpperCase()) {
    return { ok: false, error: "invalid" };
  }

  // Limit: nur die ersten N Lokale (service role zählt über alle Venues)
  const admin = createAdminClient();
  const { count } = await admin
    .from("venues")
    .select("id", { count: "exact", head: true })
    .eq("early_bird", true);
  if ((count ?? 0) >= EARLY_BIRD_LIMIT) return { ok: false, error: "invalid" };

  const { error } = await supabase
    .from("venues")
    .update({ early_bird: true, discount_code: EARLY_BIRD_CODE })
    .eq("owner_id", user.id);
  if (error) return { ok: false, error: "db" };

  revalidatePath("/pretplata");
  return { ok: true };
}
