import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Server-only. Every query made with it
// MUST be explicitly scoped to the verified waiter session's venue_id/waiter_id
// (see src/lib/waiter-auth.ts) or to data that is intentionally public
// (venue name + waiter names on the waiter login screen).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
