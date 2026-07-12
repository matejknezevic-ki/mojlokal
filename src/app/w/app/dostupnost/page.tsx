import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWaiterSession } from "@/lib/waiter-auth";
import { getT } from "@/lib/i18n";
import { PageTitle } from "@/components/ui";
import type { TimeOffRequest } from "@/lib/types";
import { AvailabilityManager } from "./AvailabilityManager";

export default async function AvailabilityPage() {
  const session = await getWaiterSession();
  if (!session) redirect("/w");
  const t = await getT();

  const admin = createAdminClient();
  const [meRes, timeOffRes] = await Promise.all([
    admin
      .from("waiters")
      .select("availability")
      .eq("id", session.waiterId)
      .single(),
    admin
      .from("time_off_requests")
      .select("*")
      .eq("waiter_id", session.waiterId)
      .gte("off_date", new Date().toISOString().slice(0, 10))
      .order("off_date"),
  ]);

  return (
    <div className="space-y-5">
      <PageTitle>{t("avail.title")}</PageTitle>
      <AvailabilityManager
        availability={(meRes.data?.availability ?? {}) as Record<string, boolean>}
        requests={(timeOffRes.data ?? []) as TimeOffRequest[]}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
