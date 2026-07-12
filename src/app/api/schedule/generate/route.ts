import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fallbackSchedule,
  validateAndRepair,
  type Assignment,
  type SchedulerInput,
} from "@/lib/scheduler";
import type { ShiftTemplate, Waiter } from "@/lib/types";

export const maxDuration = 60;

const SCHEDULER_SYSTEM_PROMPT = `You are a fair shift scheduler for a café. You receive JSON with:
- weekStart (Monday, YYYY-MM-DD), openingDays (ISO weekdays 1=Mon..7=Sun)
- waiters: id, name, target_shifts_per_week, availability (a map where "3": false means the waiter can NOT work on weekday 3)
- templates: shift templates with id, name, start_time, end_time
- timeOff: approved days off, a map waiter_id -> ["YYYY-MM-DD", ...]; NEVER schedule a waiter on such a date

Create the weekly schedule. Rules, in priority order:
1. Every opening day × every template gets EXACTLY one waiter.
2. A waiter works at most one shift per day.
3. Never assign a waiter on a weekday where their availability is false, unless there is no other option.
4. Distribute shifts so each waiter ends as close as possible to their target_shifts_per_week; spread any unavoidable deviation evenly.
5. Prefer giving each waiter consecutive days off where possible.

Return assignments for the whole week and a 1-2 sentence "notes" summary in Croatian explaining fairness decisions (e.g. who got more/fewer shifts than requested and why).`;

const OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    assignments: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          date: { type: "string" as const, description: "YYYY-MM-DD within the week" },
          template_id: { type: "string" as const },
          waiter_id: { type: "string" as const },
        },
        required: ["date", "template_id", "waiter_id"],
        additionalProperties: false,
      },
    },
    notes: {
      type: "string" as const,
      description: "Short Croatian summary of fairness decisions",
    },
  },
  required: ["assignments", "notes"],
  additionalProperties: false,
};

async function generateWithClaude(
  input: SchedulerInput
): Promise<{ assignments: Assignment[]; notes: string } | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      system: SCHEDULER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(input) }],
      output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    });
    if (response.stop_reason === "refusal") return null;
    const text = response.content.find((b) => b.type === "text");
    if (!text) return null;
    return JSON.parse(text.text);
  } catch (err) {
    console.error("AI schedule generation failed, using fallback:", err);
    return null;
  }
}

export async function POST(request: Request) {
  // Owner auth via RLS-scoped client
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const weekStart: string | undefined = body?.weekStart;
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json({ error: "invalid_week" }, { status: 400 });
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!venue) return NextResponse.json({ error: "no_venue" }, { status: 404 });

  const weekEnd = new Date(weekStart + "T12:00:00");
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const [{ data: waiters }, { data: templates }, { data: timeOffRows }] = await Promise.all([
    supabase.from("waiters").select("*").eq("venue_id", venue.id).eq("active", true),
    supabase
      .from("shift_templates")
      .select("*")
      .eq("venue_id", venue.id)
      .eq("active", true)
      .order("position"),
    supabase
      .from("time_off_requests")
      .select("waiter_id, off_date")
      .eq("venue_id", venue.id)
      .eq("status", "approved")
      .gte("off_date", weekStart)
      .lte("off_date", weekEndStr),
  ]);

  if (!waiters?.length || !templates?.length) {
    return NextResponse.json({ error: "need_data" }, { status: 422 });
  }

  const timeOff: Record<string, string[]> = {};
  for (const row of timeOffRows ?? []) {
    (timeOff[row.waiter_id] ??= []).push(row.off_date);
  }

  const input: SchedulerInput = {
    weekStart,
    openingDays: venue.opening_days,
    waiters: waiters as Waiter[],
    templates: templates as ShiftTemplate[],
    timeOff,
  };

  const aiResult = await generateWithClaude(input);
  const assignments = aiResult
    ? validateAndRepair(input, aiResult.assignments)
    : fallbackSchedule(input);
  const generatedBy = aiResult ? "ai" : "fallback";

  // Persist: upsert draft schedule, replace its shifts. Bulk insert needs the
  // admin client only for the upsert-then-delete sequence speed; RLS-scoped
  // client works too since the owner owns the venue — keep it RLS-scoped.
  const { data: schedule, error: scheduleError } = await supabase
    .from("schedules")
    .upsert(
      {
        venue_id: venue.id,
        week_start: weekStart,
        status: "draft",
        generated_by: generatedBy,
        ai_notes: aiResult?.notes ?? null,
      },
      { onConflict: "venue_id,week_start" }
    )
    .select()
    .single();
  if (scheduleError || !schedule) {
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  const admin = createAdminClient();
  await admin.from("shifts").delete().eq("schedule_id", schedule.id);

  const templateById = new Map(templates.map((t) => [t.id, t]));
  const { error: shiftsError } = await admin.from("shifts").insert(
    assignments.map((a) => ({
      schedule_id: schedule.id,
      venue_id: venue.id,
      waiter_id: a.waiter_id,
      template_id: a.template_id,
      shift_date: a.date,
      start_time: templateById.get(a.template_id)!.start_time,
      end_time: templateById.get(a.template_id)!.end_time,
    }))
  );
  if (shiftsError) {
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    scheduleId: schedule.id,
    generatedBy,
    notes: aiResult?.notes ?? null,
    count: assignments.length,
  });
}
