import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";

export async function POST(request: Request) {
  const session = await getWaiterSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const offDate: string | undefined = body?.date;
  if (!offDate || !/^\d{4}-\d{2}-\d{2}$/.test(offDate) || offDate < new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("time_off_requests").insert({
    venue_id: session.venueId,
    waiter_id: session.waiterId,
    off_date: offDate,
    note: typeof body?.note === "string" ? body.note.trim().slice(0, 200) || null : null,
  });
  if (error) {
    return NextResponse.json(
      { error: error.code === "23505" ? "exists" : "db" },
      { status: error.code === "23505" ? 409 : 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
