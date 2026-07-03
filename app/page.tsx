import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getT } from "@/lib/i18n/server";
import AuthModal from "@/components/AuthModal";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: "shield" as const, key: "landing.featGuardrails" },
  { icon: "message" as const, key: "landing.featDiscussion" },
  { icon: "sparkles" as const, key: "landing.featAI" },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const { t } = await getT();

  return (
    <div
      className="relative -my-10 flex min-h-[calc(100vh-60px)] flex-col items-center justify-center overflow-hidden px-4 text-center"
      style={{
        backgroundImage:
          "radial-gradient(var(--border-strong) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="mx-auto max-w-3xl py-10">
        <p className="eyebrow" style={{ color: "var(--gold-700)" }}>
          {t("landing.eyebrow")}
        </p>

        <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          {t("landing.headlineLead")}
          <span style={{ color: "var(--accent-press)" }}>
            {t("landing.headlineAccent")}
          </span>
          {t("landing.headlineTail")}
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          {t("landing.subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <>
              <Link className="btn-primary" href="/dashboard">
                <Icon name="arrow-right" size={16} />
                {t("landing.ctaDashboard")}
              </Link>
              <Link className="btn-ghost" href="/dashboard/new">
                <Icon name="plus" size={15} />
                {t("landing.ctaNew")}
              </Link>
            </>
          ) : (
            <>
              <AuthModal
                label={t("landing.ctaStart")}
                variant="primary"
                defaultTab="register"
              />
              <AuthModal
                label={t("landing.ctaLogin")}
                variant="ghost"
                defaultTab="login"
              />
            </>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {FEATURES.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
            >
              <span style={{ color: "var(--gold-700)" }}>
                <Icon name={f.icon} size={15} />
              </span>
              {t(f.key)}
            </span>
          ))}
        </div>

        <p className="mt-8 text-xs text-subtle">{t("landing.footnote")}</p>
      </div>
    </div>
  );
}
