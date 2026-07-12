import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";

// Private tip diary — rows are only ever read/written for the session's waiter.
export async function POST(request: Request) {
  const session = await getWaiterSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount < 0 || amount > 10000) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("tips").insert({
    venue_id: session.venueId,
    waiter_id: session.waiterId,
    shift_session_id: body?.shiftSessionId ?? null,
    amount,
    tip_date: body?.date ?? new Date().toISOString().slice(0, 10),
  });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
