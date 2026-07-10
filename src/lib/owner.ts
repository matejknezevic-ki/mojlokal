import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Venue } from "@/lib/types";

// Loads the signed-in owner and their venue; redirects when either is missing.
export async function requireOwnerVenue() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!venue || !venue.onboarded_at) redirect("/onboarding");

  return { supabase, user, venue: venue as Venue };
}
