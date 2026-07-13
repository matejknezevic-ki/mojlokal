import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { subscriptionState } from "@/lib/billing";
import type { Venue } from "@/lib/types";

// Loads the signed-in owner and their venue; redirects when either is missing
// or the trial has expired (paywall).
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

  const subscription = subscriptionState(venue as Venue);
  if (subscription.status === "expired") redirect("/pretplata");

  return { supabase, user, venue: venue as Venue, subscription };
}
