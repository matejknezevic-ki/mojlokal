"use client";

import { createContext, useContext, type ReactNode } from "react";
import { hr, type TKey } from "./hr";
import { de } from "./de";
import type { Locale } from "./index";

const dicts: Record<Locale, Record<TKey, string>> = { hr, de };

const LocaleContext = createContext<Locale>("hr");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT() {
  const locale = useContext(LocaleContext);
  const dict = dicts[locale] ?? hr;
  return (key: TKey) => dict[key];
}
