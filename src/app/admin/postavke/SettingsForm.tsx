"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Copy, LogOut, QrCode } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button, Card, Input, Label } from "@/components/ui";
import { signOut, updateVenueSettings } from "../actions";
import type { Venue } from "@/lib/types";

export function SettingsForm({ venue }: { venue: Venue }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(venue.name);
  const [ownerName, setOwnerName] = useState(venue.owner_name ?? "");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [waiterUrl, setWaiterUrl] = useState(`/w/${venue.slug}`);

  useEffect(() => {
    setWaiterUrl(`${window.location.origin}/w/${venue.slug}`);
  }, [venue.slug]);

  useEffect(() => {
    if (showQr && waiterUrl.startsWith("http")) {
      QRCode.toDataURL(waiterUrl, { width: 280, margin: 2 }).then(setQrDataUrl);
    }
  }, [showQr, waiterUrl]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateVenueSettings(venue.id, { name, ownerName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(waiterUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label htmlFor="venueName">{t("settings.venueName")}</Label>
            <Input
              id="venueName"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ownerName">{t("settings.ownerName")}</Label>
            <Input
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {t("common.save")}
            </Button>
            {saved && (
              <span className="text-sm font-semibold text-success">
                {t("settings.saved")}
              </span>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold">
          {t("settings.waiterAccess")}
        </h2>
        <p className="mt-1 text-sm text-espresso-light">
          {t("settings.waiterAccessHint")}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="flex-1 truncate rounded-xl bg-cream-dark px-4 py-3 text-sm font-semibold">
            {waiterUrl}
          </code>
          <Button variant="ghost" type="button" onClick={copyLink}>
            <Copy className="h-4 w-4" />
            {copied ? t("settings.copied") : t("settings.copyLink")}
          </Button>
          <Button variant="ghost" type="button" onClick={() => setShowQr(!showQr)}>
            <QrCode className="h-4 w-4" /> QR
          </Button>
        </div>
        {showQr && qrDataUrl && (
          <div className="mt-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={waiterUrl}
              className="rounded-xl border border-espresso/10"
              width={280}
              height={280}
            />
          </div>
        )}
      </Card>

      <Card className="p-5">
        <Button
          variant="ghost"
          onClick={() => startTransition(() => signOut())}
          disabled={pending}
        >
          <LogOut className="h-4 w-4" /> {t("common.logout")}
        </Button>
      </Card>
    </div>
  );
}
