# mojlokal ☕

**Raspored smjena i blagajna pod kontrolom — bez papira.**

Multi-Tenant-SaaS für Cafés und Bars in Kroatien: KI-Schichtplan, Arbeitszeiterfassung per START/ENDE-Button und Kassastand-Pflicht mit Checkliste am Schichtende. UI komplett auf Kroatisch, umschaltbar auf Deutsch.

## Features

- **Onboarding-Wizard** — Chef registriert sich, legt Lokal, Kellner (mit Soll-Schichten/Woche), Schichtzeiten und Checkliste in 2 Minuten an. PINs werden automatisch generiert und einmalig angezeigt.
- **KI-Wochenplan** — Ein Klick, Claude generiert einen fairen Plan (Verfügbarkeiten, Soll-Schichten, max. 1 Schicht/Tag). Ohne `ANTHROPIC_API_KEY` läuft ein deterministischer Fairness-Allokator. Manuell anpassbar, dann „Objavi raspored“.
- **Kellner-Flow (mobile-first)** — Kellner öffnet `/w/{lokal-code}`, tippt seinen Namen + 4-stelligen PIN. Riesiger START-Button bei Schichtbeginn. Schichtende erst möglich, wenn **alle Checklisten-Punkte abgehakt** und der **Kassastand eingegeben** ist (serverseitig erzwungen, atomar per Postgres-RPC).
- **Admin-Bereich** — Dashboard (wer arbeitet gerade), Raspored, Kellner (PIN-Reset, Verfügbarkeit), Schichtzeiten, Checkliste, Blagajna-Historie, Arbeitsstunden, Einstellungen mit Kellner-Link + QR-Code.

## Stack

Next.js 16 (App Router) · Tailwind v4 · Supabase (Postgres, Auth, RLS) · Anthropic API · Vercel

## Setup

**Schnellweg (automatisch):** Personal Access Token unter
[supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) erstellen, dann:

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs
```

Das Skript legt das Projekt an, spielt die Migration ein, deaktiviert die E-Mail-Bestätigung und schreibt `.env.local`.

**Manuell:**

1. **Supabase-Projekt anlegen** und die Migration ausführen:
   `supabase/migrations/001_initial_schema.sql` (Tabellen + RLS + `end_shift`-RPC).
   In den Auth-Einstellungen **E-Mail-Bestätigung deaktivieren** (sonst blockiert die Registrierung im Demo).
2. **Env-Vars** setzen (siehe `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `WAITER_SESSION_SECRET` (32+ zufällige Zeichen)
   - `ANTHROPIC_API_KEY` (optional — für echte KI-Planung)
3. `npm install && npm run dev`

## Sicherheitsmodell

- **Chef**: Supabase-Auth (E-Mail/Passwort). Alle Zugriffe über den SSR-Client → Row Level Security scoped auf eigene Venues.
- **Kellner**: kein Supabase-Konto. PIN wird serverseitig per bcrypt geprüft (5 Fehlversuche → 15 min Sperre), Session als signiertes JWT (HttpOnly-Cookie, 14 h). Alle Kellner-Zugriffe laufen über API-Routes mit Service-Role-Client, explizit auf `{venue_id, waiter_id}` der verifizierten Session gescoped.
- **Schichtende**: `end_shift`-RPC validiert Checkliste + Kassastand in einer Transaktion — die UI-Sperre ist nur Komfort, der Server ist die Autorität.
