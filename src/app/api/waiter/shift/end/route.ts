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

  // Optional extras recorded after the successful atomic close
  const handoverNote =
    typeof body?.handoverNote === "string" ? body.handoverNote.trim().slice(0, 300) : "";
  if (handoverNote) {
    await admin
      .from("shift_sessions")
      .update({ handover_note: handoverNote })
      .eq("id", open.id);
  }
  const tip = Number(body?.tipAmount);
  if (Number.isFinite(tip) && tip > 0 && tip <= 10000) {
    await admin.from("tips").insert({
      venue_id: session.venueId,
      waiter_id: session.waiterId,
      shift_session_id: open.id,
      amount: tip,
    });
  }

  return NextResponse.json({
    ok: true,
    startedAt: data.started_at,
    endedAt: data.ended_at,
  });
}
