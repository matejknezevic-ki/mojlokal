"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Square } from "lucide-react";
import { useT } from "@/lib/i18n/client";

function useElapsed(startedAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return "";
  const ms = now - new Date(startedAt).getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function StartShiftButton({
  openSession,
}: {
  openSession: { id: string; startedAt: string } | null;
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const elapsed = useElapsed(openSession?.startedAt ?? null);

  async function start() {
    setBusy(true);
    try {
      const res = await fetch("/api/waiter/shift/start", { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (openSession) {
    return (
      <div className="rounded-card bg-success-light p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 font-bold text-success">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-success" />
              {t("waiter.shiftRunning")}
            </p>
            <p className="mt-1 text-sm text-espresso-light">
              {t("waiter.startedAt")}{" "}
              {new Date(openSession.startedAt).toLocaleTimeString("hr-HR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <p className="font-display text-4xl font-bold tabular-nums text-success">
            {elapsed}
          </p>
        </div>
        <Link
          href="/w/app/zavrsi"
          className="mt-5 flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-espresso font-display text-lg font-bold text-cream transition-transform active:scale-[0.98]"
        >
          <Square className="h-5 w-5" />
          {t("waiter.endShift")}
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={busy}
      className="flex min-h-[180px] w-full flex-col items-center justify-center gap-3 rounded-card bg-terracotta font-display text-3xl font-bold text-white shadow-lifted transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      <Play className="h-10 w-10" fill="currentColor" />
      {busy ? t("common.loading") : t("waiter.startShift")}
    </button>
  );
}
