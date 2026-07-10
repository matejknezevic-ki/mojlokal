import { cookies } from "next/headers";
import { hr, type TKey } from "./hr";
import { de } from "./de";

export type Locale = "hr" | "de";
export const LOCALE_COOKIE = "mojlokal_locale";

const dicts: Record<Locale, Record<TKey, string>> = { hr, de };

export function getDict(locale: Locale) {
  const dict = dicts[locale] ?? hr;
  const t = (key: TKey) => dict[key];
  return t;
}

export async function getLocale(fallback: Locale = "hr"): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "de" || value === "hr" ? value : fallback;
}

export async function getT(fallback: Locale = "hr") {
  return getDict(await getLocale(fallback));
}

export type { TKey };
