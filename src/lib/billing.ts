import type { Venue } from "@/lib/types";

export const TRIAL_DAYS = 5;

// Preise (EUR)
export const ONE_TIME_PRICE = 149;
export const ONE_TIME_PRICE_EARLY = 99;
export const MONTHLY_PRICE = 24.9;
export const MONTHLY_PRICE_EARLY = 19.9; // im ersten Jahr, für die ersten 20 Lokale

export const EARLY_BIRD_LIMIT = 20;
export const EARLY_BIRD_CODE = process.env.EARLY_BIRD_CODE || "PRVIH20";

export const BILLING_CONTACT_EMAIL = "matej@mk-ki.at";

export type SubscriptionState =
  | { status: "active" }
  | { status: "trial"; daysLeft: number }
  | { status: "expired" };

export function subscriptionState(
  venue: Pick<Venue, "subscription_status" | "trial_ends_at">
): SubscriptionState {
  if (venue.subscription_status === "active" || venue.subscription_status === "free") {
    return { status: "active" };
  }
  if (venue.subscription_status === "trial") {
    const msLeft = new Date(venue.trial_ends_at).getTime() - Date.now();
    if (msLeft > 0) {
      return { status: "trial", daysLeft: Math.max(1, Math.ceil(msLeft / 86_400_000)) };
    }
  }
  return { status: "expired" };
}
