import { addDays, isoWeekday } from "@/lib/utils";
import type { ShiftTemplate, Waiter } from "@/lib/types";

export type Assignment = {
  date: string; // YYYY-MM-DD
  template_id: string;
  waiter_id: string;
};

export type SchedulerInput = {
  weekStart: string; // Monday, YYYY-MM-DD
  openingDays: number[];
  waiters: Pick<Waiter, "id" | "name" | "target_shifts_per_week" | "availability">[];
  templates: Pick<ShiftTemplate, "id" | "name" | "start_time" | "end_time">[];
  /** approved time-off: waiter_id -> set of YYYY-MM-DD dates */
  timeOff?: Record<string, string[]>;
};

function isAvailable(
  input: SchedulerInput,
  w: SchedulerInput["waiters"][number],
  weekday: number,
  date: string
) {
  // availability marks days the waiter can NOT work: {"1": false} = Mondays off
  if (w.availability?.[String(weekday)] === false) return false;
  if (input.timeOff?.[w.id]?.includes(date)) return false;
  return true;
}

/** All open (date × template) slots of the week, chronologically. */
export function weekSlots(input: SchedulerInput) {
  const slots: { date: string; weekday: number; template_id: string }[] = [];
  for (let d = 0; d < 7; d++) {
    const date = addDays(input.weekStart, d);
    const weekday = isoWeekday(date);
    if (!input.openingDays.includes(weekday)) continue;
    for (const tpl of input.templates) {
      slots.push({ date, weekday, template_id: tpl.id });
    }
  }
  return slots;
}

/**
 * Deterministic fair allocator. Fills every slot with the available waiter
 * who is furthest below their weekly target (ties → fewest total, then name).
 * Guarantees: one waiter per slot, max one shift per waiter per day.
 */
export function fallbackSchedule(input: SchedulerInput): Assignment[] {
  const counts = new Map(input.waiters.map((w) => [w.id, 0]));
  const byDay = new Map<string, Set<string>>();
  const assignments: Assignment[] = [];

  for (const slot of weekSlots(input)) {
    const busyToday = byDay.get(slot.date) ?? new Set<string>();
    const candidates = input.waiters
      .filter((w) => isAvailable(input, w, slot.weekday, slot.date) && !busyToday.has(w.id))
      .sort((a, b) => {
        const defA = a.target_shifts_per_week - (counts.get(a.id) ?? 0);
        const defB = b.target_shifts_per_week - (counts.get(b.id) ?? 0);
        if (defB !== defA) return defB - defA;
        const totalA = counts.get(a.id) ?? 0;
        const totalB = counts.get(b.id) ?? 0;
        if (totalA !== totalB) return totalA - totalB;
        return a.name.localeCompare(b.name);
      });

    // Relax the availability constraint only if nobody is free that day.
    const pick =
      candidates[0] ??
      input.waiters
        .filter((w) => !busyToday.has(w.id))
        .sort(
          (a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0)
        )[0];
    if (!pick) continue; // more templates per day than waiters

    counts.set(pick.id, (counts.get(pick.id) ?? 0) + 1);
    busyToday.add(pick.id);
    byDay.set(slot.date, busyToday);
    assignments.push({
      date: slot.date,
      template_id: slot.template_id,
      waiter_id: pick.id,
    });
  }
  return assignments;
}

/**
 * Validates AI output and repairs it: drops invalid/duplicate entries and
 * fills uncovered slots with the fallback picker. Always returns a full,
 * consistent week.
 */
export function validateAndRepair(
  input: SchedulerInput,
  raw: Assignment[]
): Assignment[] {
  const waiterIds = new Set(input.waiters.map((w) => w.id));
  const templateIds = new Set(input.templates.map((t) => t.id));
  const slots = weekSlots(input);
  const slotKey = (a: { date: string; template_id: string }) =>
    `${a.date}|${a.template_id}`;
  const validSlots = new Set(slots.map(slotKey));

  const filledSlots = new Set<string>();
  const byDay = new Map<string, Set<string>>();
  const accepted: Assignment[] = [];

  for (const a of raw) {
    if (!waiterIds.has(a.waiter_id) || !templateIds.has(a.template_id)) continue;
    const key = slotKey(a);
    if (!validSlots.has(key) || filledSlots.has(key)) continue;
    const busy = byDay.get(a.date) ?? new Set<string>();
    if (busy.has(a.waiter_id)) continue;
    busy.add(a.waiter_id);
    byDay.set(a.date, busy);
    filledSlots.add(key);
    accepted.push(a);
  }

  // Fill any remaining gaps fairly.
  const counts = new Map<string, number>(input.waiters.map((w) => [w.id, 0]));
  for (const a of accepted) counts.set(a.waiter_id, (counts.get(a.waiter_id) ?? 0) + 1);

  for (const slot of slots) {
    if (filledSlots.has(slotKey(slot))) continue;
    const busyToday = byDay.get(slot.date) ?? new Set<string>();
    const pick = input.waiters
      .filter((w) => !busyToday.has(w.id))
      .sort((a, b) => {
        const defA = a.target_shifts_per_week - (counts.get(a.id) ?? 0);
        const defB = b.target_shifts_per_week - (counts.get(b.id) ?? 0);
        return defB - defA;
      })[0];
    if (!pick) continue;
    counts.set(pick.id, (counts.get(pick.id) ?? 0) + 1);
    busyToday.add(pick.id);
    byDay.set(slot.date, busyToday);
    accepted.push({
      date: slot.date,
      template_id: slot.template_id,
      waiter_id: pick.id,
    });
  }

  return accepted;
}
