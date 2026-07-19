import Stripe from "stripe";
import { MONTHLY_PRICE_EARLY } from "./billing";

// Lazily created so importing this module never throws at build time when
// STRIPE_SECRET_KEY is absent. Routes guard with stripeConfigured() first, so
// getStripe() only runs once a real key exists.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Early-bird monthly = regular monthly price minus a repeating discount for the
// first 12 months, so the subscription reverts to the regular price afterwards.
// We keep a single stable coupon and reuse it (retrieve-or-create).
const EARLY_COUPON_ID = "mojlokal-earlybird-12m";

export async function earlyBirdCouponId(regularMonthly: number): Promise<string> {
  const stripe = getStripe();
  try {
    const existing = await stripe.coupons.retrieve(EARLY_COUPON_ID);
    return existing.id;
  } catch {
    const amountOff = Math.round((regularMonthly - MONTHLY_PRICE_EARLY) * 100);
    const coupon = await stripe.coupons.create({
      id: EARLY_COUPON_ID,
      amount_off: amountOff,
      currency: "eur",
      duration: "repeating",
      duration_in_months: 12,
      name: "mojlokal — prva godina (popust za prvih 20)",
    });
    return coupon.id;
  }
}
