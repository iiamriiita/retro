"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/messages";

export default function LangSwitcher() {
  const { locale } = useT();
  const router = useRouter();

  function set(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  const opts: { v: Locale; label: string }[] = [
    { v: "en", label: "EN" },
    { v: "zh", label: "中" },
  ];

  return (
    <div
      className="inline-flex items-center rounded-full p-0.5 text-xs font-semibold"
      style={{ background: "var(--surface-2)" }}
      role="group"
      aria-label="Language"
    >
      {opts.map((o) => {
        const active = o.v === locale;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => set(o.v)}
            aria-pressed={active}
            className="rounded-full px-2.5 py-1 transition-colors"
            style={
              active
                ? { background: "var(--accent)", color: "var(--text-inverse)" }
                : { color: "var(--text-muted)" }
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
