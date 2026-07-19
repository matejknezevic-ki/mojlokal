import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe -> mojlokal. Verifies the signature, then flips the venue's
// subscription status. venue_id is read from the object metadata we set at
// checkout, so no Stripe-id columns are needed in the database.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeConfigured() || !secret) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig ?? "", secret);
  } catch (err) {
    return NextResponse.json(
      { error: `invalid_signature: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const setStatus = async (venueId: string, status: string) => {
    if (!venueId) return;
    await admin
      .from("venues")
      .update({ subscription_status: status })
      .eq("id", venueId);
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      // One-time payments complete immediately; subscriptions are confirmed by
      // the first invoice, but a completed checkout already means access is due.
      if (s.payment_status === "paid" || s.mode === "subscription") {
        await setStatus(s.metadata?.venue_id ?? "", "active");
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await setStatus((sub.metadata?.venue_id as string) ?? "", "blocked");
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const venueId = (sub.metadata?.venue_id as string) ?? "";
      if (["active", "trialing"].includes(sub.status)) {
        await setStatus(venueId, "active");
      } else if (
        ["canceled", "unpaid", "incomplete_expired"].includes(sub.status)
      ) {
        await setStatus(venueId, "blocked");
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
