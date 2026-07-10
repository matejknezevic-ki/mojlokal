import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";

export async function POST(request: Request) {
  const session = await getWaiterSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const cashAmount = Number(body?.cashAmount);
  const note: string | undefined = body?.note;
  const checkedItemIds: string[] = Array.isArray(body?.checkedItemIds)
    ? body.checkedItemIds
    : [];

  if (!Number.isFinite(cashAmount) || cashAmount < 0) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 422 });
  }

  const admin = createAdminClient();

  const { data: open } = await admin
    .from("shift_sessions")
    .select("id")
    .eq("waiter_id", session.waiterId)
    .eq("venue_id", session.venueId)
    .is("ended_at", null)
    .maybeSingle();
  if (!open) return NextResponse.json({ error: "no_open_shift" }, { status: 404 });

  // Atomic close: the RPC re-validates the checklist server-side and records
  // cash count + completions + ended_at in one transaction.
  const { data, error } = await admin.rpc("end_shift", {
    p_session_id: open.id,
    p_waiter_id: session.waiterId,
    p_venue_id: session.venueId,
    p_amount: cashAmount,
    p_note: note ?? null,
    p_checked_item_ids: checkedItemIds,
  });

  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  if (!data?.ok) {
    const status = data?.error === "checklist_incomplete" ? 422 : 409;
    return NextResponse.json({ error: data?.error ?? "unknown" }, { status });
  }

  return NextResponse.json({
    ok: true,
    startedAt: data.started_at,
    endedAt: data.ended_at,
  });
}
