"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generatePin } from "@/lib/utils";

// All actions run through the SSR client, so RLS scopes every statement to
// venues owned by the signed-in user — venue_id from the client is safe here.

async function ownerClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");
  return supabase;
}

// --- Waiters ---------------------------------------------------------------

export async function addWaiter(
  venueId: string,
  name: string,
  targetShifts: number
): Promise<{ pin: string } | { error: string }> {
  const supabase = await ownerClient();
  const pin = generatePin();
  const { error } = await supabase.from("waiters").insert({
    venue_id: venueId,
    name: name.trim(),
    pin_hash: bcrypt.hashSync(pin, 10),
    target_shifts_per_week: Math.max(0, Math.min(14, targetShifts)),
  });
  if (error) return { error: error.code === "23505" ? "duplicate" : "db" };
  revalidatePath("/admin/konobari");
  return { pin };
}

export async function resetWaiterPin(
  waiterId: string
): Promise<{ pin: string } | { error: string }> {
  const supabase = await ownerClient();
  const pin = generatePin();
  const { data, error } = await supabase
    .from("waiters")
    .update({
      pin_hash: bcrypt.hashSync(pin, 10),
      failed_pin_attempts: 0,
      locked_until: null,
    })
    .eq("id", waiterId)
    .select("id");
  if (error || !data?.length) return { error: "db" };
  return { pin };
}

export async function updateWaiter(
  waiterId: string,
  fields: {
    targetShifts?: number;
    active?: boolean;
    availability?: Record<string, boolean>;
    hourlyRate?: number | null;
  }
) {
  const supabase = await ownerClient();
  const update: Record<string, unknown> = {};
  if (fields.targetShifts !== undefined)
    update.target_shifts_per_week = Math.max(0, Math.min(14, fields.targetShifts));
  if (fields.active !== undefined) update.active = fields.active;
  if (fields.availability !== undefined) update.availability = fields.availability;
  if (fields.hourlyRate !== undefined)
    update.hourly_rate =
      fields.hourlyRate === null || !Number.isFinite(fields.hourlyRate)
        ? null
        : Math.max(0, Math.min(500, fields.hourlyRate));
  await supabase.from("waiters").update(update).eq("id", waiterId);
  revalidatePath("/admin/konobari");
}

export async function deleteWaiter(waiterId: string) {
  const supabase = await ownerClient();
  await supabase.from("waiters").delete().eq("id", waiterId);
  revalidatePath("/admin/konobari");
}

// --- Shift templates & opening days ----------------------------------------

export async function addTemplate(
  venueId: string,
  name: string,
  start: string,
  end: string
) {
  const supabase = await ownerClient();
  await supabase.from("shift_templates").insert({
    venue_id: venueId,
    name: name.trim(),
    start_time: start,
    end_time: end,
  });
  revalidatePath("/admin/smjene");
}

export async function updateTemplate(
  templateId: string,
  fields: { name?: string; start?: string; end?: string }
) {
  const supabase = await ownerClient();
  const update: Record<string, unknown> = {};
  if (fields.name !== undefined) update.name = fields.name.trim();
  if (fields.start !== undefined) update.start_time = fields.start;
  if (fields.end !== undefined) update.end_time = fields.end;
  await supabase.from("shift_templates").update(update).eq("id", templateId);
  revalidatePath("/admin/smjene");
}

export async function deleteTemplate(templateId: string) {
  const supabase = await ownerClient();
  await supabase.from("shift_templates").update({ active: false }).eq("id", templateId);
  revalidatePath("/admin/smjene");
}

export async function updateOpeningDays(venueId: string, days: number[]) {
  const supabase = await ownerClient();
  await supabase
    .from("venues")
    .update({ opening_days: days.length ? days : [1, 2, 3, 4, 5, 6, 7] })
    .eq("id", venueId);
  revalidatePath("/admin/smjene");
}

// --- Checklist ---------------------------------------------------------------

export async function addChecklistItem(venueId: string, label: string) {
  const supabase = await ownerClient();
  const { data: max } = await supabase
    .from("checklist_items")
    .select("position")
    .eq("venue_id", venueId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  await supabase.from("checklist_items").insert({
    venue_id: venueId,
    label: label.trim(),
    position: (max?.position ?? 0) + 1,
  });
  revalidatePath("/admin/checklista");
}

export async function updateChecklistItem(itemId: string, label: string) {
  const supabase = await ownerClient();
  await supabase.from("checklist_items").update({ label: label.trim() }).eq("id", itemId);
  revalidatePath("/admin/checklista");
}

export async function deleteChecklistItem(itemId: string) {
  const supabase = await ownerClient();
  await supabase.from("checklist_items").update({ active: false }).eq("id", itemId);
  revalidatePath("/admin/checklista");
}

// --- Settings ----------------------------------------------------------------

export async function updateVenueSettings(
  venueId: string,
  fields: { name?: string; ownerName?: string; defaultLocale?: "hr" | "de" }
) {
  const supabase = await ownerClient();
  const update: Record<string, unknown> = {};
  if (fields.name !== undefined) update.name = fields.name.trim();
  if (fields.ownerName !== undefined) update.owner_name = fields.ownerName.trim();
  if (fields.defaultLocale !== undefined) update.default_locale = fields.defaultLocale;
  await supabase.from("venues").update(update).eq("id", venueId);
  revalidatePath("/admin/postavke");
}

export async function signOut() {
  const supabase = await ownerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// --- Schedule ----------------------------------------------------------------

export async function updateShiftAssignment(shiftId: string, waiterId: string) {
  const supabase = await ownerClient();
  await supabase.from("shifts").update({ waiter_id: waiterId }).eq("id", shiftId);
  revalidatePath("/admin/raspored");
}

export async function publishSchedule(scheduleId: string) {
  const supabase = await ownerClient();
  const { data } = await supabase
    .from("schedules")
    .update({ status: "published" })
    .eq("id", scheduleId)
    .select("venue_id")
    .maybeSingle();
  revalidatePath("/admin/raspored");
  if (data?.venue_id) {
    const { notifyVenueWaiters } = await import("@/lib/push");
    await notifyVenueWaiters(data.venue_id, {
      title: "mojlokal",
      body: "Novi raspored smjena je objavljen! 📅",
      url: "/w/app",
    }).catch(() => {});
  }
}

// --- Requests (time off + swaps) --------------------------------------------

export async function resolveTimeOff(requestId: string, approve: boolean) {
  const supabase = await ownerClient();
  const { data } = await supabase
    .from("time_off_requests")
    .update({ status: approve ? "approved" : "denied" })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("waiter_id, off_date")
    .maybeSingle();
  revalidatePath("/admin/zahtjevi");

  if (data) {
    const { notifyWaiter } = await import("@/lib/push");
    const d = `${data.off_date.slice(8, 10)}.${data.off_date.slice(5, 7)}.`;
    await notifyWaiter(data.waiter_id, {
      title: "mojlokal",
      body: approve
        ? `Slobodan dan ${d} je odobren ✅`
        : `Zahtjev za slobodan dan ${d} je odbijen`,
      url: "/w/app/dostupnost",
    }).catch(() => {});
  }
}

export async function resolveSwap(swapId: string, approve: boolean) {
  const supabase = await ownerClient();
  const { data: swap } = await supabase
    .from("swap_requests")
    .select("id, shift_id, from_waiter_id, to_waiter_id, status, shifts!inner(shift_date, start_time)")
    .eq("id", swapId)
    .maybeSingle();
  if (!swap || swap.status !== "accepted" || !swap.to_waiter_id) return;

  if (approve) {
    await supabase
      .from("shifts")
      .update({ waiter_id: swap.to_waiter_id })
      .eq("id", swap.shift_id);
  }
  await supabase
    .from("swap_requests")
    .update({ status: approve ? "approved" : "rejected" })
    .eq("id", swap.id);
  revalidatePath("/admin/zahtjevi");
  revalidatePath("/admin/raspored");

  const { notifyWaiter } = await import("@/lib/push");
  const shift = swap.shifts as unknown as { shift_date: string; start_time: string };
  const d = `${shift.shift_date.slice(8, 10)}.${shift.shift_date.slice(5, 7)}.`;
  const url = "/w/app/raspored";
  if (approve) {
    await Promise.allSettled([
      notifyWaiter(swap.to_waiter_id, {
        title: "mojlokal",
        body: `Zamjena odobrena — smjena ${d} je tvoja ✅`,
        url,
      }),
      notifyWaiter(swap.from_waiter_id, {
        title: "mojlokal",
        body: `Zamjena odobrena — smjenu ${d} preuzima kolega ✅`,
        url,
      }),
    ]);
  } else {
    await notifyWaiter(swap.to_waiter_id, {
      title: "mojlokal",
      body: `Zamjena za ${d} je odbijena`,
      url,
    }).catch(() => {});
  }
}
