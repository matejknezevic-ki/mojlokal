"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, KeyRound } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button, Card, Input, Label } from "@/components/ui";
import { completeOnboarding } from "./actions";

type WaiterDraft = { name: string; targetShifts: number };
type TemplateDraft = { name: string; start: string; end: string };

const TOTAL_STEPS = 4;

export function OnboardingWizard() {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [venueName, setVenueName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [city, setCity] = useState("");
  const [waiters, setWaiters] = useState<WaiterDraft[]>([
    { name: "", targetShifts: 5 },
    { name: "", targetShifts: 5 },
  ]);
  const [templates, setTemplates] = useState<TemplateDraft[]>([]);
  const [openingDays, setOpeningDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [initializedDefaults, setInitializedDefaults] = useState(false);

  const [pins, setPins] = useState<{ name: string; pin: string }[] | null>(null);
  const [slug, setSlug] = useState<string>("");

  // Defaults use translated labels, so they're seeded lazily on first render.
  if (!initializedDefaults) {
    setTemplates([
      { name: t("onboarding.defaultMorning"), start: "06:00", end: "14:00" },
      { name: t("onboarding.defaultEvening"), start: "14:00", end: "22:00" },
    ]);
    setChecklist([
      t("onboarding.defaultCheck1"),
      t("onboarding.defaultCheck2"),
      t("onboarding.defaultCheck3"),
      t("onboarding.defaultCheck4"),
    ]);
    setInitializedDefaults(true);
  }

  const validWaiters = waiters.filter((w) => w.name.trim());
  const validTemplates = templates.filter((s) => s.name.trim() && s.start && s.end);

  const canNext =
    step === 1
      ? venueName.trim().length > 0 &&
        ownerName.trim().length > 0 &&
        city.trim().length > 0
      : step === 2
        ? validWaiters.length > 0
        : step === 3
          ? validTemplates.length > 0 && openingDays.length > 0
          : true;

  async function finish() {
    setBusy(true);
    setError(null);
    const result = await completeOnboarding({
      venueName,
      ownerName,
      city,
      waiters: validWaiters,
      templates: validTemplates,
      openingDays,
      checklist,
    });
    setBusy(false);
    if (!result.ok) {
      setError(t("common.error"));
      return;
    }
    setPins(result.pins);
    setSlug(result.slug);
  }

  // PIN reveal screen after successful setup
  if (pins) {
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-terracotta" />
          <h2 className="font-display text-xl font-semibold">
            {t("onboarding.pinsTitle")}
          </h2>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-espresso-light">
          {t("onboarding.pinsSubtitle")}
        </p>
        <ul className="space-y-2">
          {pins.map((p) => (
            <li
              key={p.name}
              className="flex items-center justify-between rounded-xl bg-cream-dark px-4 py-3"
            >
              <span className="font-semibold">{p.name}</span>
              <span className="font-display text-2xl font-bold tracking-[0.3em] text-terracotta">
                {p.pin}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl bg-sage-light px-4 py-3 text-xs text-sage-dark">
          {`${typeof window !== "undefined" ? window.location.origin : ""}/w/${slug}`}
        </p>
        <Button
          size="lg"
          className="mt-6 w-full"
          onClick={() => {
            router.push("/admin");
            router.refresh();
          }}
        >
          {t("onboarding.pinsDone")}
        </Button>
      </Card>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-5 flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < step ? "bg-terracotta" : "bg-espresso/10"
            }`}
          />
        ))}
      </div>
      <p className="mb-4 text-xs font-bold uppercase tracking-wide text-espresso/40">
        {t("onboarding.step")} {step} {t("onboarding.of")} {TOTAL_STEPS}
      </p>

      <Card className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">
              {t("onboarding.venueTitle")}
            </h2>
            <div>
              <Label htmlFor="venueName">{t("onboarding.venueName")}</Label>
              <Input
                id="venueName"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder={t("onboarding.venueNamePlaceholder")}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="ownerName">{t("onboarding.ownerName")}</Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder={t("onboarding.ownerNamePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="city">{t("onboarding.city")}</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t("onboarding.cityPlaceholder")}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">
              {t("onboarding.waitersTitle")}
            </h2>
            <p className="text-sm text-espresso-light">
              {t("onboarding.waitersSubtitle")}
            </p>
            <div className="space-y-3">
              {waiters.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={w.name}
                    onChange={(e) =>
                      setWaiters(
                        waiters.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                    placeholder={t("onboarding.waiterName")}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={1}
                      max={14}
                      value={w.targetShifts}
                      onChange={(e) =>
                        setWaiters(
                          waiters.map((x, j) =>
                            j === i
                              ? { ...x, targetShifts: Number(e.target.value) || 1 }
                              : x
                          )
                        )
                      }
                      className="w-16 text-center"
                    />
                    <span className="hidden text-xs text-espresso/50 sm:block">
                      {t("onboarding.shiftsPerWeek")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWaiters(waiters.filter((_, j) => j !== i))}
                    className="rounded-lg p-2 text-espresso/40 hover:bg-danger/10 hover:text-danger"
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setWaiters([...waiters, { name: "", targetShifts: 5 }])}
            >
              <Plus className="h-4 w-4" /> {t("onboarding.addWaiter")}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">
              {t("onboarding.shiftsTitle")}
            </h2>
            <p className="text-sm text-espresso-light">
              {t("onboarding.shiftsSubtitle")}
            </p>
            <div className="space-y-3">
              {templates.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={s.name}
                    onChange={(e) =>
                      setTemplates(
                        templates.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                    placeholder={t("onboarding.shiftName")}
                    className="flex-1"
                  />
                  <Input
                    type="time"
                    value={s.start}
                    onChange={(e) =>
                      setTemplates(
                        templates.map((x, j) =>
                          j === i ? { ...x, start: e.target.value } : x
                        )
                      )
                    }
                    className="w-28"
                  />
                  <Input
                    type="time"
                    value={s.end}
                    onChange={(e) =>
                      setTemplates(
                        templates.map((x, j) =>
                          j === i ? { ...x, end: e.target.value } : x
                        )
                      )
                    }
                    className="w-28"
                  />
                  <button
                    type="button"
                    onClick={() => setTemplates(templates.filter((_, j) => j !== i))}
                    className="rounded-lg p-2 text-espresso/40 hover:bg-danger/10 hover:text-danger"
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() =>
                setTemplates([...templates, { name: "", start: "08:00", end: "16:00" }])
              }
            >
              <Plus className="h-4 w-4" /> {t("onboarding.addShift")}
            </Button>

            <div>
              <Label>{t("onboarding.openingDays")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setOpeningDays(
                        openingDays.includes(d)
                          ? openingDays.filter((x) => x !== d)
                          : [...openingDays, d].sort()
                      )
                    }
                    className={`min-w-[3rem] rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      openingDays.includes(d)
                        ? "bg-espresso text-cream"
                        : "bg-cream-dark text-espresso/50"
                    }`}
                  >
                    {t(`day.short.${d}` as Parameters<typeof t>[0])}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">
              {t("onboarding.checklistTitle")}
            </h2>
            <p className="text-sm text-espresso-light">
              {t("onboarding.checklistSubtitle")}
            </p>
            <div className="space-y-3">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) =>
                      setChecklist(
                        checklist.map((x, j) => (j === i ? e.target.value : x))
                      )
                    }
                    placeholder={t("onboarding.checklistPlaceholder")}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setChecklist(checklist.filter((_, j) => j !== i))}
                    className="rounded-lg p-2 text-espresso/40 hover:bg-danger/10 hover:text-danger"
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setChecklist([...checklist, ""])}
            >
              <Plus className="h-4 w-4" /> {t("onboarding.addItem")}
            </Button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <Button variant="ghost" type="button" onClick={() => setStep(step - 1)}>
              {t("common.back")}
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="flex-1"
            >
              {t("common.next")}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={busy}
              onClick={finish}
              className="flex-1"
            >
              {busy ? t("common.loading") : t("onboarding.finish")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
