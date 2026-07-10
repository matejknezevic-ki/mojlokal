import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { signWaiterSession, waiterCookieOptions, WAITER_COOKIE } from "@/lib/waiter-auth";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const venueSlug: string | undefined = body?.venueSlug;
  const waiterId: string | undefined = body?.waiterId;
  const pin: string | undefined = body?.pin;

  if (!venueSlug || !waiterId || !pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: venue } = await admin
    .from("venues")
    .select("id, slug")
    .eq("slug", venueSlug)
    .maybeSingle();
  if (!venue) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: waiter } = await admin
    .from("waiters")
    .select("id, venue_id, name, pin_hash, active, failed_pin_attempts, locked_until")
    .eq("id", waiterId)
    .eq("venue_id", venue.id)
    .maybeSingle();
  if (!waiter || !waiter.active) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (waiter.locked_until && new Date(waiter.locked_until) > new Date()) {
    return NextResponse.json({ error: "locked" }, { status: 423 });
  }

  const valid = bcrypt.compareSync(pin, waiter.pin_hash);
  if (!valid) {
    const attempts = waiter.failed_pin_attempts + 1;
    await admin
      .from("waiters")
      .update({
        failed_pin_attempts: attempts,
        locked_until:
          attempts >= MAX_ATTEMPTS
            ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
            : null,
      })
      .eq("id", waiter.id);
    return NextResponse.json(
      { error: attempts >= MAX_ATTEMPTS ? "locked" : "wrong_pin" },
      { status: attempts >= MAX_ATTEMPTS ? 423 : 401 }
    );
  }

  await admin
    .from("waiters")
    .update({ failed_pin_attempts: 0, locked_until: null })
    .eq("id", waiter.id);

  const token = await signWaiterSession({
    waiterId: waiter.id,
    venueId: waiter.venue_id,
    venueSlug: venue.slug,
    name: waiter.name,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(WAITER_COOKIE, token, waiterCookieOptions());
  return response;
}
