"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { translate, type Locale, type TFunc } from "./messages";

interface LocaleCtxValue {
  locale: Locale;
  t: TFunc;
}

const LocaleCtx = createContext<LocaleCtxValue>({
  locale: "en",
  t: (key) => key,
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = useCallback<TFunc>(
    (key, vars) => translate(locale, key, vars),
    [locale],
  );
  const value = useMemo(() => ({ locale, t }), [locale, t]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useT(): LocaleCtxValue {
  return useContext(LocaleCtx);
}
