import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getT } from "@/lib/i18n/server";
import AuthModal from "@/components/AuthModal";
import Icon from "@/components/Icon";
import LandingScene from "@/components/LandingScene";

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
    <div className="-my-10 grid min-h-[calc(100vh-60px)] grid-cols-1 md:grid-cols-[1.05fr_1fr]">
      {/* Left — copy + CTAs */}
      <div className="flex flex-col justify-center gap-6 px-6 py-14 sm:px-10 md:px-16">
        <h1 className="lp-headline">
          {t("landing.headlineLead")}
          <span style={{ color: "var(--accent)" }}>
            {t("landing.headlineAccent")}
          </span>
          {t("landing.headlineTail")}
        </h1>

        <p className="max-w-[460px] text-lg leading-relaxed text-muted">
          {t("landing.subtitle")}
        </p>

        <div className="flex flex-wrap gap-3">
          {user ? (
            <>
              <Link className="btn-primary !h-12 !px-6 !text-base" href="/dashboard">
                <Icon name="arrow-right" size={17} />
                {t("landing.ctaDashboard")}
              </Link>
              <Link
                className="btn-ghost !h-12 !px-6 !text-base"
                href="/dashboard/new"
              >
                <Icon name="plus" size={16} />
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

        <div className="flex flex-wrap gap-x-6 gap-y-2.5">
          {FEATURES.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted"
            >
              <span style={{ color: "var(--gold-700)" }}>
                <Icon name={f.icon} size={16} />
              </span>
              {t(f.key)}
            </span>
          ))}
        </div>
      </div>

      {/* Right — animated sailboat scene */}
      <div className="relative min-h-[340px] md:min-h-0">
        <LandingScene />
      </div>
    </div>
  );
}
