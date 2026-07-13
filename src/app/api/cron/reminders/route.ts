import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyWaiter } from "@/lib/push";
import { formatTime } from "@/lib/utils";

export const maxDuration = 120;

// Runs every evening (Vercel cron): reminds every waiter with a published
// shift TOMORROW. The cron URL carries ?key=CRON_SECRET.
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // "Tomorrow" in Croatian local time
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Zagreb" })
  );
  now.setDate(now.getDate() + 1);
  const tomorrow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const admin = createAdminClient();
  const { data: shifts } = await admin
    .from("shifts")
    .select("waiter_id, start_time, end_time, schedules!inner(status)")
    .eq("shift_date", tomorrow)
    .eq("schedules.status", "published");

  let sent = 0;
  await Promise.allSettled(
    (shifts ?? []).map(async (s) => {
      await notifyWaiter(s.waiter_id, {
        title: "mojlokal",
        body: `Podsjetnik: sutra radiš ${formatTime(s.start_time)}–${formatTime(s.end_time)} ⏰`,
        url: "/w/app",
      });
      sent++;
    })
  );

  return NextResponse.json({ ok: true, date: tomorrow, shifts: shifts?.length ?? 0, sent });
}
