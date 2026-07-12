import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );
}

/** Sends a push notification to every subscribed waiter of a venue. Fire-and-forget. */
export async function notifyVenueWaiters(
  venueId: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!configured()) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:info@mojlokal.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("venue_id", venueId);

  await Promise.allSettled(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        // 404/410 = subscription expired — clean it up
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    })
  );
}
