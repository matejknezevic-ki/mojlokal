import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";

// Waiter edits their own weekly availability ({"3": false} = can't work Wednesdays)
export async function POST(request: Request) {
  const session = await getWaiterSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const availability = body?.availability;
  if (typeof availability !== "object" || availability === null) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }
  const clean: Record<string, boolean> = {};
  for (const d of [1, 2, 3, 4, 5, 6, 7]) {
    if (availability[String(d)] === false) clean[String(d)] = false;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("waiters")
    .update({ availability: clean })
    .eq("id", session.waiterId)
    .eq("venue_id", session.venueId);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
