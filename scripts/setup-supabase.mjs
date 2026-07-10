#!/usr/bin/env node
/**
 * Einmaliges Setup: legt das Supabase-Projekt für mojlokal an, spielt die
 * Migration ein, deaktiviert die E-Mail-Bestätigung und schreibt .env.local.
 *
 * Benötigt einen Supabase Personal Access Token (sbp_...):
 *   https://supabase.com/dashboard/account/tokens
 *
 * Aufruf:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs
 *
 * Optional:
 *   SUPABASE_ORG_ID   (Default: fwgpmmaiyrbfmlfrwymn)
 *   SUPABASE_REGION   (Default: eu-central-1)
 *   PROJECT_NAME      (Default: mojlokal)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";

const API = "https://api.supabase.com";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const ORG_ID = process.env.SUPABASE_ORG_ID || "fwgpmmaiyrbfmlfrwymn";
const REGION = process.env.SUPABASE_REGION || "eu-central-1";
const NAME = process.env.PROJECT_NAME || "mojlokal";

if (!TOKEN) {
  console.error(
    "FEHLER: SUPABASE_ACCESS_TOKEN fehlt.\n" +
      "Token erstellen: https://supabase.com/dashboard/account/tokens\n" +
      "Dann: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs"
  );
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // 1. Existierendes Projekt wiederverwenden oder neu anlegen
  const projects = await api("GET", "/v1/projects");
  let project = projects.find((p) => p.name === NAME);

  if (project) {
    console.log(`Projekt "${NAME}" existiert bereits (${project.id}) — verwende es.`);
  } else {
    const dbPass = randomBytes(24).toString("base64url");
    console.log(`Lege Projekt "${NAME}" an (Org ${ORG_ID}, ${REGION})…`);
    project = await api("POST", "/v1/projects", {
      organization_id: ORG_ID,
      name: NAME,
      region: REGION,
      db_pass: dbPass,
    });
    console.log(`Projekt erstellt: ${project.id} (DB-Passwort: ${dbPass} — sicher ablegen!)`);
  }

  const ref = project.id;

  // 2. Warten bis die Datenbank bereit ist
  process.stdout.write("Warte auf Provisionierung");
  for (let i = 0; i < 60; i++) {
    const p = await api("GET", `/v1/projects/${ref}`);
    if (p.status === "ACTIVE_HEALTHY") break;
    process.stdout.write(".");
    await sleep(5000);
  }
  console.log(" bereit.");

  // 3. Migration einspielen (idempotent: überspringen, wenn Tabellen existieren)
  const check = await api("POST", `/v1/projects/${ref}/database/query`, {
    query: "select to_regclass('public.venues') as t",
  });
  const alreadyMigrated = Array.isArray(check) && check[0]?.t === "venues";
  if (alreadyMigrated) {
    console.log("Migration bereits eingespielt — überspringe.");
  } else {
    console.log("Spiele Migration ein…");
    const sql = readFileSync(
      new URL("../supabase/migrations/001_initial_schema.sql", import.meta.url),
      "utf8"
    );
    await api("POST", `/v1/projects/${ref}/database/query`, { query: sql });
    console.log("Migration OK.");
  }

  // 4. E-Mail-Bestätigung deaktivieren (Demo-freundliche Registrierung)
  try {
    await api("PATCH", `/v1/projects/${ref}/config/auth`, {
      mailer_autoconfirm: true,
    });
    console.log("E-Mail-Bestätigung deaktiviert.");
  } catch (err) {
    console.warn(
      "Konnte E-Mail-Bestätigung nicht automatisch deaktivieren — bitte im Dashboard: " +
        "Authentication → Sign In / Up → 'Confirm email' ausschalten.\n" +
        String(err)
    );
  }

  // 5. API-Keys holen
  const keys = await api("GET", `/v1/projects/${ref}/api-keys`);
  const anon = keys.find((k) => k.name === "anon")?.api_key;
  const serviceRole = keys.find((k) => k.name === "service_role")?.api_key;
  const url = `https://${ref}.supabase.co`;

  // 6. .env.local schreiben (WAITER_SESSION_SECRET erhalten, falls vorhanden)
  let waiterSecret = randomBytes(32).toString("hex");
  const envPath = new URL("../.env.local", import.meta.url);
  if (existsSync(envPath)) {
    const existing = readFileSync(envPath, "utf8");
    const m = existing.match(/^WAITER_SESSION_SECRET=(.+)$/m);
    if (m && !m[1].includes("change-me")) waiterSecret = m[1].trim();
  }
  const anthropicKey = process.env.ANTHROPIC_API_KEY || "";
  writeFileSync(
    envPath,
    [
      `NEXT_PUBLIC_SUPABASE_URL=${url}`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}`,
      `SUPABASE_SERVICE_ROLE_KEY=${serviceRole}`,
      `WAITER_SESSION_SECRET=${waiterSecret}`,
      `ANTHROPIC_API_KEY=${anthropicKey}`,
      "",
    ].join("\n")
  );
  console.log("\n.env.local geschrieben. Fertig! 🎉");
  console.log(`\nProjekt-URL: ${url}`);
  console.log("Diese Werte auch als Vercel-Env-Vars setzen (Production):");
  console.log(
    "  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,\n" +
      "  SUPABASE_SERVICE_ROLE_KEY, WAITER_SESSION_SECRET, ANTHROPIC_API_KEY"
  );
}

main().catch((err) => {
  console.error("\nSetup fehlgeschlagen:", err.message);
  process.exit(1);
});
