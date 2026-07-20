"use server";

import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { generatePin, slugify } from "@/lib/utils";

export type OnboardingInput = {
  venueName: string;
  ownerName: string;
  city: string;
  waiters: { name: string; targetShifts: number }[];
  templates: { name: string; start: string; end: string }[];
  openingDays: number[];
  checklist: string[];
};

export type OnboardingResult =
  | { ok: true; slug: string; pins: { name: string; pin: string }[] }
  | { ok: false; error: string };

export async function completeOnboarding(
  input: OnboardingInput
): Promise<OnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const venueName = input.venueName.trim();
  const waiters = input.waiters
    .map((w) => ({ name: w.name.trim(), targetShifts: w.targetShifts }))
    .filter((w) => w.name.length > 0);
  const templates = input.templates.filter((s) => s.name.trim() && s.start && s.end);
  const checklist = input.checklist.map((c) => c.trim()).filter(Boolean);

  if (!venueName || waiters.length === 0 || templates.length === 0) {
    return { ok: false, error: "invalid" };
  }

  // Unique slug: append a numeric suffix on collision.
  const base = slugify(venueName);
  let slug = base;
  for (let attempt = 1; attempt < 20; attempt++) {
    const { data } = await supabase
      .from("venues")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) break;
    slug = `${base}-${attempt + 1}`;
  }

  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .insert({
      owner_id: user.id,
      name: venueName,
      slug,
      owner_name: input.ownerName.trim() || null,
      city: input.city.trim() || null,
      opening_days: input.openingDays.length ? input.openingDays : [1, 2, 3, 4, 5, 6, 7],
      onboarded_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (venueError || !venue) return { ok: false, error: "venue" };

  const pins = waiters.map((w) => ({ name: w.name, pin: generatePin() }));
  const { error: waitersError } = await supabase.from("waiters").insert(
    waiters.map((w, i) => ({
      venue_id: venue.id,
      name: w.name,
      pin_hash: bcrypt.hashSync(pins[i].pin, 10),
      target_shifts_per_week: Math.max(0, Math.min(14, w.targetShifts)),
    }))
  );
  if (waitersError) return { ok: false, error: "waiters" };

  const { error: templatesError } = await supabase.from("shift_templates").insert(
    templates.map((s, i) => ({
      venue_id: venue.id,
      name: s.name.trim(),
      start_time: s.start,
      end_time: s.end,
      position: i,
    }))
  );
  if (templatesError) return { ok: false, error: "templates" };

  if (checklist.length > 0) {
    const { error: checklistError } = await supabase.from("checklist_items").insert(
      checklist.map((label, i) => ({
        venue_id: venue.id,
        label,
        position: i,
      }))
    );
    if (checklistError) return { ok: false, error: "checklist" };
  }

  return { ok: true, slug, pins };
}
