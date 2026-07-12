"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, CalendarPlus, Check } from "lucide-react";
import { useT } from "@/lib/i18n/client";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function QuickActions({ calendarToken }: { calendarToken: string }) {
  const t = useT();
  const [pushState, setPushState] = useState<
    "unknown" | "unsupported" | "off" | "on" | "denied"
  >("unknown");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setPushState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setPushState(sub ? "on" : "off");
      } catch {
        setPushState("off");
      }
    })();
  }, []);

  async function enablePush() {
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      const res = await fetch("/api/waiter/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (res.ok) setPushState("on");
      else setError(t("common.error"));
    } catch {
      setError(t("push.unsupported"));
    }
  }

  async function copyCalendar() {
    const url = `${window.location.origin}/api/cal/${calendarToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 4000);
  }

  return (
    <section className="space-y-2">
      {pushState === "off" && (
        <button
          type="button"
          onClick={enablePush}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-espresso/15 py-3 text-sm font-semibold text-espresso hover:bg-espresso/5"
        >
          <Bell className="h-4 w-4" /> {t("push.enable")}
        </button>
      )}
      {pushState === "on" && (
        <p className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-success">
          <BellRing className="h-3.5 w-3.5" /> {t("push.enabled")}
        </p>
      )}
      {pushState === "denied" && (
        <p className="text-center text-xs text-espresso/50">{t("push.denied")}</p>
      )}

      <button
        type="button"
        onClick={copyCalendar}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-espresso/15 py-3 text-sm font-semibold text-espresso hover:bg-espresso/5"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-success" /> {t("cal.copied")}
          </>
        ) : (
          <>
            <CalendarPlus className="h-4 w-4" /> {t("cal.button")}
          </>
        )}
      </button>

      {error && <p className="text-center text-xs text-danger">{error}</p>}
    </section>
  );
}
