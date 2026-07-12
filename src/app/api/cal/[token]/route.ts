import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Personal iCal feed: published upcoming shifts of one waiter, authenticated
// by the unguessable calendar_token (standard pattern for calendar subscriptions).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/.test(token)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const admin = createAdminClient();
  const { data: waiter } = await admin
    .from("waiters")
    .select("id, venue_id, name")
    .eq("calendar_token", token)
    .maybeSingle();
  if (!waiter) return new NextResponse("Not found", { status: 404 });

  const { data: venue } = await admin
    .from("venues")
    .select("name")
    .eq("id", waiter.venue_id)
    .single();

  const since = new Date();
  since.setDate(since.getDate() - 14);
  const { data: shifts } = await admin
    .from("shifts")
    .select("id, shift_date, start_time, end_time, schedules!inner(status)")
    .eq("waiter_id", waiter.id)
    .eq("venue_id", waiter.venue_id)
    .eq("schedules.status", "published")
    .gte("shift_date", since.toISOString().slice(0, 10))
    .order("shift_date");

  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//mojlokal//smjene//HR",
    `X-WR-CALNAME:${venue?.name ?? "mojlokal"} — smjene`,
    "X-WR-TIMEZONE:Europe/Zagreb",
  ];
  for (const s of shifts ?? []) {
    const date = s.shift_date.replace(/-/g, "");
    const start = s.start_time.slice(0, 5).replace(":", "") + "00";
    const end = s.end_time.slice(0, 5).replace(":", "") + "00";
    // Overnight shift: end lands on the next day
    const endDate =
      s.end_time <= s.start_time
        ? new Date(s.shift_date + "T12:00:00")
        : null;
    let endDateStr = date;
    if (endDate) {
      endDate.setDate(endDate.getDate() + 1);
      endDateStr = endDate.toISOString().slice(0, 10).replace(/-/g, "");
    }
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@mojlokal`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Zagreb:${date}T${start}`,
      `DTEND;TZID=Europe/Zagreb:${endDateStr}T${end}`,
      `SUMMARY:Smjena — ${venue?.name ?? "mojlokal"}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="smjene.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
