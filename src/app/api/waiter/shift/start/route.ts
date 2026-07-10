import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";

export async function POST() {
  const session = await getWaiterSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Refuse a second open session for the same waiter.
  const { data: open } = await admin
    .from("shift_sessions")
    .select("id")
    .eq("waiter_id", session.waiterId)
    .eq("venue_id", session.venueId)
    .is("ended_at", null)
    .maybeSingle();
  if (open) return NextResponse.json({ ok: true, sessionId: open.id });

  const { data, error } = await admin
    .from("shift_sessions")
    .insert({ venue_id: session.venueId, waiter_id: session.waiterId })
    .select("id, started_at")
    .single();
  if (error || !data) return NextResponse.json({ error: "db" }, { status: 500 });

  return NextResponse.json({ ok: true, sessionId: data.id, startedAt: data.started_at });
}
