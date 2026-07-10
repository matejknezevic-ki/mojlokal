import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";
import type { ChecklistItem } from "@/lib/types";
import { EndShiftFlow } from "./EndShiftFlow";

export default async function EndShiftPage() {
  const session = await getWaiterSession();
  if (!session) redirect("/w");

  const admin = createAdminClient();

  const { data: open } = await admin
    .from("shift_sessions")
    .select("id, started_at")
    .eq("waiter_id", session.waiterId)
    .eq("venue_id", session.venueId)
    .is("ended_at", null)
    .maybeSingle();
  if (!open) redirect("/w/app");

  const { data: items } = await admin
    .from("checklist_items")
    .select("id, venue_id, label, position, active")
    .eq("venue_id", session.venueId)
    .eq("active", true)
    .order("position");

  return (
    <EndShiftFlow
      startedAt={open.started_at}
      items={(items ?? []) as ChecklistItem[]}
    />
  );
}

export const dynamic = "force-dynamic";
