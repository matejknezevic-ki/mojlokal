import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, stripeConfigured, earlyBirdCouponId } from "@/lib/stripe";
import {
  ONE_TIME_PRICE,
  ONE_TIME_PRICE_EARLY,
  MONTHLY_PRICE,
} from "@/lib/billing";
import type { Venue } from "@/lib/types";

export const runtime = "nodejs";

// Starts a Stripe Checkout session for the signed-in owner's venue. The plan is
// either a one-time perpetual purchase or a monthly subscription — the customer
// picks one. venue_id travels in the session (and, for subscriptions, in the
// subscription metadata) so the webhook can activate the right venue.
export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: venueRow } = await supabase
    .from("venues")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!venueRow) return NextResponse.json({ error: "no_venue" }, { status: 404 });
  const venue = venueRow as Venue;

  const body = (await request.json().catch(() => ({}))) as { plan?: string };
  const plan = body.plan;
  if (plan !== "onetime" && plan !== "monthly") {
    return NextResponse.json({ error: "bad_plan" }, { status: 400 });
  }

  const origin =
    request.headers.get("origin") ?? new URL(request.url).origin;
  const early = venue.early_bird;

  const common = {
    customer_email: user.email ?? undefined,
    metadata: { venue_id: venue.id, plan },
    success_url: `${origin}/pretplata?stripe=success`,
    cancel_url: `${origin}/pretplata?stripe=cancel`,
  } as const;

  let session;
  if (plan === "onetime") {
    const amount = (early ? ONE_TIME_PRICE_EARLY : ONE_TIME_PRICE) * 100;
    session = await getStripe().checkout.sessions.create({
      ...common,
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amount,
            product_data: {
              name: `mojlokal — jednokratno postavljanje (${venue.name})`,
            },
          },
        },
      ],
      payment_intent_data: { metadata: { venue_id: venue.id } },
    });
  } else {
    // Monthly is always billed at the regular price; early-bird venues get a
    // 12-month coupon that reverts to the regular price afterwards.
    const discounts = early
      ? [{ coupon: await earlyBirdCouponId(MONTHLY_PRICE) }]
      : undefined;
    session = await getStripe().checkout.sessions.create({
      ...common,
      mode: "subscription",
      discounts,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(MONTHLY_PRICE * 100),
            recurring: { interval: "month" },
            product_data: {
              name: `mojlokal — mjesečna pretplata (${venue.name})`,
            },
          },
        },
      ],
      subscription_data: { metadata: { venue_id: venue.id } },
    });
  }

  if (!session.url) {
    return NextResponse.json({ error: "no_session_url" }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
