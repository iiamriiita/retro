import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  translate,
  type Locale,
  type TFunc,
} from "./messages";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return v === "en" || v === "zh" ? v : DEFAULT_LOCALE;
}

// Server-side translator bound to the request's locale cookie.
export async function getT(): Promise<{ locale: Locale; t: TFunc }> {
  const locale = await getLocale();
  const t: TFunc = (key, vars) => translate(locale, key, vars);
  return { locale, t };
}
