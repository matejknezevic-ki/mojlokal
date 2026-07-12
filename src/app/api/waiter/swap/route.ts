import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";

// Shift swap flow: offer own shift → colleague takes it → owner approves (admin).
export async function POST(request: Request) {
  const session = await getWaiterSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const action: string | undefined = body?.action;
  const admin = createAdminClient();

  if (action === "offer") {
    // Only own future shifts from a published schedule can be offered.
    const { data: shift } = await admin
      .from("shifts")
      .select("id, waiter_id, venue_id, shift_date")
      .eq("id", body?.shiftId)
      .eq("venue_id", session.venueId)
      .eq("waiter_id", session.waiterId)
      .maybeSingle();
    if (!shift || shift.shift_date < new Date().toISOString().slice(0, 10)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const { data: existing } = await admin
      .from("swap_requests")
      .select("id")
      .eq("shift_id", shift.id)
      .in("status", ["open", "accepted"])
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "exists" }, { status: 409 });

    const { error } = await admin.from("swap_requests").insert({
      venue_id: session.venueId,
      shift_id: shift.id,
      from_waiter_id: session.waiterId,
    });
    if (error) return NextResponse.json({ error: "db" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "request") {
    // Ask to take over a COLLEAGUE's future published shift — goes straight to
    // the owner for approval (from = current shift owner, to = requester).
    const { data: shift } = await admin
      .from("shifts")
      .select("id, waiter_id, venue_id, shift_date, schedules!inner(status)")
      .eq("id", body?.shiftId)
      .eq("venue_id", session.venueId)
      .eq("schedules.status", "published")
      .maybeSingle();
    if (
      !shift ||
      shift.waiter_id === session.waiterId ||
      shift.shift_date < new Date().toISOString().slice(0, 10)
    ) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const { data: existing } = await admin
      .from("swap_requests")
      .select("id")
      .eq("shift_id", shift.id)
      .in("status", ["open", "accepted"])
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "exists" }, { status: 409 });

    const { error } = await admin.from("swap_requests").insert({
      venue_id: session.venueId,
      shift_id: shift.id,
      from_waiter_id: shift.waiter_id,
      to_waiter_id: session.waiterId,
      status: "accepted",
    });
    if (error) return NextResponse.json({ error: "db" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "take") {
    const { data: swap } = await admin
      .from("swap_requests")
      .select("id, from_waiter_id, status")
      .eq("id", body?.swapId)
      .eq("venue_id", session.venueId)
      .eq("status", "open")
      .maybeSingle();
    if (!swap || swap.from_waiter_id === session.waiterId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const { error } = await admin
      .from("swap_requests")
      .update({ to_waiter_id: session.waiterId, status: "accepted" })
      .eq("id", swap.id)
      .eq("status", "open");
    if (error) return NextResponse.json({ error: "db" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "cancel") {
    const { error } = await admin
      .from("swap_requests")
      .update({ status: "cancelled" })
      .eq("id", body?.swapId)
      .eq("venue_id", session.venueId)
      .eq("from_waiter_id", session.waiterId)
      .in("status", ["open", "accepted"]);
    if (error) return NextResponse.json({ error: "db" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
